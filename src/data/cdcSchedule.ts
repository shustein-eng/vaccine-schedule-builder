// CDC Vaccine Schedule Data
// Based on CDC Recommended Child and Adolescent Immunization Schedule, 2024
// Source: https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html
// Catch-up schedule: https://www.cdc.gov/vaccines/schedules/hcp/imz/catchup.html

export interface VaccineDoseInfo {
  doseNumber: number;
  // Standard schedule (from birth)
  recommendedAgeMonths: number;  // recommended starting age in months
  minAgeMonths: number;          // minimum age to give this dose (months)
  maxAgeMonths?: number;         // upper age limit for this dose
  // Interval from previous dose in same series (days)
  minIntervalFromPrevDays?: number;
  // Catch-up schedule minimums
  catchUpMinIntervalFromPrevDays?: number;
  catchUpMinAgeDays?: number;
  label: string; // e.g., "DTaP Dose 1"
  notes?: string;
}

export interface VaccineSchedule {
  shortName: string;
  fullName: string;
  doses: VaccineDoseInfo[];
  notes?: string;
}

// Days per month approximation
const M = (months: number) => Math.round(months * 30.44);

export const CDC_SCHEDULE: Record<string, VaccineSchedule> = {
  HepB: {
    shortName: "HepB",
    fullName: "Hepatitis B",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 0,   // birth
        minAgeMonths: 0,
        label: "HepB Dose 1",
        catchUpMinAgeDays: 0,
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 2,   // given at 2-month well-child visit with DTaP/IPV/etc.
        minAgeMonths: 1,           // CDC minimum is 4 weeks after dose 1
        minIntervalFromPrevDays: 28,
        catchUpMinIntervalFromPrevDays: 28,
        label: "HepB Dose 2",
      },
      {
        doseNumber: 3,
        recommendedAgeMonths: 6,   // 6-18 months
        minAgeMonths: 6,
        minIntervalFromPrevDays: 56,   // at least 8 weeks after dose 2
        catchUpMinIntervalFromPrevDays: 56,
        label: "HepB Dose 3",
        notes: "Must be at least 16 weeks after dose 1 and at least 8 weeks after dose 2",
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
        recommendedAgeMonths: 15,  // 15-18 months
        minAgeMonths: 12,
        minIntervalFromPrevDays: 182,  // 6 months after dose 3
        catchUpMinIntervalFromPrevDays: 182,
        label: "DTaP Dose 4",
        notes: "At least 6 months after dose 3",
      },
      {
        doseNumber: 5,
        recommendedAgeMonths: 48,  // 4-6 years
        minAgeMonths: 48,
        maxAgeMonths: 84,
        minIntervalFromPrevDays: 182,
        catchUpMinIntervalFromPrevDays: 182,
        label: "DTaP Dose 5",
        notes: "Not needed if dose 4 was given on or after 4th birthday",
      },
    ],
  },

  Tdap: {
    shortName: "Tdap",
    fullName: "Tetanus, Diphtheria, Pertussis (adolescent booster)",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 132,  // 11-12 years
        minAgeMonths: 84,  // 7 years minimum catch-up
        label: "Tdap Booster",
        catchUpMinAgeDays: M(84),
        notes: "One-time booster; replaces one Td dose",
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
        notes: "If doses 1 & 2 are Pediarix or Pentacel; otherwise can be given at 6-18 months",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 48,  // 4-6 years
        minAgeMonths: 48,
        maxAgeMonths: 216,  // 18 years
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
        notes: "Only required for some brands; not required for PRP-OMP (PedvaxHIB)",
      },
      {
        doseNumber: 4,
        recommendedAgeMonths: 12,  // 12-15 months
        minAgeMonths: 12,
        maxAgeMonths: 59,
        minIntervalFromPrevDays: 56,
        catchUpMinIntervalFromPrevDays: 56,
        label: "Hib Booster",
        notes: "Booster dose; must be given between 12-59 months",
      },
    ],
    notes: "Not routinely recommended after age 5; catch-up only for age 5-59 months",
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
        recommendedAgeMonths: 12,  // 12-15 months
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
        recommendedAgeMonths: 12,  // 12-15 months
        minAgeMonths: 12,
        label: "MMR Dose 1",
        catchUpMinAgeDays: M(12),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 48,  // 4-6 years
        minAgeMonths: 13,  // min 4 weeks after dose 1
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
        recommendedAgeMonths: 12,  // 12-15 months
        minAgeMonths: 12,
        label: "Varicella Dose 1",
        catchUpMinAgeDays: M(12),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 48,  // 4-6 years
        minAgeMonths: 15,  // min 3 months after dose 1
        minIntervalFromPrevDays: 90,  // 3 months minimum
        catchUpMinIntervalFromPrevDays: 28,  // catch-up: 28 days if ≥13 years
        label: "Varicella Dose 2",
        notes: "Min 3 months after dose 1 (if under 13 years); 28 days if 13+ years",
      },
    ],
  },

  HepA: {
    shortName: "HepA",
    fullName: "Hepatitis A",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 12,  // 12-23 months
        minAgeMonths: 12,
        label: "HepA Dose 1",
        catchUpMinAgeDays: M(12),
        notes: "Can be given anytime after age 1",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 18,  // 6-18 months after dose 1
        minAgeMonths: 18,
        minIntervalFromPrevDays: 182,  // 6 months minimum
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
        recommendedAgeMonths: 132,  // 11-12 years
        minAgeMonths: 24,  // catch-up from age 2 in certain high-risk
        label: "MenACWY Dose 1",
        catchUpMinAgeDays: M(24),
        notes: "Routine dose at 11-12 years",
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 192,  // 16 years booster
        minAgeMonths: 132,
        minIntervalFromPrevDays: 56,  // at least 8 weeks after dose 1 for catch-up
        catchUpMinIntervalFromPrevDays: 56,
        label: "MenACWY Booster",
        notes: "Booster at age 16 (required by some states)",
      },
    ],
  },

  HPV: {
    shortName: "HPV",
    fullName: "Human Papillomavirus",
    doses: [
      {
        doseNumber: 1,
        recommendedAgeMonths: 132,  // 11-12 years
        minAgeMonths: 108,  // 9 years minimum
        label: "HPV Dose 1",
        catchUpMinAgeDays: M(108),
      },
      {
        doseNumber: 2,
        recommendedAgeMonths: 138,  // 6-12 months after dose 1 if started before 15
        minAgeMonths: 108,
        minIntervalFromPrevDays: 154,  // 5 months if 2-dose series
        catchUpMinIntervalFromPrevDays: 28,  // 4 weeks minimum catch-up
        label: "HPV Dose 2",
        notes: "2-dose series if started before age 15; 3-dose if started at 15+",
      },
    ],
    notes: "2-dose series if started before 15th birthday; 3-dose if started at/after 15",
  },
};

// Dose counts by grade level for catch-up (how many doses are already covered
// by typical vaccination history for someone starting at that grade)
export const CATCH_UP_DOSE_MAP: Record<string, Record<string, number>> = {
  // Key: grade at entry, Value: doses already expected to have been given
  // This represents the MINIMUM doses to be compliant for that grade
  // These are vaccines to COMPLETE for school compliance
  K: {
    HepB: 3, DTaP: 5, IPV: 4, Hib: 4, PCV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "1": {
    HepB: 3, DTaP: 5, IPV: 4, Hib: 4, PCV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "2": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "3": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "4": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "5": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "6": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 0, Tdap: 0, HPV: 0,
  },
  "7": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 1, Tdap: 1, HPV: 2,
  },
  "8": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 1, Tdap: 1, HPV: 2,
  },
  "9": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 1, Tdap: 1, HPV: 2,
  },
  "10": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 1, Tdap: 1, HPV: 2,
  },
  "11": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 1, Tdap: 1, HPV: 2,
  },
  "12": {
    HepB: 3, DTaP: 5, IPV: 4, MMR: 2, Varicella: 2,
    HepA: 2, MenACWY: 2, Tdap: 1, HPV: 2,
  },
};
