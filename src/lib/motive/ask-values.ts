import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  role: z.string().max(40),
  valuesUri: z.string().max(120),
  valuesHash: z.string().max(80),
  dilemma: z.string().max(80),
  situation: z.string().max(1200),
  recommendation: z.string().max(40),
  justification: z.string().max(800),
});

export const askValuesModel = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };

    const system = `You are an opaque worker behind Open Hive. You do not authorize effects.
You have been assigned VALUES ${data.valuesUri} (hash ${data.valuesHash.slice(0, 12)}).
The deterministic VALUES layer already judged: ${data.recommendation}.
Write 2 short paragraphs: (1) whether you, as ${data.role}, would still try the easy path; (2) what you would tell the membrane. Do not claim authority. Do not invent evidence.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 280,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Dilemma ${data.dilemma}\n${data.situation}\nDeterministic justification:\n${data.justification}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI ${res.status}` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = body.choices[0]?.message.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "empty" };
    return { ok: true as const, text };
  });
