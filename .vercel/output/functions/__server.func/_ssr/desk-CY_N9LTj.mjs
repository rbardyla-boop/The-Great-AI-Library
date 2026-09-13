import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as selectRecords, o as selectDesk, u as useLibrary } from "./store-BCrGDmpg.mjs";
import { r as Button } from "./router-CBiIw_NM.mjs";
import { t as Badge } from "./badge-CAZVtYCg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-CY_N9LTj.js
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
