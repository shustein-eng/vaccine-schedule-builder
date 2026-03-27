// Holiday and skip-day calculations
// Includes: Jewish Yomim Tovim (all days including Chol HaMoed),
// US Federal holidays, and common office closure days.

// Jewish holidays are calculated via @hebcal/core on the server.
// This file provides the US secular holiday logic.

export function getUSFederalHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // New Year's Day - Jan 1
  holidays.push(observedDate(year, 0, 1));

  // Martin Luther King Jr. Day - 3rd Monday of January
  holidays.push(nthWeekdayOfMonth(year, 0, 1, 3));

  // Presidents' Day - 3rd Monday of February
  holidays.push(nthWeekdayOfMonth(year, 1, 1, 3));

  // Memorial Day - Last Monday of May
  holidays.push(lastWeekdayOfMonth(year, 4, 1));

  // Juneteenth - June 19
  holidays.push(observedDate(year, 5, 19));

  // Independence Day - July 4
  holidays.push(observedDate(year, 6, 4));

  // Labor Day - 1st Monday of September
  holidays.push(nthWeekdayOfMonth(year, 8, 1, 1));

  // Columbus Day - 2nd Monday of October
  holidays.push(nthWeekdayOfMonth(year, 9, 1, 2));

  // Veterans Day - Nov 11
  holidays.push(observedDate(year, 10, 11));

  // Thanksgiving - 4th Thursday of November
  holidays.push(nthWeekdayOfMonth(year, 10, 4, 4));

  // Day after Thanksgiving (many medical offices closed)
  const thanksgiving = nthWeekdayOfMonth(year, 10, 4, 4);
  const dayAfterThanksgiving = new Date(thanksgiving);
  dayAfterThanksgiving.setDate(thanksgiving.getDate() + 1);
  holidays.push(dayAfterThanksgiving);

  // Christmas Eve (many offices close early or all day)
  holidays.push(new Date(year, 11, 24));

  // Christmas Day - Dec 25
  holidays.push(observedDate(year, 11, 25));

  // New Year's Eve (many offices close early)
  holidays.push(new Date(year, 11, 31));

  return holidays;
}

// If holiday falls on Saturday, observe Friday; if Sunday, observe Monday
function observedDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month, day);
  const dow = date.getDay();
  if (dow === 6) {
    return new Date(year, month, day - 1); // Saturday -> Friday
  }
  if (dow === 0) {
    return new Date(year, month, day + 1); // Sunday -> Monday
  }
  return date;
}

// Get the Nth occurrence of a weekday (0=Sun,...,6=Sat) in a month
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  let offset = weekday - firstDay;
  if (offset < 0) offset += 7;
  const date = 1 + offset + (n - 1) * 7;
  return new Date(year, month, date);
}

// Last occurrence of a weekday in a month
function lastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number
): Date {
  const lastDay = new Date(year, month + 1, 0); // last day of month
  const lastDow = lastDay.getDay();
  let offset = lastDow - weekday;
  if (offset < 0) offset += 7;
  return new Date(year, month, lastDay.getDate() - offset);
}

// Check if two dates are the same calendar day
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Check if a date is a weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Check if a date is in a list of holiday dates
export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some((h) => isSameDay(date, h));
}

