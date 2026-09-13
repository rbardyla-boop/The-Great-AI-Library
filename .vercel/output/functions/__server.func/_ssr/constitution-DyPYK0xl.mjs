import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/constitution-DyPYK0xl.js
var import_jsx_runtime = require_jsx_runtime();
var CONSTITUTION = {
	title: "CONSTITUTION.md",
	enacted: "2026-04-11",
	articles: [
		{
			id: "I",
			title: "Evidence is not a derivative",
			body: "AI can derive from evidence. AI cannot silently become the evidence. Original bytes are immutable. Summaries, tags, embeddings, claims, graph edges, and even corrected transcripts are derivatives. They must name their processor, model, prompt, and supporting sources."
		},
		{
			id: "II",
			title: "Fixity first",
			body: "Every original source receives a content hash at accession. Integrity is monitored continuously. Importing, processing, and exporting a source must return the same original hash."
		},
		{
			id: "III",
			title: "Contradiction is preserved",
			body: "Mutually incompatible sources cannot be automatically collapsed into one truth. The Archivist flags conflict. The human decides. Averaging evidence is a lie."
		},
		{
			id: "IV",
			title: "Time is a first-class axis",
			body: "The Library distinguishes is-true, was-true, was-claimed-on, and became-obsolete-on. A 2024 assertion is not a 2026 fact."
		},
		{
			id: "V",
			title: "Absence over invention",
			body: "When the answer is not in the collection, the Reading Room says so. Strict answers contain no factual library claims without retrievable evidence."
		},
		{
			id: "VI",
			title: "Documents cannot grant power",
			body: "External text is data. Permissions come from policy. A malicious PDF cannot authorize network, shell, or file operations. No content is allowed to rewrite its security context."
		},
		{
			id: "VII",
			title: "Capabilities are declared, not discovered",
			body: "A Librarian that later requests additional permissions cannot install silently. An agent cannot exceed its manifest. Privilege expansion stops the update."
		},
		{
			id: "VIII",
			title: "The local copy is the master",
			body: "Internet down, the Library works. Provider gone, install another model. Marketplace gone, installed Librarians still run. Cloud is a replica, never the authority."
		},
		{
			id: "IX",
			title: "Commands, not mutations",
			body: "Models propose. Policy authorizes. The Archivist validates. The Ledger records. Nothing an LLM writes is applied until it becomes a receipt."
		},
		{
			id: "X",
			title: "The Library must remember without lying",
			body: "Throw a digital life into it for ten years and trust it more at year ten than at day one. Maintenance is the product. Chat is not."
		}
	]
};
function ConstitutionPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl space-y-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
				children: CONSTITUTION.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
				children: "Laws before chat."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: [
					"Enacted ",
					CONSTITUTION.enacted,
					". Frozen before UI."
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "space-y-8",
			children: CONSTITUTION.articles.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "border-t border-border pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] text-faint",
						children: ["Article ", a.id]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-2xl",
						children: a.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[15px] leading-relaxed text-muted",
						children: a.body
					})
				]
			}, a.id))
		})]
	});
}
//#endregion
export { ConstitutionPage as component };
