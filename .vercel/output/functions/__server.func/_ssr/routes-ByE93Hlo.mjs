import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as selectContradictions, c as selectRecords, i as selectClaims, o as selectDesk, r as seed, u as useLibrary } from "./store-BCrGDmpg.mjs";
import { d as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-CAZVtYCg.mjs";
import { t as HashStamp } from "./hash-stamp-CYFFW8-M.mjs";
import { t as StatusBadge } from "./status-badge-LEVEfgMB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ByE93Hlo.js
var import_jsx_runtime = require_jsx_runtime();
function Stacks() {
	const overlay = useLibrary();
	const records = selectRecords(overlay);
	const claims = selectClaims(overlay);
	const contradictions = selectContradictions(overlay).filter((c) => c.status === "open");
	const pending = selectDesk(overlay).filter((d) => d.decision === "pending").length;
	const originals = records.filter((r) => r.kind === "original");
	const derivatives = records.filter((r) => r.kind === "derivative");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
						children: "The Stacks"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
						children: "Preserved sources"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
						children: [
							"Originals are immutable. Everything the Archivist writes is a derivative with a receipt. Overnight: ",
							originals.length,
							" sources, ",
							claims.length,
							" claims,",
							" ",
							contradictions.length,
							" open conflicts."
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/desk",
					className: "inline-flex h-11 items-center gap-2 rounded-md bg-elevated px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [
						pending,
						" waiting at the desk",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-4",
				children: [
					{
						k: "Originals",
						v: originals.length
					},
					{
						k: "Derivatives",
						v: derivatives.length
					},
					{
						k: "Claims",
						v: claims.length
					},
					{
						k: "Open conflicts",
						v: contradictions.length
					}
				].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-wider text-faint",
						children: s.k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-3xl tabular-nums",
						children: s.v
					})]
				}, s.k))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Collections"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: seed.collections.map((c) => {
					const n = records.filter((r) => r.collectionIds.includes(c.id)).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-xl",
								children: c.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] tabular-nums text-faint",
								children: n
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: c.description
						})]
					}, c.id);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Sources"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] text-faint",
					children: "click a title for provenance"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-border rounded-lg bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: records.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/record/$id",
					params: { id: r.id },
					className: "flex flex-col gap-2 px-4 py-4 hover:bg-elevated md:flex-row md:items-center md:gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm text-fg",
							children: r.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 truncate text-xs text-muted",
							children: [
								r.author,
								" · ",
								r.createdAt
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.kind }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: r.sourceType }),
							r.injectionFlag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "danger",
								children: "injection"
							}) : null,
							r.integrityAlert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "danger",
								children: "integrity"
							}) : null,
							r.duplicateOf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "info",
								children: "duplicate"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: r.contentHash })
						]
					})]
				}) }, r.id))
			})] })
		]
	});
}
//#endregion
export { Stacks as component };
