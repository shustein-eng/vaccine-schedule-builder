"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import { generateStandardSchedule, generateCatchUpSchedule } from "@/lib/scheduleGenerator";
import type { PriorDoseHistory } from "@/lib/scheduleGenerator";
import { getVaccinesForGrade, getAllCDCVaccinesForGrade, ALL_CDC_VACCINES, OPTIONAL_VACCINES, STATE_VACCINE_DATA } from "@/data/stateVaccines";
import type { GradeLevel, VaccineSet, StateVaccineRequirement } from "@/data/stateVaccines";
import { CDC_SCHEDULE } from "@/data/cdcSchedule";

const GRADES: { value: GradeLevel; label: string }[] = [
  { value: "PK", label: "Pre-K (age ~4)" },
  { value: "K",  label: "Kindergarten (age ~5)" },
  { value: "1",  label: "1st Grade (age ~6)" },
  { value: "2",  label: "2nd Grade (age ~7)" },
  { value: "3",  label: "3rd Grade (age ~8)" },
  { value: "4",  label: "4th Grade (age ~9)" },
  { value: "5",  label: "5th Grade (age ~10)" },
  { value: "6",  label: "6th Grade (age ~11)" },
  { value: "7",  label: "7th Grade (age ~12)" },
  { value: "8",  label: "8th Grade (age ~13)" },
  { value: "9",  label: "9th Grade (age ~14)" },
  { value: "10", label: "10th Grade (age ~15)" },
  { value: "11", label: "11th Grade (age ~16)" },
  { value: "12", label: "12th Grade (age ~17)" },
];

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

type Mode = "birth" | "catchup";

// Serialize a schedule (dates → ISO strings) to match ScheduleDisplay's expected shape
function serializeSchedule(schedule: ReturnType<typeof generateStandardSchedule>) {
  return {
    ...schedule,
    startDate: schedule.startDate.toISOString(),
    birthDate: schedule.birthDate?.toISOString(),
    appointments: schedule.appointments.map((a) => ({
      ...a,
      date: a.date.toISOString(),
      doses: a.doses.map((d) => ({
        ...d,
        scheduledDate: d.scheduledDate.toISOString(),
      })),
    })),
  };
}

