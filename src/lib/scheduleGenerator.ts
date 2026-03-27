// Vaccine schedule generation — slot-based (standard) and greedy-grouped (catch-up)
//
// Standard schedule: each dose is assigned to a well-child visit "slot". All
// vaccines in the same slot get the SAME appointment date. Minimum intervals
// are enforced after slot assignment; if a dose is too close to the previous
// dose (due to holiday bumping), it is pushed forward.
//
// Catch-up schedule: doses are scheduled greedily. At each step we find the
// dose(s) with the soonest "earliest-possible date", collect all doses whose
// earliest date falls within 30 days of that minimum, push them all to the
// LATEST of those earliest dates (satisfying every minimum simultaneously),
// and schedule one appointment for the group.

import {
  GradeLevel,
  StateVaccineRequirement,
  getVaccinesForGrade,
} from "@/data/stateVaccines";
import { CDC_SCHEDULE } from "@/data/cdcSchedule";
import {
  addDays,
  isWeekend,
  isHoliday,
  getAllSkipDates,
  formatDate,
  formatDateShort,
} from "@/data/holidays";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ScheduledDose {
  vaccine: string;
  shortName: string;
  doseNumber: number;
  totalDoses: number;
  scheduledDate: Date;
  scheduledDateFormatted: string;
  scheduledDateShort: string;
  ageAtDose?: string;
  notes?: string;
  isCatchUp: boolean;
}

export interface ScheduleAppointment {
  date: Date;
  dateFormatted: string;
  dateShort: string;
  ageLabel: string;
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

// ─── Utilities ────────────────────────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d);
    s = Math.imul(s ^ (s >>> 12), 0x297a2d39);
    s ^= s >>> 15;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function nextValidDate(date: Date, skipDates: Date[]): Date {
  let d = new Date(date);
  while (isWeekend(d) || isHoliday(d, skipDates)) {
    d = addDays(d, 1);
  }
  return d;
}

function formatAge(date: Date, birthDate: Date): string {
  const days = Math.floor(
    (date.getTime() - birthDate.getTime()) / 86400000
  );
  const months = Math.floor(days / 30.44);
  const years = Math.floor(months / 12);
  if (months < 1) return `${days} days`;
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  const rem = months % 12;
  return rem === 0
    ? `${years} year${years !== 1 ? "s" : ""}`
    : `${years} yr ${rem} mo`;
}

const GRADE_AGE_LABEL: Record<GradeLevel, string> = {
  PK: "Age ~4", K: "Age ~5", "1": "Age ~6", "2": "Age ~7",
  "3": "Age ~8", "4": "Age ~9", "5": "Age ~10", "6": "Age ~11",
  "7": "Age ~12", "8": "Age ~13", "9": "Age ~14", "10": "Age ~15",
  "11": "Age ~16", "12": "Age ~17",
};

// ─── Well-child visit slot definitions ───────────────────────────────────────
// Each slot has a target age in days from birth.
// ALL vaccines assigned to the same slot get the same appointment date.
// HepB dose 2 is placed at "2mo" (not "1mo") so it groups with DTaP/IPV/etc.

const WELL_CHILD_SLOTS: Array<{ key: string; targetDays: number; label: string }> = [
  { key: "birth", targetDays: 0,    label: "Birth"    },
  { key: "2mo",   targetDays: 61,   label: "2 months" },
  { key: "4mo",   targetDays: 122,  label: "4 months" },
  { key: "6mo",   targetDays: 183,  label: "6 months" },
  { key: "12mo",  targetDays: 365,  label: "12 months"},
  { key: "15mo",  targetDays: 456,  label: "15 months"},
  { key: "18mo",  targetDays: 548,  label: "18 months"},
  { key: "4yr",   targetDays: 1461, label: "4 years"  },
  { key: "11yr",  targetDays: 4018, label: "11 years" },
  { key: "16yr",  targetDays: 5844, label: "16 years" },
];

// vaccine shortName → dose number → slot key
// "relative" means the date is calculated relative to the previous dose
const DOSE_TO_SLOT: Record<string, Record<number, string>> = {
  HepB:              { 1: "birth", 2: "2mo",  3: "6mo"                    },
  DTaP:              { 1: "2mo",   2: "4mo",  3: "6mo",  4: "15mo", 5: "4yr" },
  IPV:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "4yr"           },
  Hib:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "12mo"          },
  PCV:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "12mo"          },
  MMR:               { 1: "12mo",  2: "4yr"                                  },
  Varicella:         { 1: "12mo",  2: "4yr"                                  },
  HepA:              { 1: "12mo",  2: "relative"                             }, // ≥6 mo after dose 1
  MenACWY:           { 1: "11yr",  2: "16yr"                                 },
  "MenACWY-Booster": { 1: "16yr"                                             },
  Tdap:              { 1: "11yr"                                              },
  HPV:               { 1: "11yr",  2: "relative"                             }, // 5-6 mo after dose 1
};

