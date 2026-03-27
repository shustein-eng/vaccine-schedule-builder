# Vaccine Schedule Builder — Physician Tool

A clinical decision-support tool for physicians to generate personalized, state-compliant childhood vaccine schedules for parent counseling.

---

## Purpose

This tool is designed **for use by licensed physicians and healthcare professionals**. It generates a concrete, printable vaccine schedule that parents can follow — with real appointment dates, not just age ranges.

The opening screen makes clear this is a physician counseling aid, not direct patient advice.

---

## Features

- **All 50 states + DC** — School-entry vaccine requirements from each state's health department and statutes
- **Standard schedule** — Full series from birth, following CDC 2024 recommendations
- **Catch-up schedule** — CDC catch-up intervals for children starting vaccination at any grade (K–12)
- **Smart date selection** — Automatically skips:
  - Weekends (Saturday & Sunday)
  - All US federal holidays (including observed dates)
  - All Jewish Yomim Tovim including Chol HaMoed: Rosh Hashana, Yom Kippur, Sukkot (all 7 days), Shemini Atzeret, Simchat Torah, Pesach (all 8 days), Shavuot, Purim, and Chanukah
- **Randomized dates** — Dates are slightly varied (within safe windows) so schedules don't look identical for every patient; intervals are **never shorter than CDC minimums**
- **Multiple vaccine grouping** — Vaccines due on the same visit are grouped into one appointment
- **Two views** — Timeline (visual) and Table (printable)
- **Print / PDF export** — Clean print layout via browser print dialog
- **AI-generated parent note** — Claude summarizes the schedule in warm, plain-language text for parents

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Anthropic Claude (Haiku) |
| Deployment | Vercel |
| Port (local) | 3003 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key

### Local Development

```bash
cd vaccine_schedule_builder
npm install
npm run dev
```

Open [http://localhost:3003](http://localhost:3003)

### Environment Variables

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
```

For Vercel deployment, add `ANTHROPIC_API_KEY` in the Vercel project environment variables dashboard.

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the GitHub repository to Vercel for automatic deployments.

---

## Data Sources

### Vaccine Requirements
State-by-state school-entry requirements are based on:
- Each state's Department of Health immunization schedule pages
- State statutes and administrative codes
- CDC's state immunization requirements summary

**Important:** State requirements change. Always verify against your state health department's current published requirements before clinical use.

### CDC Schedule
Based on the **CDC Recommended Child and Adolescent Immunization Schedule, 2024**:
- Standard schedule: https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html
- Catch-up schedule: https://www.cdc.gov/vaccines/schedules/hcp/imz/catchup.html

### Jewish Holidays
Jewish holidays are pre-calculated for 2024–2030 and include all days of each Yom Tov including Chol HaMoed. Sources: Hebcal, Orthodox Union calendar.

---

## Catch-Up Schedule Logic

When a child is starting vaccines at a later grade:
1. The system identifies which vaccines are required for school entry at that grade (and all previous grades)
2. Assumes zero prior vaccination (the physician should adjust based on actual records)
3. Applies CDC catch-up minimum intervals between doses
4. Schedules as many doses as possible from the start date forward
5. Groups doses by appointment date

---

## Vaccine Color Coding

| Vaccine | Color |
|---------|-------|
| HepB | Blue |
| DTaP / Tdap | Green / Emerald |
| IPV | Purple |
| Hib | Yellow |
| PCV | Orange |
| MMR | Red |
| Varicella | Pink |
| HepA | Indigo |
| MenACWY | Teal |
| HPV | Rose |

---

## Medical Disclaimer

This tool is for physician use in patient counseling only. It does not constitute medical advice. All generated schedules must be reviewed and approved by a licensed physician. Always verify state requirements and CDC guidelines before clinical use.

---

## File Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page (physician-facing intro)
│   ├── builder/page.tsx       # Schedule builder form
│   ├── api/generate-schedule/ # API route (schedule generation + AI summary)
│   └── globals.css
├── data/
│   ├── stateVaccines.ts       # All 50 states + DC school requirements
│   ├── cdcSchedule.ts         # CDC dose intervals (standard + catch-up)
│   └── holidays.ts            # Jewish holidays + US federal holidays
├── lib/
│   └── scheduleGenerator.ts   # Core scheduling algorithm
└── components/
    └── ScheduleDisplay.tsx    # Timeline & table views, print layout
```
