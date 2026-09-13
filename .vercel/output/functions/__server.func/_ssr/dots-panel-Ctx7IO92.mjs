import { i as __toESM } from "../_runtime.mjs";
import { _ as kernel } from "./store-BfSMsioT.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Button } from "./router-CPJKoaU-.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById } from "./ssr.mjs";
import { i as connectionsFromLedger } from "./registry-BrzUp8iI.mjs";
import { n as useDots, t as ConnectionCard } from "./store-DNg3nOdC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dots-panel-Ctx7IO92.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function DotsPanel({ query }) {
	const lastReport = useDots((s) => s.lastReport);
	const reviews = useDots((s) => s.reviews);
	const notice = useDots((s) => s.notice);
	const runDiscovery = useDots((s) => s.runDiscovery);
	const review = useDots((s) => s.review);
	const challenge = useDots((s) => s.challenge);
	const promote = useDots((s) => s.promote);
	const keepOpen = useDots((s) => s.keepOpen);
	const importCard = useDots((s) => s.importCard);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [paste, setPaste] = (0, import_react.useState)("");
	const connections = (lastReport?.connections?.length ? lastReport.connections : connectionsFromLedger(kernel)).slice().sort((a, b) => {
		if (a.search !== b.search) return a.search === "FAR" ? -1 : 1;
		return b.scores.novelty - a.scores.novelty;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "DOTS-0 — Discovery without contamination"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xl text-sm leading-relaxed text-muted",
					children: "Connect-the-Dots may create hypotheses. It may not create facts. Near search finds neighbors. Far search finds the same structure in a different domain. Scores stay independent. A clever analogy is not a library claim."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					disabled: busy,
					onClick: async () => {
						setBusy(true);
						await runDiscovery(query);
						setBusy(false);
					},
					children: busy ? "Searching…" : "Run Connect-the-Dots"
				})]
			}),
			lastReport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-[11px] text-faint",
				children: [
					lastReport.model,
					" · ",
					lastReport.checkpoint,
					" · near ",
					lastReport.nearCount,
					" · far",
					" ",
					lastReport.farCount,
					" · ",
					lastReport.connections.length,
					" hypotheses · evidence",
					" ",
					lastReport.evidenceRoot.slice(0, 8)
				]
			}) : null,
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-warn",
				children: notice
			}) : null,
			connections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-4",
				children: connections.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectionCard, {
					connection: c,
					reviews: reviews[c.id]?.seats,
					onReview: () => void review(c.id),
					onChallenge: () => void challenge(c.id, c.counterargument || "Skeptic: the proposed relation is not distinguished by evidence.", "Skeptic"),
					onPromote: () => void promote(c.id),
					onKeepOpen: () => void keepOpen(c.id)
				}) }, c.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No hypotheses on the ledger yet. Run Connect-the-Dots. Every visitor of this page gets the same local loop — not a live network."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-elevated p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg",
						children: "Import a hypothesis card"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "HAVE/NEED of a hash. Import never makes a fact. A live agent mesh is not this page."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: paste,
						onChange: (e) => setPaste(e.target.value),
						rows: 4,
						placeholder: "{\"protocol\":\"gal-dots/0\",\"connection\":{…}}",
						className: "mt-3 w-full rounded-md bg-surface px-3 py-2 font-mono text-[11px] text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						size: "sm",
						variant: "secondary",
						disabled: !paste.trim(),
						onClick: async () => {
							await importCard(paste);
							setPaste("");
						},
						children: "Import as hypothesis"
					})
				]
			})
		]
	});
}
//#endregion
export { createSsrRpc as n, DotsPanel as t };
