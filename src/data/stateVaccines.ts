// State-by-state school-required vaccine data
// Sources: CDC, state health department immunization schedules, state statutes
// Last verified against published requirements: 2024-2025 school year
// IMPORTANT: Always verify with current state health department before clinical use.

export type VaccineSet = "school" | "cdc";

export type GradeLevel =
  | "PK"
  | "K"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12";

export interface StateVaccineRequirement {
  vaccine: string;        // Full name
  shortName: string;      // Abbreviation (used in schedule)
  totalDoses: number;     // Total doses required in the series for school
  entryGrades: GradeLevel[]; // Grade levels at which this is checked/required
  notes?: string;
}

export interface StateData {
  name: string;
  code: string;
  requirements: StateVaccineRequirement[];
  exemptions: string;  // brief note on exemptions available
  source: string;
}

// Helper: base requirements that nearly every state shares
const baseKindergartenVaccines: StateVaccineRequirement[] = [
  {
    vaccine: "Diphtheria, Tetanus, Pertussis (DTaP)",
    shortName: "DTaP",
    totalDoses: 5,
    entryGrades: ["K"],
    notes: "5 doses; 4 doses acceptable if 4th dose given on or after 4th birthday",
  },
  {
    vaccine: "Polio (IPV)",
    shortName: "IPV",
    totalDoses: 4,
    entryGrades: ["K"],
    notes: "4 doses; 3 doses acceptable if 3rd dose given on or after 4th birthday",
  },
  {
    vaccine: "Measles, Mumps, Rubella (MMR)",
    shortName: "MMR",
    totalDoses: 2,
    entryGrades: ["K"],
  },
  {
    vaccine: "Varicella (Chickenpox)",
    shortName: "Varicella",
    totalDoses: 2,
    entryGrades: ["K"],
    notes: "History of disease or lab evidence of immunity may substitute",
  },
  {
    vaccine: "Hepatitis B",
    shortName: "HepB",
    totalDoses: 3,
    entryGrades: ["K"],
  },
];

const tdapMenRequirements: StateVaccineRequirement[] = [
  {
    vaccine: "Tetanus, Diphtheria, Pertussis (Tdap)",
    shortName: "Tdap",
    totalDoses: 1,
    entryGrades: ["7"],
    notes: "Booster required at or after age 11",
  },
  {
    vaccine: "Meningococcal (MenACWY)",
    shortName: "MenACWY",
    totalDoses: 1,
    entryGrades: ["7"],
    notes: "1st dose at age 11-12; booster at age 16 required by some states",
  },
];

const hepARequirement: StateVaccineRequirement = {
  vaccine: "Hepatitis A",
  shortName: "HepA",
  totalDoses: 2,
  entryGrades: ["K"],
  notes: "2-dose series starting at 12 months; min 6 months between doses",
};

const hibRequirement: StateVaccineRequirement = {
  vaccine: "Haemophilus influenzae type b (Hib)",
  shortName: "Hib",
  totalDoses: 4,
  entryGrades: ["K"],
  notes: "Required through age 59 months; number of doses varies by brand and age started",
};

const pcvRequirement: StateVaccineRequirement = {
  vaccine: "Pneumococcal Conjugate (PCV)",
  shortName: "PCV",
  totalDoses: 4,
  entryGrades: ["K"],
  notes: "Required by some states for childcare/pre-K",
};

const hpvRequirement: StateVaccineRequirement = {
  vaccine: "Human Papillomavirus (HPV)",
  shortName: "HPV",
  totalDoses: 2,
  entryGrades: ["7"],
  notes: "2-dose series starting at age 11-12; 3 doses if started at age 15+",
};

const menBooster: StateVaccineRequirement = {
  vaccine: "Meningococcal Booster (MenACWY)",
  shortName: "MenACWY-Booster",
  totalDoses: 1,
  entryGrades: ["12"],
  notes: "2nd dose booster required before 12th grade or age 16",
};

