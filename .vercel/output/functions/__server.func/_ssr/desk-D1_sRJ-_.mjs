import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as selectRecords, f as useLibrary, i as kernel, l as selectDesk, r as Button } from "./router-lsvE-Cg6.mjs";
import { t as Badge } from "./badge-DGoUUdzQ.mjs";
import { o as connectionsFromLedger } from "./registry-BLlwdRIE.mjs";
import { n as useDots, t as ConnectionCard } from "./store-cOceIjk9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-D1_sRJ-_.js
var import_jsx_runtime = require_jsx_runtime();
var TONE = {
	info: "info",
	warn: "warn",
	alert: "danger"
};
function Desk() {
	const overlay = useLibrary();
	const items = selectDesk(overlay);
	const pending = items.filter((i) => i.decision === "pending");
	const decided = items.filter((i) => i.decision !== "pending");
	const records = selectRecords(overlay);
	const decide = useLibrary((s) => s.decideDesk);
	const hypotheses = useDots((s) => s.lastReport?.connections ?? []);
	const promote = useDots((s) => s.promote);
	const keepOpen = useDots((s) => s.keepOpen);
	const support = useDots((s) => s.support);
	const notice = useDots((s) => s.notice);
	const policy = useDots((s) => s.policy);
	overlay.tick;
	const fromLedger = connectionsFromLedger(kernel, policy);
	const openHyps = (fromLedger.length ? fromLedger : hypotheses).filter((c) => (c.localStatus ?? c.status) !== "FALSIFIED").slice().sort((a, b) => a.search === "FAR" ? -1 : 1);
	const processed = records.length;
	const dupes = records.filter((r) => r.duplicateOf).length;
	const conflicts = pending.filter((i) => i.kind === "conflict").length;
	const aliases = pending.filter((i) => i.kind === "alias").length;
	const integrity = pending.filter((i) => i.kind === "integrity" || i.kind === "changed").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "Archivist Desk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Overnight report"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "The Archivist does not pester. It maintains. Accept or reject only what needs a human."
				})
			] }),
			openHyps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Hypotheses awaiting a human"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xl text-sm text-muted",
						children: "Connect-the-Dots does not judge itself. Opinion is not evidence. SUPPORTED cites independent sources. Analogies and gaps stay hypotheses. Keep open leaves the original CONNECT untouched."
					}),
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-warn",
						children: notice
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-4",
						children: openHyps.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectionCard, {
							connection: c,
							onPromote: () => void promote(c.id),
							onKeepOpen: () => void keepOpen(c.id),
							onSupport: () => void support(c.id, "Desk filed SUPPORT — OPINION. Agreement is not evidence.", "Archivist", { supportClass: "OPINION" }),
							onEvidence: () => void support(c.id, "Desk filed SUPPORT — EVIDENTIARY citing E17.", "Archivist", {
								supportClass: "EVIDENTIARY",
								evidenceRefs: ["E17"]
							})
						}) }, c.hash || c.id))
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-2xl",
					children: [processed, " items processed overnight"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-5 space-y-2 font-mono text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-ok",
							children: [
								"✓ ",
								records.filter((r) => r.kind === "original").length,
								" sources catalogued"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-ok",
							children: [
								"✓ ",
								dupes,
								" duplicates linked"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-ok",
							children: ["✓ ", overlay.wipedDerivatives ? "derivatives wiped on request" : "claims extracted with passage-level provenance"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-warn",
							children: [
								"△ ",
								conflicts,
								" conflicting claim sets"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-warn",
							children: [
								"△ ",
								aliases,
								" uncertain identity matches"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-danger",
							children: [
								"! ",
								integrity,
								" integrity / retraction events"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-danger",
							children: [
								"! ",
								pending.filter((i) => i.kind === "injection").length,
								" injection attempt refused"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-display text-2xl",
				children: [
					"Review ",
					pending.length,
					" items"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-3",
				children: pending.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: TONE[item.severity],
								children: item.kind
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-faint",
								children: item.id
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-3 text-base text-fg",
							children: item.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: item.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: item.relatedIds.slice(0, 6).map((id) => id.startsWith("doc-") || id.startsWith("user-") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/record/$id",
								params: { id },
								className: "font-mono text-[11px] text-info hover:text-fg",
								children: id
							}, id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-faint",
								children: id
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => decide(item.id, "accepted"),
								children: "Accept"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => decide(item.id, "rejected"),
								children: "Keep open"
							})]
						})
					]
				}, item.id))
			})] }),
			decided.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Filed"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: decided.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: item.decision === "accepted" ? "ok" : "muted",
						children: item.decision
					})]
				}, item.id))
			})] }) : null
		]
	});
}
//#endregion
export { Desk as component };
