import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as seed, m as selectRecords, u as selectClaims, v as useLibrary } from "./store-DYKIy7jQ.mjs";
import { n as Route } from "./router-9FVnpKPK.mjs";
import { t as Badge } from "./badge-BE-zFje_.mjs";
import { t as HashStamp } from "./hash-stamp-DwejAPav.mjs";
import { t as StatusBadge } from "./status-badge-YS6sJ_8a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/record._id-DzihMcg7.js
var import_jsx_runtime = require_jsx_runtime();
function RecordPage() {
	const { id } = Route.useParams();
	const overlay = useLibrary();
	const record = selectRecords(overlay).find((r) => r.id === id);
	const claims = selectClaims(overlay).filter((c) => c.recordId === id);
	if (!record) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: "Not in the Stacks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "No record with that identifier. Absence, not invention."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "text-sm text-info",
				children: "Return to the Stacks"
			})
		]
	});
	const entities = seed.entities.filter((e) => claims.some((c) => c.entities.includes(e.id)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "font-mono text-[11px] text-faint hover:text-fg",
				children: "← Stacks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: record.kind }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: record.sourceType }),
							record.injectionFlag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "danger",
								children: "injection held as data"
							}) : null,
							record.integrityAlert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "danger",
								children: "fixity mismatch"
							}) : null,
							record.duplicateOf ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: "info",
								children: ["duplicate of ", record.duplicateOf]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl tracking-[-0.03em] md:text-5xl",
						children: record.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							record.author,
							" · created ",
							record.createdAt,
							" · acquired ",
							record.acquiredAt.slice(0, 10)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "break-all font-mono text-[11px] text-faint",
						children: [
							record.originalUri,
							" · sha ",
							record.contentHash
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "paper-grain rounded-xl p-6 text-ink shadow-[var(--shadow-paper)] md:p-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-wider text-ink/50",
						children: "Original object"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed",
						children: record.body
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl",
								children: "Provenance"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-3 space-y-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-muted",
											children: "Kind"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: record.kind })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-muted",
											children: "Hash"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, {
											hash: record.contentHash,
											className: "text-fg"
										}) })]
									}),
									record.processor ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-muted",
											children: "Processor"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono text-[11px]",
											children: record.processor
										})]
									}) : null,
									record.derivedFrom?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted",
										children: "Derived from"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 space-y-1",
										children: record.derivedFrom.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/record/$id",
											params: { id: d },
											className: "block font-mono text-[11px] text-info",
											children: d
										}, d))
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-ok",
										children: "This is evidence, not a derivative."
									}),
									record.brokenLinks?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted",
										children: "Broken links"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-mono text-[11px] text-warn",
										children: record.brokenLinks.join(", ")
									})] }) : null
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl",
								children: "Claims"
							}), claims.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "No claims extracted from this source."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-3",
								children: claims.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "border-t border-border pt-3 first:border-0 first:pt-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono text-[11px] text-faint",
												children: c.id
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: c.status }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "muted",
												children: c.temporal.replace("_", " ")
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm leading-relaxed",
										children: c.text
									})]
								}, c.id))
							})]
						}),
						entities.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl",
								children: "Entities"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-2",
								children: entities.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: e.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: e.description
								})] }, e.id))
							})]
						}) : null
					]
				})]
			})
		]
	});
}
//#endregion
export { RecordPage as component };