export const STATE_VACCINE_DATA: Record<string, StateData> = {
  AL: {
    name: "Alabama",
    code: "AL",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Alabama Department of Public Health - https://www.alabamapublichealth.gov/immunization/school.html",
  },
  AK: {
    name: "Alaska",
    code: "AK",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Alaska DHSS Division of Public Health - https://dhss.alaska.gov/dph/Epi/iz/Pages/schools.aspx",
  },
  AZ: {
    name: "Arizona",
    code: "AZ",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and personal belief exemptions available",
    source: "Arizona Department of Health Services - https://www.azdhs.gov/preparedness/epidemiology-disease-control/immunization/index.php#schools-colleges",
  },
  AR: {
    name: "Arkansas",
    code: "AR",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Arkansas Department of Health - https://www.healthy.arkansas.gov/programs-services/topics/school-immunization-requirements",
  },
  CA: {
    name: "California",
    code: "CA",
    requirements: [
      ...baseKindergartenVaccines,
      hibRequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical exemptions only (personal belief exemption eliminated 2016 per SB 277)",
    source: "California Department of Public Health - https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/Immunization/School/shotsforschool.aspx",
  },
  CO: {
    name: "Colorado",
    code: "CO",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and personal belief exemptions available (with education requirement)",
    source: "Colorado Department of Public Health and Environment - https://cdphe.colorado.gov/immunization/school-required-immunizations",
  },
  CT: {
    name: "Connecticut",
    code: "CT",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      hpvRequirement,
    ],
    exemptions: "Medical exemptions only (religious exemption eliminated 2021)",
    source: "Connecticut Department of Public Health - https://portal.ct.gov/DPH/Immunizations/School-Immunization-Requirements",
  },
  DE: {
    name: "Delaware",
    code: "DE",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Delaware Division of Public Health - https://dhss.delaware.gov/dph/dpc/immschool.html",
  },
  FL: {
    name: "Florida",
    code: "FL",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Florida Department of Health - https://www.floridahealth.gov/programs-and-services/immunization/school-immunizations/",
  },
  GA: {
    name: "Georgia",
    code: "GA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Georgia Department of Public Health - https://dph.georgia.gov/immunization-section/school-requirements",
  },
  HI: {
    name: "Hawaii",
    code: "HI",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      ...tdapMenRequirements,
      hpvRequirement,
    ],
    exemptions: "Medical exemptions only (religious exemption removed 2023 per HB 1271)",
    source: "Hawaii Department of Health - https://health.hawaii.gov/immunization/school-and-childcare-immunization-requirements/",
  },
  ID: {
    name: "Idaho",
    code: "ID",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and personal belief exemptions available",
    source: "Idaho Division of Public Health - https://healthandwelfare.idaho.gov/medical-assistance/immunizations/school-immunization-requirements",
  },
  IL: {
    name: "Illinois",
    code: "IL",
    requirements: [
      ...baseKindergartenVaccines,
      hibRequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Illinois Department of Public Health - https://dph.illinois.gov/topics-services/life-stages-populations/child-health/immunizations/school-immunization-requirements",
  },
  IN: {
    name: "Indiana",
    code: "IN",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Indiana Department of Health - https://www.in.gov/health/immunization/immunization-requirements-for-schools/",
  },
  IA: {
    name: "Iowa",
    code: "IA",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Iowa Department of Public Health - https://idph.iowa.gov/Immunization/school",
  },
  KS: {
    name: "Kansas",
    code: "KS",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and personal belief exemptions available",
    source: "Kansas Department of Health and Environment - https://www.kdhe.ks.gov/179/Immunization",
  },
  KY: {
    name: "Kentucky",
    code: "KY",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Kentucky Cabinet for Health and Family Services - https://chfs.ky.gov/agencies/dph/dphps/idb/Pages/schoolimm.aspx",
  },
  LA: {
    name: "Louisiana",
    code: "LA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Louisiana Department of Health - https://ldh.la.gov/page/immunization-requirements-for-schools-and-childcare-facilities",
  },
  ME: {
    name: "Maine",
    code: "ME",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical exemptions only (philosophical exemption eliminated 2020 per LD 798)",
    source: "Maine CDC - https://www.maine.gov/dhhs/mecdc/infectious-disease/immunization/schools.shtml",
  },
  MD: {
    name: "Maryland",
    code: "MD",
    requirements: [
      ...baseKindergartenVaccines,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Maryland Department of Health - https://health.maryland.gov/phpa/OIDEOR/IMMUN/Pages/school.aspx",
  },
  MA: {
    name: "Massachusetts",
    code: "MA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Massachusetts Department of Public Health - https://www.mass.gov/service-details/immunization-requirements-for-school",
  },
  MI: {
    name: "Michigan",
    code: "MI",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available (with waiver process)",
    source: "Michigan Department of Health and Human Services - https://www.michigan.gov/mdhhs/keep-mi-healthy/immunization/school",
  },
  MN: {
    name: "Minnesota",
    code: "MN",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Minnesota Department of Health - https://www.health.state.mn.us/people/immunize/schools/index.html",
  },
  MS: {
    name: "Mississippi",
    code: "MS",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical exemptions only (one of the strictest policies in the US)",
    source: "Mississippi State Department of Health - https://msdh.ms.gov/page/14,0,71,180.html",
  },
  MO: {
    name: "Missouri",
    code: "MO",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Missouri Department of Health and Senior Services - https://health.mo.gov/safety/immunize/school/",
  },
  MT: {
    name: "Montana",
    code: "MT",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Montana Department of Public Health and Human Services - https://dphhs.mt.gov/publichealth/Immunization/schools",
  },
  NE: {
    name: "Nebraska",
    code: "NE",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Nebraska Department of Health and Human Services - https://dhhs.ne.gov/Pages/Immunization-School.aspx",
  },
  NV: {
    name: "Nevada",
    code: "NV",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Nevada Division of Public and Behavioral Health - https://dpbh.nv.gov/Programs/IMSN/Immunization-Schools-Program/",
  },
  NH: {
    name: "New Hampshire",
    code: "NH",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "New Hampshire Department of Health and Human Services - https://www.dhhs.nh.gov/programs-services/disease-prevention/immunization/school-immunizations",
  },
  NJ: {
    name: "New Jersey",
    code: "NJ",
    requirements: [
      ...baseKindergartenVaccines,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "New Jersey Department of Health - https://www.state.nj.us/health/cd/topics/vaccines_schools.shtml",
  },
  NM: {
    name: "New Mexico",
    code: "NM",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "New Mexico Department of Health - https://www.nmhealth.org/about/phd/idb/ip/school/",
  },
  NY: {
    name: "New York",
    code: "NY",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical exemptions only (religious exemption eliminated 2019 per Chapter 35 of Laws of 2019)",
    source: "New York State Department of Health - https://www.health.ny.gov/prevention/immunization/schools/",
  },
  NC: {
    name: "North Carolina",
    code: "NC",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "North Carolina Department of Health and Human Services - https://immunize.nc.gov/schools/",
  },
  ND: {
    name: "North Dakota",
    code: "ND",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "North Dakota Department of Health - https://www.health.nd.gov/immunization/school-immunization-requirements",
  },
  OH: {
    name: "Ohio",
    code: "OH",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Ohio Department of Health - https://odh.ohio.gov/know-our-programs/immunization/resources/school-requirements",
  },
  OK: {
    name: "Oklahoma",
    code: "OK",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Oklahoma State Department of Health - https://oklahoma.gov/health/disease-prevention/immunizations.html",
  },
  OR: {
    name: "Oregon",
    code: "OR",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical exemptions only (personal belief exemption eliminated 2019 per SB 895)",
    source: "Oregon Health Authority - https://www.oregon.gov/oha/PH/PREVENTIONWELLNESS/VACCINESIMMUNIZATION/GETTINGIMMUNIZED/Pages/schoolrules.aspx",
  },
  PA: {
    name: "Pennsylvania",
    code: "PA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Pennsylvania Department of Health - https://www.health.pa.gov/topics/programs/immunizations/Pages/School-Requirements.aspx",
  },
  RI: {
    name: "Rhode Island",
    code: "RI",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
      hpvRequirement,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Rhode Island Department of Health - https://health.ri.gov/immunization/for/schools/",
  },
  SC: {
    name: "South Carolina",
    code: "SC",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "South Carolina Department of Health and Environmental Control - https://scdhec.gov/health/child-teen-health/vaccines-immunizations/vaccines-school-childcare",
  },
  SD: {
    name: "South Dakota",
    code: "SD",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "South Dakota Department of Health - https://doh.sd.gov/diseases/infectious/vaccine/school.aspx",
  },
  TN: {
    name: "Tennessee",
    code: "TN",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Tennessee Department of Health - https://www.tn.gov/health/health-program-areas/fhw/immunization/school-requirements.html",
  },
  TX: {
    name: "Texas",
    code: "TX",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
      menBooster,
    ],
    exemptions: "Medical and religious/philosophical exemptions available",
    source: "Texas Department of State Health Services - https://www.dshs.texas.gov/immunize/school/default.shtm",
  },
  UT: {
    name: "Utah",
    code: "UT",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and personal belief exemptions available",
    source: "Utah Department of Health - https://immunize.utah.gov/school-childcare/",
  },
  VT: {
    name: "Vermont",
    code: "VT",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available (philosophical exemption eliminated 2015)",
    source: "Vermont Department of Health - https://www.healthvermont.gov/disease-control/immunization/schools",
  },
  VA: {
    name: "Virginia",
    code: "VA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      ...tdapMenRequirements,
      menBooster,
      hpvRequirement,
    ],
    exemptions: "Medical and religious exemptions available",
    source: "Virginia Department of Health - https://www.vdh.virginia.gov/immunization/requirements/",
  },
  WA: {
    name: "Washington",
    code: "WA",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical and religious exemptions available (personal belief exemption eliminated for MMR 2019)",
    source: "Washington State Department of Health - https://doh.wa.gov/you-and-your-family/immunization/immunization-requirements",
  },
  WV: {
    name: "West Virginia",
    code: "WV",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical exemptions only (one of the strictest in the US)",
    source: "West Virginia Bureau for Public Health - https://dhhr.wv.gov/bph/pages/immunization.aspx",
  },
  WI: {
    name: "Wisconsin",
    code: "WI",
    requirements: [
      ...baseKindergartenVaccines,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Wisconsin Department of Health Services - https://www.dhs.wisconsin.gov/immunization/schoolrequirements.htm",
  },
  WY: {
    name: "Wyoming",
    code: "WY",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      ...tdapMenRequirements,
    ],
    exemptions: "Medical, religious, and philosophical exemptions available",
    source: "Wyoming Department of Health - https://health.wyo.gov/publichealth/immunization/school-requirements/",
  },
  DC: {
    name: "District of Columbia",
    code: "DC",
    requirements: [
      ...baseKindergartenVaccines,
      hepARequirement,
      hibRequirement,
      pcvRequirement,
      ...tdapMenRequirements,
      menBooster,
      hpvRequirement,
    ],
    exemptions: "Medical exemptions only",
    source: "DC Department of Health - https://dchealth.dc.gov/service/school-health-immunization-program",
  },
};

