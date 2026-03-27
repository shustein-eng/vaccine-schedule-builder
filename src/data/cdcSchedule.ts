// CDC Vaccine Schedule Data
// Based on CDC Recommended Child and Adolescent Immunization Schedule, 2024
// Source: https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html
// Catch-up schedule: https://www.cdc.gov/vaccines/schedules/hcp/imz/catchup.html

export interface VaccineDoseInfo {
  doseNumber: number;
  recommendedAgeMonths: number;  // recommended starting age (months from birth)
  minAgeMonths: number;          // minimum age (months from birth)
  maxAgeMonths?: number;         // upper age limit — dose is NOT given after this age
  minIntervalFromPrevDays?: number;      // min interval from previous dose in series (standard)
  minFromDose1Days?: number;             // additional constraint: min days from DOSE 1 (HepB rule)
  catchUpMinIntervalFromPrevDays?: number; // catch-up minimum interval from previous dose
  catchUpMinAgeDays?: number;
  label: string;
  notes?: string;
}

export interface VaccineSchedule {
  shortName: string;
  fullName: string;
  doses: VaccineDoseInfo[];
  notes?: string;
}

const M = (months: number) => Math.round(months * 30.44);

export const CDC_SCHEDULE: Record<string, VaccineSchedule> = {
  HepB: {
    shortName: "HepB",
    fullName: "Hepatitis B",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 0,
        minAgeMonths: 0,
        label: "HepB Dose 1",
        catchUpMinAgeDays: 0,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 2,   // given at 2-month well-child visit
        minAgeMonths: 1,           // CDC minimum age: 4 weeks after dose 1
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "HepB Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,
        minAgeMonths: 6,
        minIntervalFromPrevDays: 56,        // ≥8 weeks after dose 2
        minFromDose1Days: 112,              // ≥16 weeks after dose 1 (CDC requirement)
        catchUpMinIntervalFromPrevDays: 56, // ≥8 weeks after dose 2
        label: "HepB Dose 3",
        notes: "Must be ≥16 weeks after dose 1 AND ≥8 weeks after dose 2",
      },
    ],
  },

  DTaP: {
    shortName: "DTaP",
    fullName: "Diphtheria, Tetanus, Pertussis",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 2,
        minAgeMonths: 1.5,  // 6 weeks
        label: "DTaP Dose 1",
        catchUpMinAgeDays: 42,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 4,
        minAgeMonths: 3.5,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "DTaP Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,
        minAgeMonths: 5.5,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "DTaP Dose 3",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 15,
        minAgeMonths: 12,
        minIntervalFromPrevDays: 182,  // ≥6 months after dose 3
        catchUpMinIntervalFromPrevDays: 182,
        label: "DTaP Dose 4",
        notes: "At least 6 months after dose 3",
      },
      {
        doseNumber: 5,
        recommendedAgeMonths: 48,  // 4–6 years
        minAgeMonths: 48,
        maxAgeMonths: 84,          // NOT given after age 7
        minIntervalFromPrevDays: 182,
        catchUpMinIntervalFromPrevDays: 182,
        label: "DTaP Dose 5",
        notes: "Not needed if dose 4 given on or after 4th birthday; not given after age 7",
      },
    ],
  },

  Tdap: {
    shortName: "Tdap",
    fullName: "Tetanus, Diphtheria, Pertussis (adolescent booster)",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 132,  // 11–12 years
        minAgeMonths: 84,           // 7 years minimum for catch-up
        label: "Tdap Booster",
        catchUpMinAgeDays: M(84),
        notes: "One-time booster; replaces one Td dose in the catch-up series",
      },
    ],
  },

  IPV: {
    shortName: "IPV",
    fullName: "Inactivated Poliovirus",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 2,
        minAgeMonths: 1.5,
        label: "IPV Dose 1",
        catchUpMinAgeDays: 42,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 4,
        minAgeMonths: 3.5,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "IPV Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,
        minAgeMonths: 5.5,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "IPV Dose 3",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 48,  // 4–6 years
        minAgeMonths: 48,
        maxAgeMonths: 216,         // up to age 18
        minIntervalFromPrevDays: 182,
        catchUpMinIntervalFromPrevDays: 182,
        label: "IPV Dose 4",
        notes: "At least 6 months after dose 3; not needed if dose 3 given on/after 4th birthday",
      },
    ],
  },

  Hib: {
    shortName: "Hib",
    fullName: "Haemophilus influenzae type b",
    notes: "Not routinely recommended after age 59 months",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 2,
        minAgeMonths: 1.5,
        maxAgeMonths: 59,
        label: "Hib Dose 1",
        catchUpMinAgeDays: 42,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 4,
        minAgeMonths: 3.5,
        maxAgeMonths: 59,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "Hib Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,
        minAgeMonths: 5.5,
        maxAgeMonths: 59,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "Hib Dose 3",
        notes: "Not required for PRP-OMP brand (PedvaxHIB)",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        maxAgeMonths: 59,
        minIntervalFromPrevDays: 56,
        catchUpMinIntervalFromPrevDays: 56,
        label: "Hib Booster",
        notes: "Booster dose; must be given between 12–59 months",
      },
    ],
  },

  PCV: {
    shortName: "PCV",
    fullName: "Pneumococcal Conjugate (PCV15 or PCV20)",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 2,
        minAgeMonths: 1.5,
        maxAgeMonths: 71,
        label: "PCV Dose 1",
        catchUpMinAgeDays: 42,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 4,
        minAgeMonths: 3.5,
        maxAgeMonths: 71,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "PCV Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,
        minAgeMonths: 5.5,
        maxAgeMonths: 71,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "PCV Dose 3",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        maxAgeMonths: 71,
        minIntervalFromPrevDays: 56,
        catchUpMinIntervalFromPrevDays: 56,
        label: "PCV Booster",
      },
    ],
  },

  MMR: {
    shortName: "MMR",
    fullName: "Measles, Mumps, Rubella",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        label: "MMR Dose 1",
        catchUpMinAgeDays: M(12),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 48,
        minAgeMonths: 13,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "MMR Dose 2",
        notes: "At least 28 days after dose 1",
      },
    ],
  },

  Varicella: {
    shortName: "Varicella",
    fullName: "Varicella (Chickenpox)",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        label: "Varicella Dose 1",
        catchUpMinAgeDays: M(12),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 48,
        minAgeMonths: 15,
        minIntervalFromPrevDays: 90,   // 3 months for standard schedule
        // Catch-up: 3 months for <13 years; 4 weeks for ≥13 years.
        // We use 90 days (conservative/correct for most school-age patients).
        catchUpMinIntervalFromPrevDays: 90,
        label: "Varicella Dose 2",
        notes: "Min 3 months after dose 1 if under 13 years; 4 weeks if 13+",
      },
    ],
  },

  HepA: {
    shortName: "HepA",
    fullName: "Hepatitis A",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        label: "HepA Dose 1",
        catchUpMinAgeDays: M(12),
        notes: "Can be given anytime after age 1",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 18,
        minAgeMonths: 18,
        minIntervalFromPrevDays: 182,  // ≥6 months
        catchUpMinIntervalFromPrevDays: 182,
        label: "HepA Dose 2",
        notes: "At least 6 months after dose 1",
      },
    ],
  },

  MenACWY: {
    shortName: "MenACWY",
    fullName: "Meningococcal ACWY",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 132,  // 11–12 years
        minAgeMonths: 24,
        label: "MenACWY Dose 1",
        catchUpMinAgeDays: M(24),
        notes: "Routine dose at 11–12 years",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 192,  // 16 years booster
        minAgeMonths: 132,
        minIntervalFromPrevDays: 56,
        catchUpMinIntervalFromPrevDays: 56,
        label: "MenACWY Booster",
        notes: "Booster at age 16 (required by some states); ≥8 weeks after dose 1",
      },
    ],
  },

  // Separate entry for states that list the booster as a distinct requirement.
  // The scheduler enforces the prerequisite interval via VACCINE_PREREQUISITE map.
  "MenACWY-Booster": {
    shortName: "MenACWY-Booster",
    fullName: "Meningococcal ACWY Booster (2nd dose)",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 192,  // 16 years
        minAgeMonths: 132,
        minIntervalFromPrevDays: 56, // ≥8 weeks after first MenACWY dose
        catchUpMinIntervalFromPrevDays: 56,
        label: "MenACWY Booster Dose",
        notes: "2nd MenACWY dose; ≥8 weeks after first MenACWY dose",
      },
    ],
  },

  HPV: {
    shortName: "HPV",
    fullName: "Human Papillomavirus",
    notes: "2-dose series if started before 15th birthday; 3-dose if started at/after 15",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 132,  // 11–12 years
        minAgeMonths: 108,          // 9 years minimum
        label: "HPV Dose 1",
        catchUpMinAgeDays: M(108),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 138,  // ~6 months after dose 1
        minAgeMonths: 108,
        minIntervalFromPrevDays: 154,  // 5 months (2-dose series)
        // Catch-up for 2-dose series (< age 15): 5 months minimum.
        // For ≥ age 15 (3-dose series), dose 2 is 4 weeks; but we use 154 as the
        // safe default since most users of this app are school-age children <15.
        catchUpMinIntervalFromPrevDays: 154,
        label: "HPV Dose 2",
        notes: "2-dose series: ≥5 months after dose 1 (if started before age 15)",
      },
    ],
  },

  Flu: {
    shortName: "Flu",
    fullName: "Influenza",
    notes: "Annual vaccination recommended; 2 doses 4 weeks apart for first-time recipients under age 9",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 6,
        minAgeMonths: 6,
        label: "Flu Dose 1",
        catchUpMinAgeDays: M(6),
        notes: "Annual flu vaccine; 2 doses for first-time recipients under age 9",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 7,
        minAgeMonths: 6,
        maxAgeMonths: 108, // second dose only for children under 9 (first-time recipients)
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "Flu Dose 2",
        notes: "Second dose only for children under age 9 receiving flu vaccine for the first time",
      },
    ],
  },

  COVID: {
    shortName: "COVID",
    fullName: "COVID-19",
    notes: "Annual updated COVID-19 vaccine recommended; shown here as initial 2-dose primary series",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 6,
        minAgeMonths: 6,
        label: "COVID-19 Dose 1",
        catchUpMinAgeDays: M(6),
        notes: "Primary series; consult current CDC guidance for updated vaccine formulation",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 7,
        minAgeMonths: 6,
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "COVID-19 Dose 2",
        notes: "Annual updated dose recommended thereafter",
      },
    ],
  },
};

// Unused export kept for API compatibility — no longer used in scheduler
export const CATCH_UP_DOSE_MAP: Record<string, Record<string, number>> = {};
