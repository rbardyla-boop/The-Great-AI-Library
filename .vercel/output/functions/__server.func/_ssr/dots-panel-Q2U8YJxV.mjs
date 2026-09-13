import { i as __toESM } from "../_runtime.mjs";
import { O as useLibrary, v as kernel } from "./store-DNWQlu4d.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Button } from "./router-QskYX8hO.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById } from "./ssr.mjs";
import { o as connectionsFromLedger } from "./registry-CYmGIAPA.mjs";
import { n as useDots, t as ConnectionCard } from "./store-sGn6D2WG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dots-panel-Q2U8YJxV.js
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
	const support = useDots((s) => s.support);
	const falsify = useDots((s) => s.falsify);
	const promote = useDots((s) => s.promote);
	const keepOpen = useDots((s) => s.keepOpen);
	const importCard = useDots((s) => s.importCard);
	const policy = useDots((s) => s.policy);
	const setPolicy = useDots((s) => s.setPolicy);
	useLibrary((s) => s.tick);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [paste, setPaste] = (0, import_react.useState)("");
	const connections = (connectionsFromLedger(kernel, policy).length ? connectionsFromLedger(kernel, policy) : lastReport?.connections ?? []).slice().sort((a, b) => {
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
					children: "DOTS-2 — Distributed review without shared authority"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xl text-sm leading-relaxed text-muted",
					children: "A review is evidence about a review. It is not evidence that the hypothesis is true. Opinion does not accumulate into evidence. Independent evidence does. Consensus is optional. Provenance is not."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: policy === "conservative" ? "secondary" : "ghost",
							onClick: () => setPolicy("conservative"),
							children: "Conservative policy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: policy === "evidentiary" ? "secondary" : "ghost",
							onClick: () => setPolicy("evidentiary"),
							children: "Evidentiary policy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: busy,
							onClick: async () => {
								setBusy(true);
								await runDiscovery(query);
								setBusy(false);
							},
							children: busy ? "Searching…" : "Run Connect-the-Dots"
						})
					]
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
					onSupport: () => void support(c.id, "SUPPORT — OPINION. I think this connection is compelling. Not evidence.", "Archivist", { supportClass: "OPINION" }),
					onEvidence: () => void support(c.id, "SUPPORT — EVIDENTIARY. Independent source E17 bears on this connection.", "Archivist", {
						supportClass: "EVIDENTIARY",
						evidenceRefs: ["E17"]
					}),
					onFalsify: () => void falsify(c.id, c.falsifiers[0] || "A falsifier was filed. Artifact unchanged."),
					onPromote: () => void promote(c.id),
					onKeepOpen: () => void keepOpen(c.id)
				}) }, c.hash || c.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No hypotheses on the ledger yet. Run Connect-the-Dots. Export an envelope. A stranger import verifies the hash. Nobody owns global truth."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-elevated p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg",
						children: "Import a hypothesis or review"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Stranger import verifies the hash. A review does not change the hypothesis. HMAC means the bytes did not change relative to a demo publisher — not that the reviewer is trustworthy. A live agent mesh is not this page."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: paste,
						onChange: (e) => setPaste(e.target.value),
						rows: 4,
						placeholder: "{\"protocol\":\"gal-dots/2\",\"uri\":\"gal://review/sha256:…\"}",
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
						children: "Import object"
					})
				]
			})
		]
	});
}
//#endregion
export { createSsrRpc as n, DotsPanel as t };