// Get vaccines required for a specific grade entry
export function getVaccinesForGrade(
  stateCode: string,
  entryGrade: GradeLevel
): StateVaccineRequirement[] {
  const state = STATE_VACCINE_DATA[stateCode];
  if (!state) return [];

  const gradeOrder: GradeLevel[] = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const entryIdx = gradeOrder.indexOf(entryGrade);

  // Return all vaccines that are checked at or before the entry grade
  return state.requirements.filter((req) =>
    req.entryGrades.some((g) => gradeOrder.indexOf(g) <= entryIdx)
  );
}

// All CDC-recommended childhood & adolescent vaccines (regardless of state mandate)
// Source: CDC Recommended Child & Adolescent Immunization Schedule 2024
export const ALL_CDC_VACCINES: StateVaccineRequirement[] = [
  {
    vaccine: "Hepatitis B",
    shortName: "HepB",
    totalDoses: 3,
    entryGrades: ["K"],
  },
  {
    vaccine: "Diphtheria, Tetanus, Pertussis (DTaP)",
    shortName: "DTaP",
    totalDoses: 5,
    entryGrades: ["K"],
    notes: "5 doses; 4 doses acceptable if 4th dose given on or after 4th birthday",
  },
  {
    vaccine: "Polio (IPV)",
    shortName: "IPV",
    totalDoses: 4,
    entryGrades: ["K"],
  },
  {
    vaccine: "Haemophilus influenzae type b (Hib)",
    shortName: "Hib",
    totalDoses: 4,
    entryGrades: ["K"],
    notes: "CDC recommends through age 59 months",
  },
  {
    vaccine: "Pneumococcal Conjugate (PCV15/PCV20)",
    shortName: "PCV",
    totalDoses: 4,
    entryGrades: ["K"],
  },
  {
    vaccine: "Measles, Mumps, Rubella (MMR)",
    shortName: "MMR",
    totalDoses: 2,
    entryGrades: ["K"],
  },
  {
    vaccine: "Varicella (Chickenpox)",
    shortName: "Varicella",
    totalDoses: 2,
    entryGrades: ["K"],
    notes: "History of disease or lab evidence of immunity may substitute",
  },
  {
    vaccine: "Hepatitis A",
    shortName: "HepA",
    totalDoses: 2,
    entryGrades: ["K"],
    notes: "2-dose series starting at 12 months; min 6 months between doses",
  },
  {
    vaccine: "Tetanus, Diphtheria, Pertussis (Tdap)",
    shortName: "Tdap",
    totalDoses: 1,
    entryGrades: ["7"],
    notes: "Booster at age 11–12",
  },
  {
    vaccine: "Meningococcal (MenACWY)",
    shortName: "MenACWY",
    totalDoses: 2,
    entryGrades: ["7"],
    notes: "Dose 1 at age 11–12; booster dose at age 16",
  },
  {
    vaccine: "Human Papillomavirus (HPV)",
    shortName: "HPV",
    totalDoses: 2,
    entryGrades: ["7"],
    notes: "2-dose series starting at age 11–12; 3 doses if started at age 15+",
  },
];

