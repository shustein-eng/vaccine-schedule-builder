"use client";

import { useState } from "react";

interface Dose {
  vaccine: string;
  shortName: string;
  doseNumber: number;
  totalDoses: number;
  scheduledDate: string;
  scheduledDateFormatted: string;
  scheduledDateShort: string;
  ageAtDose?: string;
  notes?: string;
  isCatchUp: boolean;
}

interface Appointment {
  date: string;
  dateFormatted: string;
  dateShort: string;
  ageLabel: string;
  doses: Dose[];
}

interface Schedule {
  appointments: Appointment[];
  stateCode: string;
  stateName: string;
  startMode: "birth" | "catchup";
  entryGrade?: string;
  startDate: string;
  birthDate?: string;
  vaccinesIncluded: string[];
  totalAppointments: number;
  disclaimer: string;
}

// Vaccine color mapping for visual distinction
const VACCINE_COLORS: Record<string, string> = {
  HepB:              "bg-blue-200 text-blue-900 border-blue-400",
  DTaP:              "bg-green-200 text-green-900 border-green-400",
  Tdap:              "bg-lime-200 text-lime-900 border-lime-400",
  IPV:               "bg-violet-200 text-violet-900 border-violet-400",
  Hib:               "bg-amber-200 text-amber-900 border-amber-400",
  PCV:               "bg-orange-200 text-orange-900 border-orange-400",
  MMR:               "bg-red-200 text-red-900 border-red-400",
  Varicella:         "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-400",
  HepA:              "bg-indigo-200 text-indigo-900 border-indigo-400",
  MenACWY:           "bg-cyan-200 text-cyan-900 border-cyan-400",
  "MenACWY-Booster": "bg-teal-200 text-teal-900 border-teal-400",
  HPV:               "bg-rose-200 text-rose-900 border-rose-400",
};

function vaccineColor(shortName: string): string {
  return VACCINE_COLORS[shortName] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export default function ScheduleDisplay({
  schedule,
  summary,
}: {
  schedule: Schedule;
  summary: string;
}) {
  const [view, setView] = useState<"timeline" | "table">("timeline");

  const handlePrint = () => window.print();

  const isBirth = schedule.startMode === "birth";
  const totalVaccines = schedule.appointments.reduce((sum, a) => sum + a.doses.length, 0);

  return (
    <div className="bg-white">
      {/* Action Bar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <ViewTab active={view === "timeline"} onClick={() => setView("timeline")} label="Timeline" />
              <ViewTab active={view === "table"} onClick={() => setView("table")} label="Table" />
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Summary Header */}
        <div className="mb-8 print:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 print:text-xl">
                {isBirth ? "Childhood Vaccine Schedule" : "Catch-Up Vaccine Schedule"}
              </h2>
              <p className="text-gray-500 mt-1">
                {schedule.stateName} — {isBirth ? "Standard CDC Schedule (Birth)" : `Entry at Grade ${schedule.entryGrade}`}
              </p>
              {schedule.birthDate && (
                <p className="text-gray-600 mt-1 font-medium">
                  Date of Birth:{" "}
                  {new Date(schedule.birthDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-4 text-center">
              <StatBadge value={schedule.totalAppointments} label="Appointments" color="blue" />
              <StatBadge value={totalVaccines} label="Total Doses" color="teal" />
              <StatBadge value={schedule.vaccinesIncluded.length} label="Vaccines" color="purple" />
            </div>
          </div>

          {/* Vaccines included legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {schedule.vaccinesIncluded.map((v) => (
              <span key={v} className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${vaccineColor(v)}`}>
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5 print:bg-white print:border-gray-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-700 text-white rounded-lg flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">Note for Parents</p>
                <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Content */}
        {view === "timeline" ? (
          <TimelineView appointments={schedule.appointments} />
        ) : (
          <TableView appointments={schedule.appointments} />
        )}

        {/* Disclaimer */}
        <div className="mt-10 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 print:border-gray-400 print:bg-white">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Medical Disclaimer:</strong> {schedule.disclaimer}
          </p>
          <p className="text-xs text-amber-700 mt-2">
            Sources: CDC Recommended Child &amp; Adolescent Immunization Schedule (2024) ·
            {schedule.stateName} Department of Health school immunization requirements ·
            Jewish holidays sourced from authoritative Hebrew calendar calculations.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline View ───────────────────────────────────────────────────────────

function TimelineView({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-100 print:hidden" />

      <div className="space-y-6">
        {appointments.map((appt, idx) => (
          <div key={idx} className="relative flex gap-6">
            {/* Circle */}
            <div className="flex-shrink-0 w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">
              {idx + 1}
            </div>

            {/* Card */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow print:shadow-none print:border-gray-300">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-base">{appt.dateFormatted}</p>
                  <p className="text-sm text-blue-600 font-medium">Age: {appt.ageLabel}</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                  {appt.doses.length} dose{appt.doses.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {appt.doses.map((dose, di) => (
                  <DosePill key={di} dose={dose} />
                ))}
              </div>

              {/* Notes */}
              {appt.doses.some((d) => d.notes) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {appt.doses.filter((d) => d.notes).map((d, ni) => (
                    <p key={ni} className="text-xs text-gray-500 leading-relaxed">
                      <strong>{d.shortName}:</strong> {d.notes}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Table View ──────────────────────────────────────────────────────────────

function TableView({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">#</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Age</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Vaccines Due</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt, idx) => (
            <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
              <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-900">{appt.dateShort}</p>
                <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString("en-US", { weekday: "long" })}</p>
              </td>
              <td className="px-4 py-3 text-blue-700 font-medium text-sm">{appt.ageLabel}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {appt.doses.map((dose, di) => (
                    <DosePill key={di} dose={dose} compact />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function DosePill({ dose, compact = false }: { dose: Dose; compact?: boolean }) {
  const color = vaccineColor(dose.shortName);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${color}`}
      title={dose.notes || dose.vaccine}
    >
      {dose.shortName}
      <span className="opacity-60">#{dose.doseNumber}</span>
      {!compact && dose.isCatchUp && (
        <span className="ml-1 px-1 py-0.5 bg-black/10 rounded text-[10px]">catch-up</span>
      )}
    </span>
  );
}

function StatBadge({
  value, label, color,
}: {
  value: number;
  label: string;
  color: "blue" | "teal" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    teal: "bg-teal-50 border-teal-200 text-teal-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };
  return (
    <div className={`px-4 py-2 rounded-xl border text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}

function ViewTab({
  active, onClick, label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
        active ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