// Min relative interval (days) for "relative" doses
const RELATIVE_MIN_DAYS: Record<string, number> = {
  HepA:     182, // 6 months
  HPV:      154, // 5 months
};

// Upper age limit (days from birth) for catch-up eligibility
// Hib and PCV are not routinely given after age 59 months
const UPPER_AGE_LIMIT_DAYS: Record<string, number> = {
  Hib: 1825, // 60 months = 5 years
  PCV: 2190, // 72 months = 6 years (some catch-up up to 71 months)
};

// ─── Standard schedule (starting from birth) ──────────────────────────────────

export function generateStandardSchedule(
  stateCode: string,
  stateName: string,
  birthDate: Date,
  stateRequirements: StateVaccineRequirement[]
): GeneratedSchedule {
  const rng = seededRng(birthDate.getTime() % 999983);
  const startYear = birthDate.getFullYear();
  const skipDates = getAllSkipDates(startYear, startYear + 20);

  // 1. Calculate one date per well-child slot (base + per-slot jitter, skip bad days)
  const slotDates: Record<string, Date> = {};
  for (const slot of WELL_CHILD_SLOTS) {
    const jitter = randInt(rng, 0, 10);
    const raw = addDays(birthDate, slot.targetDays + jitter);
    slotDates[slot.key] = nextValidDate(raw, skipDates);
  }

  // 2. For each vaccine, assign doses to dates and enforce minimum intervals
  const allDoses: ScheduledDose[] = [];
  const lastDoseDate: Record<string, Date> = {};

  for (const req of stateRequirements) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    const dosesToSchedule = Math.min(req.totalDoses, cdcInfo.doses.length);
    const slotMap = DOSE_TO_SLOT[req.shortName] ?? {};

    for (let i = 0; i < dosesToSchedule; i++) {
      const doseInfo = cdcInfo.doses[i];
      const doseNum = doseInfo.doseNumber;
      const slotKey = slotMap[doseNum];

      let targetDate: Date;

      if (slotKey === "relative") {
        // Schedule relative to previous dose
        const prev = lastDoseDate[req.shortName];
        const minRel = RELATIVE_MIN_DAYS[req.shortName] ?? 182;
        const jitter = randInt(rng, 0, 14);
        targetDate = nextValidDate(addDays(prev ?? slotDates["12mo"], minRel + jitter), skipDates);
      } else if (slotKey && slotDates[slotKey]) {
        targetDate = new Date(slotDates[slotKey]);
      } else {
        // Fallback: use recommended age from CDC
        const recDays = Math.round(doseInfo.recommendedAgeMonths * 30.44);
        const jitter = randInt(rng, 0, 10);
        targetDate = nextValidDate(addDays(birthDate, recDays + jitter), skipDates);
      }

      // Enforce minimum age
      const minAgeDays = Math.round(doseInfo.minAgeMonths * 30.44);
      const minAgeDate = addDays(birthDate, minAgeDays);
      if (targetDate < minAgeDate) {
        targetDate = nextValidDate(minAgeDate, skipDates);
      }

      // Enforce minimum interval from previous dose
      const prev = lastDoseDate[req.shortName];
      if (prev && doseInfo.minIntervalFromPrevDays) {
        const minByInterval = addDays(prev, doseInfo.minIntervalFromPrevDays);
        if (targetDate < minByInterval) {
          // Push forward; add small jitter so it doesn't land on an exact boundary
          const jitter = randInt(rng, 1, 5);
          targetDate = nextValidDate(addDays(minByInterval, jitter), skipDates);
        }
      }

      // Respect upper age limit
      if (doseInfo.maxAgeMonths !== undefined) {
        const maxDate = addDays(birthDate, Math.round(doseInfo.maxAgeMonths * 30.44));
        if (targetDate > maxDate) continue;
      }

      lastDoseDate[req.shortName] = targetDate;

      allDoses.push({
        vaccine: req.vaccine,
        shortName: req.shortName,
        doseNumber: doseNum,
        totalDoses: req.totalDoses,
        scheduledDate: targetDate,
        scheduledDateFormatted: formatDate(targetDate),
        scheduledDateShort: formatDateShort(targetDate),
        ageAtDose: formatAge(targetDate, birthDate),
        notes: doseInfo.notes ?? req.notes,
        isCatchUp: false,
      });
    }
  }

  return buildResult(allDoses, stateCode, stateName, "birth", undefined, birthDate, birthDate);
}