// Individually selectable vaccines that are not universally mandated or are more contested
export const OPTIONAL_VACCINES: StateVaccineRequirement[] = [
  {
    vaccine: "Human Papillomavirus (HPV)",
    shortName: "HPV",
    totalDoses: 2,
    entryGrades: ["7"],
    notes: "2-dose series starting at age 11–12; 3 doses if started at age 15+",
  },
  {
    vaccine: "Influenza (Flu)",
    shortName: "Flu",
    totalDoses: 2,
    entryGrades: ["K"],
    notes: "Annual vaccination recommended; 2 doses for first-time recipients under age 9",
  },
  {
    vaccine: "COVID-19",
    shortName: "COVID",
    totalDoses: 2,
    entryGrades: ["K"],
    notes: "2-dose primary series; annual updated dose recommended thereafter",
  },
];

// Filter CDC vaccines relevant for a given catch-up entry grade
export function getAllCDCVaccinesForGrade(entryGrade: GradeLevel): StateVaccineRequirement[] {
  const gradeOrder: GradeLevel[] = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const entryIdx = gradeOrder.indexOf(entryGrade);
  return ALL_CDC_VACCINES.filter((req) =>
    req.entryGrades.some((g) => gradeOrder.indexOf(g) <= entryIdx)
  );
}

export function getStateList(): { code: string; name: string }[] {
  return Object.values(STATE_VACCINE_DATA)
    .map(({ code, name }) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
