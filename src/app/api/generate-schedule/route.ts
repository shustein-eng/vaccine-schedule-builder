import { NextResponse } from "next/server";
import { STATE_VACCINE_DATA, getVaccinesForGrade, GradeLevel } from "@/data/stateVaccines";
import { generateStandardSchedule, generateCatchUpSchedule } from "@/lib/scheduleGenerator";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stateCode, mode, birthDate, startDate, entryGrade } = body;

    // Validate
    const stateData = STATE_VACCINE_DATA[stateCode];
    if (!stateData) {
      return NextResponse.json({ error: "Invalid state code" }, { status: 400 });
    }

    let schedule;

    if (mode === "birth") {
      if (!birthDate) {
        return NextResponse.json({ error: "birthDate required for standard schedule" }, { status: 400 });
      }
      const bd = new Date(birthDate);
      schedule = generateStandardSchedule(
        stateCode,
        stateData.name,
        bd,
        stateData.requirements
      );
    } else {
      // catch-up
      if (!startDate || !entryGrade) {
        return NextResponse.json({ error: "startDate and entryGrade required for catch-up" }, { status: 400 });
      }
      const sd = new Date(startDate);
      const gradeVaccines = getVaccinesForGrade(stateCode, entryGrade as GradeLevel);
      schedule = generateCatchUpSchedule(
        stateCode,
        stateData.name,
        sd,
        entryGrade as GradeLevel,
        gradeVaccines
      );
    }

    // Generate a plain-language summary via Claude
    const apptSummary = schedule.appointments
      .map((a) => {
        const doses = a.doses.map((d) => `${d.shortName} dose ${d.doseNumber}`).join(", ");
        return `${a.dateShort} (${a.ageLabel}): ${doses}`;
      })
      .join("\n");

    const summaryPrompt = `You are a physician's assistant writing a brief, warm, plain-language note for a parent.

A vaccine schedule has been generated for a child in ${stateData.name}.
Schedule type: ${mode === "birth" ? "Starting from birth (standard CDC schedule)" : `Catch-up schedule — starting at grade ${entryGrade}`}
State-required vaccines covered: ${stateData.requirements.map((r) => r.shortName).join(", ")}

Appointment overview:
${apptSummary}

Write 2-3 short, reassuring paragraphs (plain language, no jargon) that:
1. Explain what this schedule is and why it was created
2. Reassure parents that the dates were chosen carefully and avoid holidays
3. Encourage them to keep appointments and note that their doctor can answer questions

Keep it warm, concise, under 150 words total. Do not list the dates — those appear in the schedule itself.`;

    const aiResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: summaryPrompt }],
    });

    const summaryText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    // Serialize dates for JSON transport
    const serialized = {
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

    return NextResponse.json({ schedule: serialized, summary: summaryText });
  } catch (err) {
    console.error("Schedule generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}