// ─── Catch-up schedule ────────────────────────────────────────────────────────
//
// Algorithm:
//   1. Build a list of (vaccine, doseIndex, minInterval) pending items
//   2. Repeat until no pending items remain:
//      a. Compute each item's "earliest possible date"
//      b. Find globalMin = minimum of all earliest dates
//      c. Group all items whose earliest date ≤ globalMin + 30 days
//      d. visitDate = max(earliest date among group), bumped to valid day + jitter
//      e. Schedule all group items on visitDate; update lastDoseDate
//      f. Remove group items from pending list

export function generateCatchUpSchedule(
  stateCode: string,
  stateName: string,
  startDate: Date,
  entryGrade: GradeLevel,
  stateRequirements: StateVaccineRequirement[]
): GeneratedSchedule {
  const rng = seededRng(startDate.getTime() % 999983);
  const startYear = startDate.getFullYear();
  const skipDates = getAllSkipDates(startYear, startYear + 10);

  // Approximate child's age in days at startDate to filter age-limited vaccines
  const gradeStartAgeMap: Record<GradeLevel, number> = {
    PK: 1461, K: 1827, "1": 2192, "2": 2557, "3": 2922,
    "4": 3287, "5": 3652, "6": 4018, "7": 4383, "8": 4748,
    "9": 5113, "10": 5478, "11": 5844, "12": 6209,
  };
  const approxAgeDays = gradeStartAgeMap[entryGrade] ?? 4018;

  // Build pending list
  interface Pending {
    req: StateVaccineRequirement;
    doseIndex: number; // 0-based index into cdcInfo.doses
  }
  const pending: Pending[] = [];

  for (const req of stateRequirements) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    // Skip vaccines with upper age limits if child is already past them
    const upperLimit = UPPER_AGE_LIMIT_DAYS[req.shortName];
    if (upperLimit && approxAgeDays > upperLimit) continue;

    const dosesToGive = Math.min(req.totalDoses, cdcInfo.doses.length);
    for (let i = 0; i < dosesToGive; i++) {
      pending.push({ req, doseIndex: i });
    }
  }

  const lastDoseDate: Record<string, Date> = {};
  const allDoses: ScheduledDose[] = [];

  // Ensure startDate is a valid day
  const effectiveStart = nextValidDate(startDate, skipDates);

  let safetyCounter = 0;
  while (pending.length > 0 && safetyCounter++ < 500) {
    // Compute earliest possible date for each pending item
    const earliestDates = pending.map(({ req, doseIndex }) => {
      const cdcInfo = CDC_SCHEDULE[req.shortName]!;
      const doseInfo = cdcInfo.doses[doseIndex];
      const prev = lastDoseDate[req.shortName];

      let earliest = effectiveStart;

      // Minimum age from birth — we don't know birth date in catch-up, skip this check
      // (doctor should verify age-appropriateness)

      // Minimum interval from previous dose
      if (prev && doseInfo.catchUpMinIntervalFromPrevDays) {
        const byInterval = addDays(prev, doseInfo.catchUpMinIntervalFromPrevDays);
        if (byInterval > earliest) earliest = byInterval;
      } else if (prev && doseInfo.minIntervalFromPrevDays) {
        const byInterval = addDays(prev, doseInfo.minIntervalFromPrevDays);
        if (byInterval > earliest) earliest = byInterval;
      }

      return earliest;
    });

    // Find global minimum earliest date
    const globalMin = earliestDates.reduce(
      (min, d) => (d < min ? d : min),
      earliestDates[0]
    );

    // Group items whose earliest date is within 30 days of globalMin
    const GROUPING_WINDOW_DAYS = 30;
    const groupIndices = pending
      .map((_, i) => i)
      .filter((i) => {
        const diff = (earliestDates[i].getTime() - globalMin.getTime()) / 86400000;
        return diff <= GROUPING_WINDOW_DAYS;
      });

    // Visit date = latest earliest date in the group (satisfies ALL minimums) + jitter
    const groupEarliestDates = groupIndices.map((i) => earliestDates[i]);
    const visitEarliest = groupEarliestDates.reduce((max, d) => (d > max ? d : max), groupEarliestDates[0]);
    const jitter = randInt(rng, 0, 7);
    const visitDate = nextValidDate(addDays(visitEarliest, jitter), skipDates);

    // Schedule all group items
    for (const gi of groupIndices) {
      const { req, doseIndex } = pending[gi];
      const cdcInfo = CDC_SCHEDULE[req.shortName]!;
      const doseInfo = cdcInfo.doses[doseIndex];

      lastDoseDate[req.shortName] = visitDate;

      allDoses.push({
        vaccine: req.vaccine,
        shortName: req.shortName,
        doseNumber: doseInfo.doseNumber,
        totalDoses: req.totalDoses,
        scheduledDate: visitDate,
        scheduledDateFormatted: formatDate(visitDate),
        scheduledDateShort: formatDateShort(visitDate),
        ageAtDose: GRADE_AGE_LABEL[entryGrade],
        notes: doseInfo.notes ?? req.notes,
        isCatchUp: true,
      });
    }

    // Remove scheduled items (iterate in reverse to preserve indices)
    for (const gi of [...groupIndices].reverse()) {
      pending.splice(gi, 1);
    }
  }

  return buildResult(
    allDoses, stateCode, stateName, "catchup", entryGrade, startDate, undefined
  );
}

// ─── Build final result ───────────────────────────────────────────────────────

function buildResult(
  allDoses: ScheduledDose[],
  stateCode: string,
  stateName: string,
  startMode: "birth" | "catchup",
  entryGrade: GradeLevel | undefined,
  startDate: Date,
  birthDate: Date | undefined
): GeneratedSchedule {
  allDoses.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  // Group doses that share the exact same date into one appointment
  const dateMap = new Map<string, ScheduledDose[]>();
  for (const dose of allDoses) {
    const key = dose.scheduledDateShort;
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(dose);
  }

  const appointments: ScheduleAppointment[] = [];
  for (const doses of dateMap.values()) {
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

  const vaccinesIncluded = [...new Set(allDoses.map((d) => d.shortName))];

  return {
    appointments,
    stateCode,
    stateName,
    startMode,
    entryGrade,
    startDate,
    birthDate,
    vaccinesIncluded,
    totalAppointments: appointments.length,
    disclaimer:
      "This schedule is generated for informational purposes only and is intended to assist physicians in counseling patients. It does not constitute medical advice. Always consult current CDC and state health department guidelines. Schedules should be reviewed and approved by a licensed physician before implementation.",
  };
}