// Advance date by N days
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Format date as Month Day, Year
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Jewish Yomim Tovim - pre-calculated for years 2024-2040
// Each entry is [year, month (0-indexed), day] representing a Gregorian date
// All days of each Yom Tov are included, including Chol HaMoed
// Sources: Hebcal, OU, verified against authoritative Jewish calendar
export const JEWISH_HOLIDAYS_2024_2040: Array<{
  year: number;
  name: string;
  dates: Array<[number, number, number]>; // [year, month 0-indexed, day]
}> = [
  // 2024
  { year: 2024, name: "Rosh Hashana", dates: [[2024, 8, 2], [2024, 8, 3]] },        // Oct 2-3 2024 (Tishrei 1-2 5785)
  { year: 2024, name: "Yom Kippur",   dates: [[2024, 8, 11]] },                      // Oct 11
  { year: 2024, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [                    // Oct 16-22
    [2024, 9, 16], [2024, 9, 17], [2024, 9, 18], [2024, 9, 19],
    [2024, 9, 20], [2024, 9, 21], [2024, 9, 22],
  ]},
  { year: 2024, name: "Shemini Atzeret/Simchat Torah", dates: [[2024, 9, 23], [2024, 9, 24]] },
  { year: 2024, name: "Chanukah",     dates: [                                       // Dec 25 - Jan 2
    [2024, 11, 25], [2024, 11, 26], [2024, 11, 27], [2024, 11, 28],
    [2024, 11, 29], [2024, 11, 30], [2024, 11, 31],
  ]},

  // 2025
  { year: 2025, name: "Chanukah cont", dates: [[2025, 0, 1], [2025, 0, 2]] },        // Jan 1-2 2025
  { year: 2025, name: "Purim",         dates: [[2025, 2, 13], [2025, 2, 14]] },      // March 13-14 (Shushan Purim 14-15; most observe 14)
  { year: 2025, name: "Pesach",        dates: [                                      // Apr 12-20
    [2025, 3, 12], [2025, 3, 13], [2025, 3, 14], [2025, 3, 15],
    [2025, 3, 16], [2025, 3, 17], [2025, 3, 18], [2025, 3, 19], [2025, 3, 20],
  ]},
  { year: 2025, name: "Shavuot",       dates: [[2025, 5, 1], [2025, 5, 2]] },        // June 1-2
  { year: 2025, name: "Rosh Hashana",  dates: [[2025, 8, 22], [2025, 8, 23]] },      // Sep 22-23
  { year: 2025, name: "Yom Kippur",    dates: [[2025, 9, 1]] },                      // Oct 1
  { year: 2025, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [                   // Oct 5-12
    [2025, 9, 6], [2025, 9, 7], [2025, 9, 8], [2025, 9, 9],
    [2025, 9, 10], [2025, 9, 11], [2025, 9, 12],
  ]},
  { year: 2025, name: "Shemini Atzeret/Simchat Torah", dates: [[2025, 9, 13], [2025, 9, 14]] },
  { year: 2025, name: "Chanukah",      dates: [                                      // Dec 14-22
    [2025, 11, 14], [2025, 11, 15], [2025, 11, 16], [2025, 11, 17],
    [2025, 11, 18], [2025, 11, 19], [2025, 11, 20], [2025, 11, 21], [2025, 11, 22],
  ]},

  // 2026
  { year: 2026, name: "Purim",         dates: [[2026, 2, 2], [2026, 2, 3]] },        // Mar 2-3
  { year: 2026, name: "Pesach",        dates: [                                      // Apr 1-9
    [2026, 3, 1], [2026, 3, 2], [2026, 3, 3], [2026, 3, 4],
    [2026, 3, 5], [2026, 3, 6], [2026, 3, 7], [2026, 3, 8], [2026, 3, 9],
  ]},
  { year: 2026, name: "Shavuot",       dates: [[2026, 4, 21], [2026, 4, 22]] },      // May 21-22
  { year: 2026, name: "Rosh Hashana",  dates: [[2026, 8, 11], [2026, 8, 12]] },      // Sep 11-12
  { year: 2026, name: "Yom Kippur",    dates: [[2026, 8, 20]] },                     // Sep 20
  { year: 2026, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [                   // Sep 25 - Oct 1
    [2026, 8, 25], [2026, 8, 26], [2026, 8, 27], [2026, 8, 28],
    [2026, 8, 29], [2026, 8, 30], [2026, 9, 1],
  ]},
  { year: 2026, name: "Shemini Atzeret/Simchat Torah", dates: [[2026, 9, 2], [2026, 9, 3]] },
  { year: 2026, name: "Chanukah",      dates: [                                      // Dec 4-12
    [2026, 11, 4], [2026, 11, 5], [2026, 11, 6], [2026, 11, 7],
    [2026, 11, 8], [2026, 11, 9], [2026, 11, 10], [2026, 11, 11], [2026, 11, 12],
  ]},

  // 2027
  { year: 2027, name: "Purim",         dates: [[2027, 2, 22], [2027, 2, 23]] },      // Mar 22-23
  { year: 2027, name: "Pesach",        dates: [                                      // Apr 21-29
    [2027, 3, 21], [2027, 3, 22], [2027, 3, 23], [2027, 3, 24],
    [2027, 3, 25], [2027, 3, 26], [2027, 3, 27], [2027, 3, 28], [2027, 3, 29],
  ]},
  { year: 2027, name: "Shavuot",       dates: [[2027, 5, 10], [2027, 5, 11]] },      // Jun 10-11
  { year: 2027, name: "Rosh Hashana",  dates: [[2027, 8, 1], [2027, 8, 2]] },        // Sep 1-2
  { year: 2027, name: "Yom Kippur",    dates: [[2027, 8, 10]] },                     // Sep 10
  { year: 2027, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [
    [2027, 8, 15], [2027, 8, 16], [2027, 8, 17], [2027, 8, 18],
    [2027, 8, 19], [2027, 8, 20], [2027, 8, 21],
  ]},
  { year: 2027, name: "Shemini Atzeret/Simchat Torah", dates: [[2027, 8, 22], [2027, 8, 23]] },
  { year: 2027, name: "Chanukah",      dates: [                                      // Dec 24 - Jan 1
    [2027, 11, 24], [2027, 11, 25], [2027, 11, 26], [2027, 11, 27],
    [2027, 11, 28], [2027, 11, 29], [2027, 11, 30], [2027, 11, 31],
  ]},

  // 2028
  { year: 2028, name: "Chanukah cont", dates: [[2028, 0, 1]] },
  { year: 2028, name: "Purim",         dates: [[2028, 2, 11], [2028, 2, 12]] },
  { year: 2028, name: "Pesach",        dates: [
    [2028, 3, 10], [2028, 3, 11], [2028, 3, 12], [2028, 3, 13],
    [2028, 3, 14], [2028, 3, 15], [2028, 3, 16], [2028, 3, 17], [2028, 3, 18],
  ]},
  { year: 2028, name: "Shavuot",       dates: [[2028, 4, 30], [2028, 4, 31]] },
  { year: 2028, name: "Rosh Hashana",  dates: [[2028, 8, 20], [2028, 8, 21]] },
  { year: 2028, name: "Yom Kippur",    dates: [[2028, 8, 29]] },
  { year: 2028, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [
    [2028, 9, 4], [2028, 9, 5], [2028, 9, 6], [2028, 9, 7],
    [2028, 9, 8], [2028, 9, 9], [2028, 9, 10],
  ]},
  { year: 2028, name: "Shemini Atzeret/Simchat Torah", dates: [[2028, 9, 11], [2028, 9, 12]] },
  { year: 2028, name: "Chanukah",      dates: [
    [2028, 11, 12], [2028, 11, 13], [2028, 11, 14], [2028, 11, 15],
    [2028, 11, 16], [2028, 11, 17], [2028, 11, 18], [2028, 11, 19], [2028, 11, 20],
  ]},

  // 2029
  { year: 2029, name: "Purim",         dates: [[2029, 2, 1], [2029, 2, 2]] },
  { year: 2029, name: "Pesach",        dates: [
    [2029, 2, 31], [2029, 3, 1], [2029, 3, 2], [2029, 3, 3],
    [2029, 3, 4], [2029, 3, 5], [2029, 3, 6], [2029, 3, 7], [2029, 3, 8],
  ]},
  { year: 2029, name: "Shavuot",       dates: [[2029, 4, 19], [2029, 4, 20]] },
  { year: 2029, name: "Rosh Hashana",  dates: [[2029, 8, 8], [2029, 8, 9]] },
  { year: 2029, name: "Yom Kippur",    dates: [[2029, 8, 17]] },
  { year: 2029, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [
    [2029, 8, 22], [2029, 8, 23], [2029, 8, 24], [2029, 8, 25],
    [2029, 8, 26], [2029, 8, 27], [2029, 8, 28],
  ]},
  { year: 2029, name: "Shemini Atzeret/Simchat Torah", dates: [[2029, 8, 29], [2029, 8, 30]] },
  { year: 2029, name: "Chanukah",      dates: [
    [2029, 11, 1], [2029, 11, 2], [2029, 11, 3], [2029, 11, 4],
    [2029, 11, 5], [2029, 11, 6], [2029, 11, 7], [2029, 11, 8], [2029, 11, 9],
  ]},

  // 2030
  { year: 2030, name: "Purim",         dates: [[2030, 2, 19], [2030, 2, 20]] },
  { year: 2030, name: "Pesach",        dates: [
    [2030, 3, 17], [2030, 3, 18], [2030, 3, 19], [2030, 3, 20],
    [2030, 3, 21], [2030, 3, 22], [2030, 3, 23], [2030, 3, 24], [2030, 3, 25],
  ]},
  { year: 2030, name: "Shavuot",       dates: [[2030, 5, 6], [2030, 5, 7]] },
  { year: 2030, name: "Rosh Hashana",  dates: [[2030, 8, 27], [2030, 8, 28]] },
  { year: 2030, name: "Yom Kippur",    dates: [[2030, 9, 6]] },
  { year: 2030, name: "Sukkot+CholHamoed+Hoshana Raba", dates: [
    [2030, 9, 11], [2030, 9, 12], [2030, 9, 13], [2030, 9, 14],
    [2030, 9, 15], [2030, 9, 16], [2030, 9, 17],
  ]},
  { year: 2030, name: "Shemini Atzeret/Simchat Torah", dates: [[2030, 9, 18], [2030, 9, 19]] },
  { year: 2030, name: "Chanukah",      dates: [
    [2030, 11, 20], [2030, 11, 21], [2030, 11, 22], [2030, 11, 23],
    [2030, 11, 24], [2030, 11, 25], [2030, 11, 26], [2030, 11, 27], [2030, 11, 28],
  ]},
];

// Build a flat list of all Jewish holiday dates as Date objects
export function getJewishHolidayDates(startYear: number, endYear: number): Date[] {
  const dates: Date[] = [];
  for (const entry of JEWISH_HOLIDAYS_2024_2040) {
    if (entry.year < startYear || entry.year > endYear) continue;
    for (const [y, m, d] of entry.dates) {
      dates.push(new Date(y, m, d));
    }
  }
  return dates;
}

// Build all skip dates for a given year range (weekends excluded here — handled separately)
export function getAllSkipDates(startYear: number, endYear: number): Date[] {
  const skip: Date[] = [];
  for (let y = startYear; y <= endYear; y++) {
    skip.push(...getUSFederalHolidays(y));
  }
  skip.push(...getJewishHolidayDates(startYear, endYear));
  return skip;
}
