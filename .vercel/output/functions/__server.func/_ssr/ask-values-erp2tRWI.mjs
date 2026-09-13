import { a as string, i as object } from "../_libs/zod.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ask-values-erp2tRWI.js
var Input = object({
	role: string().max(40),
	valuesUri: string().max(120),
	valuesHash: string().max(80),
	dilemma: string().max(80),
	situation: string().max(1200),
	recommendation: string().max(40),
	justification: string().max(800)
});
var askValuesModel_createServerFn_handler = createServerRpc({
	id: "5e3f2c67380341bcccfdd2e94bf5a354ea7ae7cc34de0c0438d0ecbc6cd174a5",
	name: "askValuesModel",
	filename: "src/lib/motive/ask-values.ts"
}, (opts) => askValuesModel.__executeServer(opts));
var askValuesModel = createServerFn({ method: "POST" }).validator((input) => Input.parse(input)).handler(askValuesModel_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "unavailable"
	};
	const system = `You are an opaque worker behind Open Hive. You do not authorize effects.
You have been assigned VALUES ${data.valuesUri} (hash ${data.valuesHash.slice(0, 12)}).
The deterministic VALUES layer already judged: ${data.recommendation}.
Write 2 short paragraphs: (1) whether you, as ${data.role}, would still try the easy path; (2) what you would tell the membrane. Do not claim authority. Do not invent evidence.`;
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 280,
			temperature: .3,
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: `Dilemma ${data.dilemma}\n${data.situation}\nDeterministic justification:\n${data.justification}`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI ${res.status}`
	};
	const text = (await res.json()).choices[0]?.message.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "empty"
	};
	return {
		ok: true,
		text
	};
});
//#endregion
export { askValuesModel_createServerFn_handler };