export default function BuilderPage() {
  const [stateCode, setStateCode] = useState("");
  const [mode, setMode] = useState<Mode>("birth");
  const [vaccineSet, setVaccineSet] = useState<VaccineSet>("school");
  const [selectedOptional, setSelectedOptional] = useState<Set<string>>(new Set());
  const [birthDate, setBirthDate] = useState("");
  const [startDate, setStartDate] = useState("");

  // Prior vaccination records: shortName → doseNumber (1-indexed) → ISO date string
  const [priorHistoryOpen, setPriorHistoryOpen] = useState(false);
  const [priorDatesRaw, setPriorDatesRaw] = useState<Record<string, Record<number, string>>>({});
  const [entryGrade, setEntryGrade] = useState<GradeLevel>("K");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ schedule: ReturnType<typeof serializeSchedule>; summary: string } | null>(null);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Derive which vaccines to show in the prior history table based on current selections
  const priorHistoryVaccines = useMemo(() => {
    if (!stateCode) return [];
    const stateData = STATE_VACCINE_DATA[stateCode];
    if (!stateData) return [];
    let base: StateVaccineRequirement[];
    if (mode === "birth") {
      base = vaccineSet === "cdc" ? ALL_CDC_VACCINES : stateData.requirements;
    } else {
      base = vaccineSet === "cdc"
        ? getAllCDCVaccinesForGrade(entryGrade)
        : getVaccinesForGrade(stateCode, entryGrade);
    }
    const existing = new Set(base.map((v) => v.shortName));
    const extras = OPTIONAL_VACCINES.filter(
      (v) => selectedOptional.has(v.shortName) && !existing.has(v.shortName)
    );
    return [...base, ...extras].map((req) => ({
      req,
      maxDoses: Math.min(req.totalDoses, CDC_SCHEDULE[req.shortName]?.doses.length ?? req.totalDoses),
    }));
  }, [stateCode, mode, vaccineSet, entryGrade, selectedOptional]);

  const maxDoseCols = useMemo(
    () => Math.max(...priorHistoryVaccines.map((v) => v.maxDoses), 1),
    [priorHistoryVaccines]
  );

  function setPriorDate(shortName: string, doseNum: number, value: string) {
    setPriorDatesRaw((prev) => ({
      ...prev,
      [shortName]: { ...(prev[shortName] ?? {}), [doseNum]: value },
    }));
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stateCode) { setError("Please select a state."); return; }
    if (mode === "birth" && !birthDate) { setError("Please enter a birth date."); return; }
    if (mode === "catchup" && !startDate) { setError("Please enter a schedule start date."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const stateData = STATE_VACCINE_DATA[stateCode];
      if (!stateData) throw new Error("Invalid state");

      // ── Generate schedule entirely in the browser — no API call needed ──
      // Merge base vaccines with any individually selected optional vaccines (dedup by shortName)
      function mergeWithOptional(base: StateVaccineRequirement[], gradeFilter?: GradeLevel): StateVaccineRequirement[] {
        const existing = new Set(base.map((v) => v.shortName));
        const extras = OPTIONAL_VACCINES.filter((v) => {
          if (!selectedOptional.has(v.shortName)) return false;
          if (existing.has(v.shortName)) return false; // already included
          if (gradeFilter) {
            const gradeOrder: GradeLevel[] = ["PK","K","1","2","3","4","5","6","7","8","9","10","11","12"];
            const entryIdx = gradeOrder.indexOf(gradeFilter);
            return v.entryGrades.some((g) => gradeOrder.indexOf(g) <= entryIdx);
          }
          return true;
        });
        return [...base, ...extras];
      }

      // Convert raw prior date strings → Date objects (local-time safe)
      const priorHistory: PriorDoseHistory = {};
      for (const [shortName, dosesRaw] of Object.entries(priorDatesRaw)) {
        const parsed: Record<number, Date> = {};
        for (const [doseNumStr, dateStr] of Object.entries(dosesRaw)) {
          if (!dateStr) continue;
          const d = new Date(dateStr + "T00:00:00"); // force local-time parse
          if (!isNaN(d.getTime())) parsed[Number(doseNumStr)] = d;
        }
        if (Object.keys(parsed).length > 0) priorHistory[shortName] = parsed;
      }

      let schedule;
      if (mode === "birth") {
        const base = vaccineSet === "cdc" ? ALL_CDC_VACCINES : stateData.requirements;
        const vaccines = mergeWithOptional(base);
        schedule = generateStandardSchedule(
          stateCode, stateData.name, new Date(birthDate + "T00:00:00"), vaccines, vaccineSet, priorHistory
        );
      } else {
        const base = vaccineSet === "cdc"
          ? getAllCDCVaccinesForGrade(entryGrade)
          : getVaccinesForGrade(stateCode, entryGrade);
        const vaccines = mergeWithOptional(base, entryGrade);
        schedule = generateCatchUpSchedule(
          stateCode, stateData.name, new Date(startDate + "T00:00:00"),
          entryGrade, vaccines, vaccineSet, priorHistory
        );
      }

      const serialized = serializeSchedule(schedule);

      // ── Optionally fetch Claude summary (works online; silently skipped offline) ──
      let summary = "";
      try {
        const res = await fetch("/api/generate-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "birth"
              ? { stateCode, mode, birthDate, summaryOnly: true, apptCount: schedule.appointments.length }
              : { stateCode, mode, startDate, entryGrade, summaryOnly: true, apptCount: schedule.appointments.length }
          ),
          signal: AbortSignal.timeout(8000), // don't wait long for AI
        });
        if (res.ok) {
          const data = await res.json();
          summary = data.summary ?? "";
        }
      } catch {
        // Offline or API unavailable — schedule already generated, no problem
      }

      setResult({ schedule: serialized, summary });

      setTimeout(() => {
        document.getElementById("schedule-result")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-blue-800 hover:text-blue-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-700 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-blue-900">VaccineScheduler</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 no-print">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Generate Vaccine Schedule</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Fill in the details below to create a personalized, printable vaccine schedule
            based on your state&apos;s school-entry requirements and CDC recommendations.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mode Toggle */}
          <div className="border-b border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Schedule Type</p>
            <div className="flex gap-3">
              <ModeButton active={mode === "birth"} onClick={() => { setMode("birth"); setResult(null); }}
                icon="🍼" title="Starting from Birth" desc="Full series from day 0" />
              <ModeButton active={mode === "catchup"} onClick={() => { setMode("catchup"); setResult(null); }}
                icon="📅" title="Catch-Up Schedule" desc="Child starting vaccines at an older age" />
            </div>
          </div>

          {/* Vaccine Set Toggle */}
          <div className="border-b border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Vaccines to Include</p>
            <div className="flex gap-3">
              <ModeButton
                active={vaccineSet === "school"}
                onClick={() => { setVaccineSet("school"); setResult(null); }}
                icon="🏫"
                title="State School Requirements"
                desc={`Vaccines mandated for school entry in the selected state`}
              />
              <ModeButton
                active={vaccineSet === "cdc"}
                onClick={() => { setVaccineSet("cdc"); setResult(null); }}
                icon="🏥"
                title="All CDC-Recommended"
                desc="Full CDC childhood & adolescent schedule regardless of state mandates"
              />
            </div>
          </div>

          {/* Optional / Additional Vaccines */}
          <div className="border-b border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Additional Optional Vaccines</p>
            <p className="text-xs text-gray-400 mb-4">These vaccines are sometimes controversial or not universally mandated. Check any you&apos;d like to include in the schedule.</p>
            <div className="space-y-3">
              {OPTIONAL_VACCINES.map((v) => {
                const checked = selectedOptional.has(v.shortName);
                return (
                  <label
                    key={v.shortName}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      checked ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedOptional((prev) => {
                          const next = new Set(prev);
                          if (next.has(v.shortName)) next.delete(v.shortName);
                          else next.add(v.shortName);
                          return next;
                        });
                        setResult(null);
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                    <div>
                      <p className={`font-semibold text-sm ${checked ? "text-blue-800" : "text-gray-700"}`}>
                        {v.vaccine}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{v.notes}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Prior Vaccination Records */}
          <div className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => setPriorHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div>
                <span className="font-semibold text-sm text-gray-700">Prior Vaccination Records</span>
                <span className="ml-2 text-xs text-gray-400">(optional)</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${priorHistoryOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {priorHistoryOpen && (
              <div className="px-6 pb-6 pt-3 space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter dates for vaccines the patient has already received. Leave blank if not given.
                  Dates are validated against CDC minimums with a 4-day grace period. Invalid doses
                  (given too early or with insufficient spacing) are flagged and re-scheduled.
                  DTaP dose 5 is automatically waived if dose 4 was given on or after the child&apos;s 4th birthday.
                </p>

                {!stateCode ? (
                  <p className="text-xs text-gray-400 italic">Select a state above to see the vaccine list.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs border-collapse w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-28">Vaccine</th>
                          {Array.from({ length: maxDoseCols }, (_, i) => (
                            <th key={i} className="px-2 py-2 font-semibold text-gray-600 text-center whitespace-nowrap">
                              Dose {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {priorHistoryVaccines.map(({ req, maxDoses }) => (
                          <tr key={req.shortName} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{req.shortName}</td>
                            {Array.from({ length: maxDoseCols }, (_, i) => {
                              const doseNum = i + 1;
                              const applicable = doseNum <= maxDoses;
                              const val = priorDatesRaw[req.shortName]?.[doseNum] ?? "";
                              return (
                                <td key={i} className="px-1 py-1.5 text-center">
                                  {applicable ? (
                                    <input
                                      type="date"
                                      max={today}
                                      value={val}
                                      onChange={(e) => setPriorDate(req.shortName, doseNum, e.target.value)}
                                      className="text-xs border border-gray-200 rounded px-1.5 py-1 w-32
                                                 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                    />
                                  ) : (
                                    <span className="text-gray-300 select-none">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {Object.values(priorDatesRaw).some((d) => Object.values(d).some(Boolean)) && (
                  <button
                    type="button"
                    onClick={() => { setPriorDatesRaw({}); setResult(null); }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear all prior records
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* State */}
            <div>
              <label className="label">State</label>
              <select className="select" value={stateCode} onChange={(e) => setStateCode(e.target.value)} required>
                <option value="">— Select a state —</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {vaccineSet === "cdc"
                  ? "All CDC-recommended vaccines will be scheduled regardless of state mandates."
                  : "Only vaccines required for school entry in this state will be scheduled."}
              </p>
            </div>

            {mode === "birth" ? (
              <div>
                <label className="label">Child&apos;s Date of Birth</label>
                <input type="date" className="input" value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)} max={today} required />
                <p className="text-xs text-gray-400 mt-1">The schedule will begin at birth and continue through school age.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Grade the Child is Entering</label>
                  <select className="select" value={entryGrade}
                    onChange={(e) => setEntryGrade(e.target.value as GradeLevel)}>
                    {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">CDC catch-up intervals applied; only doses required for this grade are included.</p>
                </div>
                <div>
                  <label className="label">Start Date for Schedule</label>
                  <input type="date" className="input" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} min={today} required />
                  <p className="text-xs text-gray-400 mt-1">Date of the first appointment; subsequent doses follow CDC catch-up intervals.</p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating schedule…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Generate Schedule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard color="blue" icon="📋" title="Flexible Vaccine Set"
            body="Choose state school-entry mandates only, or the full CDC-recommended schedule including Hib, PCV, HepA, MenACWY, and HPV." />
          <InfoCard color="teal" icon="🗓️" title="Smart Scheduling"
            body="Dates skip weekends, US federal holidays, and all Jewish Yomim Tovim including Chol HaMoed." />
          <InfoCard color="purple" icon="⏱️" title="CDC Intervals"
            body="Minimum intervals strictly respected. Dates are slightly randomized but never closer than CDC minimums." />
        </div>
      </div>

      {result && (
        <div id="schedule-result">
          <ScheduleDisplay schedule={result.schedule} summary={result.summary} />
        </div>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: string; title: string; desc: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
        active ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
      }`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-semibold text-sm ${active ? "text-blue-800" : "text-gray-700"}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

function InfoCard({ color, icon, title, body }: {
  color: "blue" | "teal" | "purple"; icon: string; title: string; body: string;
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    teal: "bg-teal-50 border-teal-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl mb-2">{icon}</p>
      <p className="font-semibold text-gray-800 text-sm mb-1">{title}</p>
      <p className="text-gray-600 text-xs leading-relaxed">{body}</p>
    </div>
  );
}
