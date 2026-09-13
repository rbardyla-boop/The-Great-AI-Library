import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as selectLedger, u as useLibrary } from "./store-BCrGDmpg.mjs";
import { r as Button } from "./router-CBiIw_NM.mjs";
import { t as Badge } from "./badge-CAZVtYCg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ledger-BsPxtaaP.js
var import_jsx_runtime = require_jsx_runtime();
var TONE = {
	archivist: "info",
	human: "accent",
	librarian: "muted",
	policy: "warn"
};
function LedgerPage() {
	const overlay = useLibrary();
	const events = selectLedger(overlay);
	const wipe = useLibrary((s) => s.wipeDerivatives);
	const restore = useLibrary((s) => s.restoreDerivatives);
	const reset = useLibrary((s) => s.resetLibrary);
	const wiped = overlay.wipedDerivatives;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "The Ledger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Commands, then receipts."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "Models propose. Policy authorizes. The Archivist validates. Nothing is a silent table mutation. This log is append-only."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:flex-row md:items-center md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "Model-swap gate"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-md text-sm text-muted",
					children: "Delete every AI-generated summary and rebuild. Original hashes stay put."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [wiped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: restore,
						children: "Rebuild derivatives"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: wipe,
						children: "Wipe derivatives"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: reset,
						children: "Restore seed"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "relative space-y-0 border-l border-border pl-6",
				children: events.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "relative pb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -left-[25px] top-1 size-2 rounded-full bg-accent" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: TONE[ev.actor] ?? "muted",
									children: ev.actor
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[11px] text-faint",
									children: ev.command
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[11px] tabular-nums text-faint",
									children: ev.at.replace("T", " ").replace(".000Z", "Z")
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-fg",
							children: ev.summary
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-[11px] text-faint",
							children: ["receipt ", ev.receipt]
						})
					]
				}, ev.id))
			})
		]
	});
}
//#endregion
export { LedgerPage as component };
