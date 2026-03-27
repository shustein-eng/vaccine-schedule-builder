// Vaccine schedule generation — slot-based (standard) and greedy-grouped (catch-up)
//
// Standard schedule: each dose is assigned to a well-child visit "slot". All
// vaccines in the same slot share the SAME appointment date. Minimum intervals
// (including HepB's 16-week dose-1 rule) are enforced after slot assignment.
//
// Catch-up schedule: doses are scheduled greedily. At each step we find the
// dose(s) with the soonest earliest-possible date, collect all doses whose
// earliest date falls within 30 days of that minimum, push them all to the
// LATEST of those earliest dates (satisfying every minimum simultaneously),
// and schedule one appointment for the group.
//
// Fixes applied:
//   - HepB dose 3: enforces ≥16 weeks from dose 1 (minFromDose1Days)
//   - MenACWY-Booster: prerequisite tracking ensures ≥8 weeks after MenACWY dose 1
//   - Catch-up: per-dose maxAgeMonths enforced using estimated age at visitDate
//   - Varicella catch-up: 90-day minimum (correct for <13 years)
//   - HPV catch-up: 154-day minimum (correct for 2-dose series <15 years)

import { GradeLevel, StateVaccineRequirement, VaccineSet } from "@/data/stateVaccines";
import { CDC_SCHEDULE, VaccineDoseInfo } from "@/data/cdcSchedule";
import {
  addDays,
  isWeekend,
  isHoliday,
  getAllSkipDates,
  formatDate,
  formatDateShort,
} from "@/data/holidays";

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * Prior doses already administered to the patient.
 * Outer key: vaccine shortName (e.g. "DTaP").
 * Inner key: dose number, 1-indexed (e.g. 1, 2, 3).
 * Value: the Date the dose was administered.
 */
export type PriorDoseHistory = Record<string, Record<number, Date>>;

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
  vaccineSet: VaccineSet;
  entryGrade?: GradeLevel;
  startDate: Date;
  birthDate?: Date;
  vaccinesIncluded: string[];
  totalAppointments: number;
  disclaimer: string;
}

// ─── CDC grace period ─────────────────────────────────────────────────────────
// Doses administered ≤4 days before the minimum age or interval are still valid.
const GRACE_DAYS = 4;

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
  const days = Math.floor((date.getTime() - birthDate.getTime()) / 86400000);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(months / 12);
  if (months < 1) return `${days} days`;
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  const rem = months % 12;
  return rem === 0
    ? `${years} year${years !== 1 ? "s" : ""}`
    : `${years} yr ${rem} mo`;
}

interface PriorEval {
  validCount: number;       // how many prior doses are CDC-valid
  firstDate: Date | null;   // date of first valid prior dose (seeds firstDoseDate)
  lastDate: Date | null;    // date of last valid prior dose (seeds lastDoseDate)
  skipDose5: boolean;       // DTaP: dose 5 not needed (dose 4 on/after 4th birthday)
}

/**
 * Validate prior dose dates for a single vaccine against CDC minimums.
 *
 * Algorithm: iterate each dose slot in series order. For each slot, check if
 * the entered date for that dose number passes (a) minimum age (with grace),
 * (b) minimum interval from the last VALID dose (with grace), and (c) for
 * HepB dose 3, the ≥16-week-from-dose-1 rule. Valid doses advance the counter
 * and become the interval anchor; invalid doses are skipped (the slot stays
 * open for the scheduler to fill).
 *
 * DTaP special rule: dose 5 is NOT given if dose 4 was administered on or
 * after the child's 4th birthday, per CDC.
 */
