// Core vaccine schedule generation logic
// Implements CDC standard and catch-up schedules with:
//   - Randomized dates (within valid windows, never below minimums)
//   - Skip: weekends, Jewish Yomim Tovim (all days/Chol HaMoed), US federal holidays

import { GradeLevel, StateVaccineRequirement, getVaccinesForGrade } from "@/data/stateVaccines";
import { CDC_SCHEDULE, CATCH_UP_DOSE_MAP, VaccineSchedule } from "@/data/cdcSchedule";
import { addDays, isWeekend, isHoliday, getAllSkipDates, formatDate, formatDateShort } from "@/data/holidays";

export interface ScheduledDose {
  vaccine: string;
  shortName: string;
  doseNumber: number;
  totalDoses: number;
  scheduledDate: Date;
  scheduledDateFormatted: string;
  scheduledDateShort: string;
  ageAtDose?: string; // e.g., "2 months"
  notes?: string;
  isCatchUp: boolean;
}

export interface ScheduleAppointment {
  date: Date;
  dateFormatted: string;
  dateShort: string;
  ageLabel: string; // e.g., "2 months" or "Age 11"
  doses: ScheduledDose[];
}

export interface GeneratedSchedule {
  appointments: ScheduleAppointment[];
  stateCode: string;
  stateName: string;
  startMode: "birth" | "catchup";
  entryGrade?: GradeLevel;
  startDate: Date;
  birthDate?: Date;
  vaccinesIncluded: string[];
  totalAppointments: number;
  disclaimer: string;
}

// Seeded pseudo-random (deterministic per child's start date for reproducibility)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Get a random integer in [min, max] inclusive
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Advance a date past all skip days
function nextValidDate(
  date: Date,
  skipDates: Date[]
): Date {
  let d = new Date(date);
  while (isWeekend(d) || isHoliday(d, skipDates)) {
    d = addDays(d, 1);
  }
  return d;
}

