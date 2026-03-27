"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">VaccineScheduler</span>
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-blue-100 text-xs font-semibold rounded">
            Physician Tool
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Physician Notice Banner */}
        <div className="mb-10 inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-300/40 text-yellow-100 px-5 py-3 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          For use by licensed physicians and healthcare professionals
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-4xl">
          Give Parents a Clear{" "}
          <span className="text-yellow-300">Vaccine Roadmap</span>
        </h1>

        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mb-4 leading-relaxed">
          Generate a personalized vaccine schedule your patients can actually follow —
          built around their existing records, with real appointment dates, no weekends, no holidays.
        </p>

        <p className="text-blue-200 max-w-2xl mb-12 leading-relaxed">
          Enter the child&apos;s prior vaccination history and the schedule picks up exactly
          where they left off — applying strict CDC interval rules with the 4-day grace period.
          Choose between the <strong className="text-white">full CDC-recommended schedule</strong>,
          only the <strong className="text-white">vaccines mandated for school entry</strong>,
          or add optional vaccines like HPV, Flu, and COVID-19 individually.
        </p>

        <Link
          href="/builder"
          className="inline-block bg-yellow-400 text-blue-900 font-bold text-lg px-10 py-4 rounded-xl hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Build a Vaccine Schedule →
        </Link>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="Prior Records Built In"
            body="Enter doses already received and the schedule picks up from there — enforcing CDC minimums and the 4-day grace period, with automatic DTaP dose 5 waiver logic."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Smart Date Avoidance"
            body="Schedules automatically skip weekends, US federal holidays, and all Jewish Yomim Tovim including Chol HaMoed."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            title="All 50 States + Catch-Up"
            body="State school mandates or the full CDC schedule, for birth or any grade entry. Controversial vaccines (HPV, Flu, COVID) are individually opt-in."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-white/10 text-center text-blue-200 text-sm">
        <p className="mb-1">
          Based on CDC Recommended Child &amp; Adolescent Immunization Schedule (2024) and
          state health department school entry requirements.
        </p>
        <p className="text-blue-300 text-xs">
          This tool is for physician use in patient counseling only. It does not constitute medical advice.
          Always verify requirements with your state health department before clinical use.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-blue-100 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