function evaluatePriorDoses(
  shortName: string,
  priorDates: Record<number, Date>,
  birthDate: Date | null,
  cdcDoses: VaccineDoseInfo[],
): PriorEval {
  let validCount = 0;
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;
  let skipDose5 = false;

  for (let i = 0; i < cdcDoses.length; i++) {
    const doseInfo = cdcDoses[i];
    const doseNum = doseInfo.doseNumber; // 1-indexed
    const given = priorDates[doseNum];
    if (!given) break; // No date for this dose — stop evaluating

    // ── DTaP dose 5 exemption ───────────────────────────────────────────────
    if (shortName === "DTaP" && doseNum === 5 && birthDate && lastDate) {
      const fourthBirthday = new Date(
        birthDate.getFullYear() + 4,
        birthDate.getMonth(),
        birthDate.getDate()
      );
      if (lastDate >= fourthBirthday) {
        skipDose5 = true;
        break; // Series complete; dose 5 not required
      }
    }

    // ── Minimum age check (4-day grace) ─────────────────────────────────────
    if (birthDate && doseInfo.minAgeMonths > 0) {
      const minAgeMs = Math.round(doseInfo.minAgeMonths * 30.44) - GRACE_DAYS;
      const minAgeDate = addDays(birthDate, minAgeMs);
      if (given < minAgeDate) continue; // invalid — skip, leave slot open
    }

    // ── Minimum interval from last valid dose (4-day grace) ──────────────────
    if (lastDate && doseInfo.minIntervalFromPrevDays) {
      const minInt = doseInfo.minIntervalFromPrevDays - GRACE_DAYS;
      if (given < addDays(lastDate, minInt)) continue; // invalid
    }

    // ── HepB dose 3: also ≥16 weeks from dose 1 (4-day grace) ───────────────
    if (shortName === "HepB" && doseNum === 3 && firstDate && doseInfo.minFromDose1Days) {
      const minFromD1 = doseInfo.minFromDose1Days - GRACE_DAYS;
      if (given < addDays(firstDate, minFromD1)) continue; // invalid
    }

    // ── Dose is valid ────────────────────────────────────────────────────────
    validCount++;
    if (!firstDate) firstDate = given;
    lastDate = given;
  }

  return { validCount, firstDate, lastDate, skipDose5 };
}

const GRADE_AGE_LABEL: Record<GradeLevel, string> = {
  PK: "Age ~4", K: "Age ~5", "1": "Age ~6", "2": "Age ~7",
  "3": "Age ~8", "4": "Age ~9", "5": "Age ~10", "6": "Age ~11",
  "7": "Age ~12", "8": "Age ~13", "9": "Age ~14", "10": "Age ~15",
  "11": "Age ~16", "12": "Age ~17",
};

// ─── Well-child visit slot definitions ───────────────────────────────────────

const WELL_CHILD_SLOTS: Array<{ key: string; targetDays: number }> = [
  { key: "birth", targetDays: 0    },
  { key: "2mo",   targetDays: 61   },
  { key: "4mo",   targetDays: 122  },
  { key: "6mo",   targetDays: 183  },
  { key: "12mo",  targetDays: 365  },
  { key: "15mo",  targetDays: 456  },
  { key: "18mo",  targetDays: 548  },
  { key: "4yr",   targetDays: 1461 },
  { key: "11yr",  targetDays: 4018 },
  { key: "16yr",  targetDays: 5844 },
];

// vaccine → dose number → slot key ("relative" = relative to prior dose)
const DOSE_TO_SLOT: Record<string, Record<number, string>> = {
  HepB:              { 1: "birth", 2: "2mo",  3: "6mo"                    },
  DTaP:              { 1: "2mo",   2: "4mo",  3: "6mo",  4: "15mo", 5: "4yr" },
  IPV:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "4yr"           },
  Hib:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "12mo"          },
  PCV:               { 1: "2mo",   2: "4mo",  3: "6mo",  4: "12mo"          },
  MMR:               { 1: "12mo",  2: "4yr"                                  },
  Varicella:         { 1: "12mo",  2: "4yr"                                  },
  HepA:              { 1: "12mo",  2: "relative"                             },
  MenACWY:           { 1: "11yr",  2: "16yr"                                 },
  "MenACWY-Booster": { 1: "16yr"                                             },
  Tdap:              { 1: "11yr"                                              },
  HPV:               { 1: "11yr",  2: "relative"                             },
  Flu:               { 1: "6mo",   2: "relative"                             },
  COVID:             { 1: "6mo",   2: "relative"                             },
};