// Format age relative to birth date
function formatAge(date: Date, birthDate: Date): string {
  const diffMs = date.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30.44);
  const years = Math.floor(months / 12);

  if (months < 1) return `${diffDays} days`;
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} yr ${remMonths} mo`;
}

function formatAgeFromGrade(entryGrade: GradeLevel): string {
  const gradeAges: Record<GradeLevel, string> = {
    PK: "Age 4",
    K: "Age 5-6",
    "1": "Age 6-7",
    "2": "Age 7-8",
    "3": "Age 8-9",
    "4": "Age 9-10",
    "5": "Age 10-11",
    "6": "Age 11-12",
    "7": "Age 12-13",
    "8": "Age 13-14",
    "9": "Age 14-15",
    "10": "Age 15-16",
    "11": "Age 16-17",
    "12": "Age 17-18",
  };
  return gradeAges[entryGrade] || "Unknown age";
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD SCHEDULE (starting from birth)
// ─────────────────────────────────────────────────────────────────────────────

export function generateStandardSchedule(
  stateCode: string,
  stateName: string,
  birthDate: Date,
  stateRequirements: StateVaccineRequirement[]
): GeneratedSchedule {
  const rng = seededRandom(birthDate.getTime() % 999983);
  const startYear = birthDate.getFullYear();
  const endYear = birthDate.getFullYear() + 19;
  const skipDates = getAllSkipDates(startYear, endYear);

  const vaccineNames = stateRequirements.map((r) => r.shortName);
  const allDoses: ScheduledDose[] = [];

  // Track last scheduled date per vaccine for interval enforcement
  const lastDoseDates: Record<string, Date> = {};

  for (const req of stateRequirements) {
    const cdcInfo: VaccineSchedule | undefined = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    const dosesToSchedule = Math.min(req.totalDoses, cdcInfo.doses.length);

    for (let i = 0; i < dosesToSchedule; i++) {
      const doseInfo = cdcInfo.doses[i];

      // Calculate target date from birth
      const recommendedDays = Math.round(doseInfo.recommendedAgeMonths * 30.44);
      const minDays = Math.round(doseInfo.minAgeMonths * 30.44);

      // Start from recommended age + random jitter (0-14 days)
      const jitter = randInt(rng, 0, 14);
      let targetDate = addDays(birthDate, recommendedDays + jitter);

      // Enforce minimum age
      const minAgeDate = addDays(birthDate, minDays);
      if (targetDate < minAgeDate) targetDate = minAgeDate;

      // Enforce minimum interval from previous dose
      const prevDate = lastDoseDates[req.shortName];
      if (prevDate && doseInfo.minIntervalFromPrevDays) {
        const minByInterval = addDays(prevDate, doseInfo.minIntervalFromPrevDays);
        if (targetDate < minByInterval) {
          targetDate = addDays(minByInterval, randInt(rng, 0, 7));
        }
      }

      // Respect upper age limit
      if (doseInfo.maxAgeMonths !== undefined) {
        const maxDate = addDays(birthDate, Math.round(doseInfo.maxAgeMonths * 30.44));
        if (targetDate > maxDate) continue; // skip this dose, out of age range
      }

      // Skip past weekends/holidays
      targetDate = nextValidDate(targetDate, skipDates);

      lastDoseDates[req.shortName] = targetDate;

      allDoses.push({
        vaccine: req.vaccine,
        shortName: req.shortName,
        doseNumber: doseInfo.doseNumber,
        totalDoses: req.totalDoses,
        scheduledDate: targetDate,
        scheduledDateFormatted: formatDate(targetDate),
        scheduledDateShort: formatDateShort(targetDate),
        ageAtDose: formatAge(targetDate, birthDate),
        notes: doseInfo.notes || req.notes,
        isCatchUp: false,
      });
    }
  }

  return buildScheduleResult(
    allDoses,
    stateCode,
    stateName,
    "birth",
    undefined,
    birthDate,
    birthDate,
    vaccineNames
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATCH-UP SCHEDULE (starting at a specific grade)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCatchUpSchedule(
  stateCode: string,
  stateName: string,
  startDate: Date,
  entryGrade: GradeLevel,
  stateRequirements: StateVaccineRequirement[]
): GeneratedSchedule {
  const rng = seededRandom(startDate.getTime() % 999983);
  const startYear = startDate.getFullYear();
  const endYear = startDate.getFullYear() + 8;
  const skipDates = getAllSkipDates(startYear, endYear);

  // Determine what's needed for this grade
  const gradeVaccines = getVaccinesForGrade(stateCode, entryGrade);
  const doseMap = CATCH_UP_DOSE_MAP[entryGrade] || CATCH_UP_DOSE_MAP["K"];

  const vaccineNames = gradeVaccines.map((r) => r.shortName);
  const allDoses: ScheduledDose[] = [];
  const lastDoseDates: Record<string, Date> = {};

  // Cursor starts at the start date
  let cursor = nextValidDate(startDate, skipDates);

  for (const req of gradeVaccines) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    // How many doses are already "expected" for this grade (already given previously)?
    // For catch-up, we assume ZERO prior vaccination — but we must give the minimum
    // doses to comply with state requirements.
    // The totalDoses in StateVaccineRequirement is the total needed for school compliance.
    const dosesNeeded = req.totalDoses;
    const catchUpDoses = cdcInfo.doses.slice(0, dosesNeeded);

    for (let i = 0; i < catchUpDoses.length; i++) {
      const doseInfo = catchUpDoses[i];

      // For catch-up, space doses from previous with minimum catch-up interval
      // Add jitter of 3-10 days after minimum
      const jitter = randInt(rng, 3, 10);
      const prevDate = lastDoseDates[req.shortName];

      let targetDate: Date;
      if (i === 0) {
        // First dose: give at cursor + small random offset (different vaccines get slightly different days)
        const offset = randInt(rng, 0, 3);
        targetDate = nextValidDate(addDays(cursor, offset), skipDates);
      } else {
        // Subsequent doses: minimum catch-up interval + jitter
        const minInterval = doseInfo.catchUpMinIntervalFromPrevDays ?? doseInfo.minIntervalFromPrevDays ?? 28;
        targetDate = addDays(prevDate!, minInterval + jitter);
        targetDate = nextValidDate(targetDate, skipDates);
      }

      lastDoseDates[req.shortName] = targetDate;

      // Update cursor if this dose is later than cursor
      const afterThisDose = addDays(targetDate, 1);
      if (afterThisDose > cursor) {
        // Don't move cursor — multiple vaccines can be given same day
      }

      allDoses.push({
        vaccine: req.vaccine,
        shortName: req.shortName,
        doseNumber: doseInfo.doseNumber,
        totalDoses: req.totalDoses,
        scheduledDate: targetDate,
        scheduledDateFormatted: formatDate(targetDate),
        scheduledDateShort: formatDateShort(targetDate),
        ageAtDose: formatAgeFromGrade(entryGrade),
        notes: doseInfo.notes || req.notes,
        isCatchUp: true,
      });
    }
  }

  return buildScheduleResult(
    allDoses,
    stateCode,
    stateName,
    "catchup",
    entryGrade,
    startDate,
    undefined,
    vaccineNames
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP INTO APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

function buildScheduleResult(
  allDoses: ScheduledDose[],
  stateCode: string,
  stateName: string,
  startMode: "birth" | "catchup",
  entryGrade: GradeLevel | undefined,
  startDate: Date,
  birthDate: Date | undefined,
  vaccineNames: string[]
): GeneratedSchedule {
  // Sort by date
  allDoses.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  // Group by date into appointments
  const dateMap = new Map<string, ScheduledDose[]>();
  for (const dose of allDoses) {
    const key = dose.scheduledDateShort;
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(dose);
  }

  const appointments: ScheduleAppointment[] = [];
  for (const [, doses] of dateMap) {
    const d = doses[0].scheduledDate;
    const ageLabel = birthDate
      ? formatAge(d, birthDate)
      : doses[0].ageAtDose ?? "";
    appointments.push({
      date: d,
      dateFormatted: formatDate(d),
      dateShort: formatDateShort(d),
      ageLabel,
      doses,
    });
  }

  return {
    appointments,
    stateCode,
    stateName,
    startMode,
    entryGrade,
    startDate,
    birthDate,
    vaccinesIncluded: [...new Set(vaccineNames)],
    totalAppointments: appointments.length,
    disclaimer:
      "This schedule is generated for informational purposes only and is intended to assist physicians in counseling patients. It does not constitute medical advice. Always consult current CDC and state health department guidelines. Schedules should be reviewed and approved by a licensed physician before implementation.",
  };
}
