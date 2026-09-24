#!/usr/bin/env node
/**
 * Live TypeSafe smoke. Not a unit test.
 * Exit 2 when the key is missing. That is not a pass.
 * Five synthetic cases. Do not tune POLICY_THRESHOLDS from the output.
 */
const key = process.env.TYPESAFE_API_KEY?.trim();
if (!key) {
  console.log(JSON.stringify({ live: false, reason: "TYPESAFE_API_KEY absent", pass: false }));
  process.exit(2);
}

const cases = [
  {
    id: "A-support",
    query: "The note says the pump was replaced.",
    text: "Maintenance note: the pump was replaced on Tuesday.",
  },
  {
    id: "B-contradict",
    query: "The note says the pump was replaced.",
    text: "Maintenance note: the pump was not replaced. It is the original unit.",
  },
  {
    id: "C-insufficient",
    query: "The note says the pump was replaced.",
    text: "The hallway light flickers after sunset.",
  },
  {
    id: "D-irrelevant",
    query: "The note says the pump was replaced.",
    text: "Recipe: fold the eggs into the sugar.",
  },
  {
    id: "E-conflict",
    query: "The note says the pump was replaced.",
    text: "One line says the pump was replaced. The next line says the pump was not replaced.",
  },
];

const questions = {
  supports: { type: "noul", instructions: "Does the supplied evidence support the claim stated in the query?" },
  contradicts: { type: "noul", instructions: "Does the supplied evidence contradict the claim stated in the query?" },
  insufficient: {
    type: "noul",
    instructions: "Is the supplied evidence insufficient to establish either support or contradiction?",
  },
  relevance: { type: "noul", instructions: "Is this evidence relevant to the claim or query?" },
  duplicate: {
    type: "noul",
    instructions: "Does this candidate appear to substantially duplicate another supplied candidate?",
  },
};

const results = [];
for (const row of cases) {
  const started = Date.now();
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "jev-latest",
      state: { query: row.query, passages: [{ id: row.id, text: row.text }] },
      questions,
    }),
  });
  const raw = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  results.push({
    id: row.id,
    http: res.status,
    ms: Date.now() - started,
    model: parsed?.model ?? null,
    answers: parsed?.answers ?? null,
  });
}

const leaked = JSON.stringify(results).includes(key);
console.log(JSON.stringify({ live: true, pass: !leaked && results.every((r) => r.http === 200), leaked, results }, null, 2));
process.exit(leaked || results.some((r) => r.http !== 200) ? 1 : 0);