// Minimum interval (days) from the previous dose for "relative" slot doses
const RELATIVE_MIN_DAYS: Record<string, number> = {
  HepA:  182,  // 6 months
  HPV:   154,  // 5 months (2-dose series)
  Flu:    28,  // 4 weeks
  COVID:  28,  // 4 weeks
};

// Upper age limit (days) at which we stop scheduling a vaccine in catch-up
const CATCH_UP_MAX_AGE_DAYS: Record<string, number> = {
  Hib: 1825, // 60 months
  PCV: 2190, // 72 months
};

// Cross-vaccine prerequisite: MenACWY-Booster requires ≥8 weeks after MenACWY dose 1.
// Maps shortName → { prerequisiteShortName, minIntervalDays }
const VACCINE_PREREQUISITE: Record<string, { prereq: string; minDays: number }> = {
  "MenACWY-Booster": { prereq: "MenACWY", minDays: 56 },
};

// ─── Standard schedule (starting from birth) ──────────────────────────────────

export function generateStandardSchedule(
  stateCode: string,
  stateName: string,
  birthDate: Date,
  stateRequirements: StateVaccineRequirement[],
  vaccineSet: VaccineSet = "school",
  priorHistory: PriorDoseHistory = {}
): GeneratedSchedule {
  const rng = seededRng(birthDate.getTime() % 999983);
  const startYear = birthDate.getFullYear();
  const skipDates = getAllSkipDates(startYear, startYear + 20);

  // 1. Calculate one date per well-child slot (target age + per-slot jitter)
  const slotDates: Record<string, Date> = {};
  for (const slot of WELL_CHILD_SLOTS) {
    const jitter = randInt(rng, 0, 10);
    slotDates[slot.key] = nextValidDate(addDays(birthDate, slot.targetDays + jitter), skipDates);
  }

  // 2. Assign doses to slot dates; enforce minimum intervals
  const allDoses: ScheduledDose[] = [];
  const lastDoseDate: Record<string, Date> = {};
  const firstDoseDate: Record<string, Date> = {}; // for minFromDose1Days enforcement

  for (const req of stateRequirements) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    const dosesToSchedule = Math.min(req.totalDoses, cdcInfo.doses.length);
    const slotMap = DOSE_TO_SLOT[req.shortName] ?? {};

    // ── Prior dose handling ────────────────────────────────────────────────
    const priorDates = priorHistory[req.shortName];
    let startDoseIndex = 0;
    if (priorDates && Object.keys(priorDates).length > 0) {
      const ev = evaluatePriorDoses(req.shortName, priorDates, birthDate, cdcInfo.doses);
      if (ev.firstDate) firstDoseDate[req.shortName] = ev.firstDate;
      if (ev.lastDate)  lastDoseDate[req.shortName]  = ev.lastDate;
      startDoseIndex = ev.skipDose5 ? dosesToSchedule : ev.validCount;
      if (startDoseIndex >= dosesToSchedule) continue; // all doses already done
    }

    for (let i = startDoseIndex; i < dosesToSchedule; i++) {
      const doseInfo = cdcInfo.doses[i];
      const doseNum = doseInfo.doseNumber;
      const slotKey = slotMap[doseNum];

      let targetDate: Date;

      if (slotKey === "relative") {
        const prev = lastDoseDate[req.shortName];
        const minRel = RELATIVE_MIN_DAYS[req.shortName] ?? 182;
        const jitter = randInt(rng, 0, 14);
        targetDate = nextValidDate(addDays(prev ?? slotDates["12mo"], minRel + jitter), skipDates);
      } else if (slotKey && slotDates[slotKey]) {
        targetDate = new Date(slotDates[slotKey]);
      } else {
        const recDays = Math.round(doseInfo.recommendedAgeMonths * 30.44);
        const jitter = randInt(rng, 0, 10);
        targetDate = nextValidDate(addDays(birthDate, recDays + jitter), skipDates);
      }

      // Enforce minimum age
      const minAgeDate = addDays(birthDate, Math.round(doseInfo.minAgeMonths * 30.44));
      if (targetDate < minAgeDate) {
        targetDate = nextValidDate(minAgeDate, skipDates);
      }

      // Enforce minimum interval from previous dose in the same series
      const prev = lastDoseDate[req.shortName];
      if (prev && doseInfo.minIntervalFromPrevDays) {
        const minByInterval = addDays(prev, doseInfo.minIntervalFromPrevDays);
        if (targetDate < minByInterval) {
          targetDate = nextValidDate(addDays(minByInterval, randInt(rng, 1, 5)), skipDates);
        }
      }

      // Enforce minimum interval from dose 1 (HepB dose 3: ≥16 weeks from dose 1)
      const dose1 = firstDoseDate[req.shortName];
      if (dose1 && doseInfo.minFromDose1Days) {
        const minFromD1 = addDays(dose1, doseInfo.minFromDose1Days);
        if (targetDate < minFromD1) {
          targetDate = nextValidDate(addDays(minFromD1, randInt(rng, 1, 5)), skipDates);
        }
      }

      // Enforce cross-vaccine prerequisite (MenACWY-Booster ≥8 weeks after MenACWY)
      const prereqDef = VACCINE_PREREQUISITE[req.shortName];
      if (prereqDef) {
        const prereqDate = lastDoseDate[prereqDef.prereq];
        if (prereqDate) {
          const minByPrereq = addDays(prereqDate, prereqDef.minDays);
          if (targetDate < minByPrereq) {
            targetDate = nextValidDate(addDays(minByPrereq, randInt(rng, 1, 5)), skipDates);
          }
        }
      }

      // Respect per-dose upper age limit
      if (doseInfo.maxAgeMonths !== undefined) {
        const maxDate = addDays(birthDate, Math.round(doseInfo.maxAgeMonths * 30.44));
        if (targetDate > maxDate) continue;
      }

      if (!firstDoseDate[req.shortName]) firstDoseDate[req.shortName] = targetDate;
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

  return buildResult(allDoses, stateCode, stateName, "birth", vaccineSet, undefined, birthDate, birthDate);
}

// ─── Catch-up schedule ────────────────────────────────────────────────────────

export function generateCatchUpSchedule(
  stateCode: string,
  stateName: string,
  startDate: Date,
  entryGrade: GradeLevel,
  stateRequirements: StateVaccineRequirement[],
  vaccineSet: VaccineSet = "school",
  priorHistory: PriorDoseHistory = {},
  birthDate?: Date
): GeneratedSchedule {
  const rng = seededRng(startDate.getTime() % 999983);
  const startYear = startDate.getFullYear();
  const skipDates = getAllSkipDates(startYear, startYear + 10);

  // Approximate age in days at startDate (used for maxAgeMonths filtering)
  const gradeStartAgeMap: Record<GradeLevel, number> = {
    PK: 1461, K: 1827, "1": 2192, "2": 2557, "3": 2922,
    "4": 3287, "5": 3652, "6": 4018, "7": 4383, "8": 4748,
    "9": 5113, "10": 5478, "11": 5844, "12": 6209,
  };
  const approxAgeDaysAtStart = gradeStartAgeMap[entryGrade] ?? 4018;

  interface Pending {
    req: StateVaccineRequirement;
    doseIndex: number;
  }
  const pending: Pending[] = [];

  for (const req of stateRequirements) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;

    // Skip vaccines with vaccine-level catch-up age limits
    const maxAgeDays = CATCH_UP_MAX_AGE_DAYS[req.shortName];
    if (maxAgeDays && approxAgeDaysAtStart > maxAgeDays) continue;

    const dosesToGive = Math.min(req.totalDoses, cdcInfo.doses.length);
    for (let i = 0; i < dosesToGive; i++) {
      const doseInfo = cdcInfo.doses[i];

      // Skip individual doses with per-dose age limits already exceeded at start
      if (doseInfo.maxAgeMonths !== undefined) {
        const maxAgeDaysForDose = Math.round(doseInfo.maxAgeMonths * 30.44);
        if (approxAgeDaysAtStart > maxAgeDaysForDose) continue;
      }

      pending.push({ req, doseIndex: i });
    }
  }

  const lastDoseDate: Record<string, Date> = {};
  const firstDoseDate: Record<string, Date> = {};

  // ── Seed tracking records from prior doses ─────────────────────────────────
  // Estimate birth date from grade if not provided (for DTaP dose 5 check)
  const effectiveBirthDate: Date | null = birthDate ?? (() => {
    const gradeAgeYears: Record<GradeLevel, number> = {
      PK: 4, K: 5, "1": 6, "2": 7, "3": 8, "4": 9, "5": 10,
      "6": 11, "7": 12, "8": 13, "9": 14, "10": 15, "11": 16, "12": 17,
    };
    const est = new Date(startDate);
    est.setFullYear(est.getFullYear() - (gradeAgeYears[entryGrade] ?? 5));
    return est;
  })();

  const priorEvals: Record<string, PriorEval> = {};
  for (const req of stateRequirements) {
    const cdcInfo = CDC_SCHEDULE[req.shortName];
    if (!cdcInfo) continue;
    const priorDates = priorHistory[req.shortName];
    if (!priorDates || Object.keys(priorDates).length === 0) continue;

    const ev = evaluatePriorDoses(req.shortName, priorDates, effectiveBirthDate, cdcInfo.doses);
    priorEvals[req.shortName] = ev;
    if (ev.firstDate) firstDoseDate[req.shortName] = ev.firstDate;
    if (ev.lastDate)  lastDoseDate[req.shortName]  = ev.lastDate;
  }

  // Re-build pending list using evaluated prior doses (remove already-given doses)
  const adjustedPending: typeof pending = [];
  for (const item of pending) {
    const ev = priorEvals[item.req.shortName];
    if (!ev) { adjustedPending.push(item); continue; }
    if (ev.skipDose5 && item.req.shortName === "DTaP" &&
        item.req.shortName === "DTaP" &&
        CDC_SCHEDULE["DTaP"]!.doses[item.doseIndex]?.doseNumber === 5) continue;
    if (item.doseIndex < ev.validCount) continue; // this dose already given
    adjustedPending.push(item);
  }
  pending.length = 0;
  pending.push(...adjustedPending);

  const allDoses: ScheduledDose[] = [];
  const effectiveStart = nextValidDate(startDate, skipDates);

  let safetyCounter = 0;
  while (pending.length > 0 && safetyCounter++ < 500) {
    // Compute earliest possible date for each pending item
    const earliestDates = pending.map(({ req, doseIndex }) => {
      const cdcInfo = CDC_SCHEDULE[req.shortName]!;
      const doseInfo = cdcInfo.doses[doseIndex];
      const prev = lastDoseDate[req.shortName];

      let earliest = effectiveStart;

      // Minimum interval from previous dose in the same series
      if (prev) {
        const minInterval =
          doseInfo.catchUpMinIntervalFromPrevDays ?? doseInfo.minIntervalFromPrevDays ?? 28;
        const byInterval = addDays(prev, minInterval);
        if (byInterval > earliest) earliest = byInterval;
      }

      // HepB dose 3: also enforce ≥16 weeks (112 days) from dose 1
      if (doseInfo.minFromDose1Days && firstDoseDate[req.shortName]) {
        const byDose1 = addDays(firstDoseDate[req.shortName], doseInfo.minFromDose1Days);
        if (byDose1 > earliest) earliest = byDose1;
      }

      // Cross-vaccine prerequisite (MenACWY-Booster ≥8 weeks after MenACWY dose 1)
      const prereqDef = VACCINE_PREREQUISITE[req.shortName];
      if (prereqDef) {
        const prereqDate = lastDoseDate[prereqDef.prereq];
        if (prereqDate) {
          const byPrereq = addDays(prereqDate, prereqDef.minDays);
          if (byPrereq > earliest) earliest = byPrereq;
        } else {
          // Prerequisite not yet given — defer this item far into the future
          // so it doesn't get grouped with visit 1
          earliest = addDays(effectiveStart, 365);
        }
      }

      return earliest;
    });

    // Global minimum earliest date
    const globalMin = earliestDates.reduce((min, d) => (d < min ? d : min), earliestDates[0]);

    // Group items whose earliest date is within 30 days of globalMin
    const groupIndices = pending
      .map((_, i) => i)
      .filter((i) => {
        const diff = (earliestDates[i].getTime() - globalMin.getTime()) / 86400000;
        return diff <= 30;
      });

    // Visit date = latest earliest date in group + jitter (satisfies all minimums)
    const groupEarliestDates = groupIndices.map((i) => earliestDates[i]);
    const visitEarliest = groupEarliestDates.reduce((max, d) => (d > max ? d : max), groupEarliestDates[0]);
    const jitter = randInt(rng, 0, 7);
    const visitDate = nextValidDate(addDays(visitEarliest, jitter), skipDates);

    // Estimate child's age in days at visitDate (for per-dose maxAgeMonths check)
    const daysSinceStart = Math.floor((visitDate.getTime() - startDate.getTime()) / 86400000);
    const estimatedAgeDaysAtVisit = approxAgeDaysAtStart + daysSinceStart;

    // Schedule each item in the group
    for (const gi of groupIndices) {
      const { req, doseIndex } = pending[gi];
      const cdcInfo = CDC_SCHEDULE[req.shortName]!;
      const doseInfo = cdcInfo.doses[doseIndex];

      // Per-dose maxAgeMonths check at the scheduled visit date
      if (doseInfo.maxAgeMonths !== undefined) {
        const maxDays = Math.round(doseInfo.maxAgeMonths * 30.44);
        if (estimatedAgeDaysAtVisit > maxDays) continue; // skip this dose
      }

      if (!firstDoseDate[req.shortName]) firstDoseDate[req.shortName] = visitDate;
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

    // Remove scheduled items (reverse order to preserve indices)
    for (const gi of [...groupIndices].reverse()) {
      pending.splice(gi, 1);
    }
  }

  return buildResult(allDoses, stateCode, stateName, "catchup", vaccineSet, entryGrade, startDate, undefined);
}

// ─── Build final result ───────────────────────────────────────────────────────

function buildResult(
  allDoses: ScheduledDose[],
  stateCode: string,
  stateName: string,
  startMode: "birth" | "catchup",
  vaccineSet: VaccineSet,
  entryGrade: GradeLevel | undefined,
  startDate: Date,
  birthDate: Date | undefined
): GeneratedSchedule {
  allDoses.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  const dateMap = new Map<string, ScheduledDose[]>();
  for (const dose of allDoses) {
    const key = dose.scheduledDateShort;
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(dose);
  }

  const appointments: ScheduleAppointment[] = [];
  for (const doses of dateMap.values()) {
    const d = doses[0].scheduledDate;
    appointments.push({
      date: d,
      dateFormatted: formatDate(d),
      dateShort: formatDateShort(d),
      ageLabel: birthDate ? formatAge(d, birthDate) : (doses[0].ageAtDose ?? ""),
      doses,
    });
  }

  return {
    appointments,
    stateCode,
    stateName,
    startMode,
    vaccineSet,
    entryGrade,
    startDate,
    birthDate,
    vaccinesIncluded: [...new Set(allDoses.map((d) => d.shortName))],
    totalAppointments: appointments.length,
    disclaimer:
      "This schedule is generated for informational purposes only and is intended to assist physicians in counseling patients. It does not constitute medical advice. Always consult current CDC and state health department guidelines. Schedules should be reviewed and approved by a licensed physician before implementation.",
  };
}
