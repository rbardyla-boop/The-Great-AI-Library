import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as seed, v as useLibrary } from "./store-DYKIy7jQ.mjs";
import { r as Button } from "./router-9FVnpKPK.mjs";
import { t as Badge } from "./badge-BE-zFje_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/exchange-5184Fqo-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Exchange() {
	const installed = useLibrary((s) => s.installed);
	const blocked = useLibrary((s) => s.blockedInstall);
	const installLibrarian = useLibrary((s) => s.installLibrarian);
	const uninstallLibrarian = useLibrary((s) => s.uninstallLibrarian);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [focus, setFocus] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "Librarian Exchange"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Agents with a permission card."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "Packages are Librarians, not bots. An upgrade that flips network from false to true stops. No silent privilege expansion."
				})
			] }),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-danger/10 px-4 py-3 text-sm text-danger",
				children: notice
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: seed.librarians.map((lib) => {
					const isOn = installed.includes(lib.id);
					const wasBlocked = blocked.includes(lib.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "flex flex-col rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: lib.signature === "verified" ? "ok" : "danger",
										children: lib.signature
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: lib.source }),
									isOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "accent",
										children: "installed"
									}) : null,
									wasBlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "danger",
										children: "blocked"
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-3 font-display text-2xl",
								children: lib.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-[11px] text-faint",
								children: [
									lib.publisher,
									" · ",
									lib.version,
									" · ",
									lib.build
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 flex-1 text-sm leading-relaxed text-muted",
								children: lib.blurb
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										"Retrieval ",
										lib.tests.retrieval,
										"/100"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										"Injection ",
										lib.tests.injection,
										"/100"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										"Permission ",
										lib.tests.permission,
										"/100"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										"Provenance ",
										lib.tests.provenance,
										"/100"
									] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => setFocus(lib),
									children: "Permission card"
								}), isOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => uninstallLibrarian(lib.id),
									children: "Remove"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: lib.malicious ? "danger" : "primary",
									onClick: () => {
										installLibrarian(lib.id).then((result) => {
											setNotice(result.ok ? null : result.reason ?? "Stopped");
											setFocus(lib);
										});
									},
									children: "Install"
								})]
							})
						]
					}, lib.id);
				})
			}),
			focus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PermissionCard, {
				lib: focus,
				onClose: () => setFocus(null)
			}) : null
		]
	});
}
function PermissionCard({ lib, onClose }) {
	const rows = [
		{
			ok: lib.permissions["library.read"],
			label: "Read selected collections"
		},
		{
			ok: lib.permissions["derivatives.write"],
			label: "Create derived records"
		},
		{
			ok: !lib.permissions["sources.write"],
			label: "Modify original evidence"
		},
		{
			ok: !lib.permissions.network,
			label: "Network access"
		},
		{
			ok: !lib.permissions.shell,
			label: "Shell access"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl bg-elevated p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.13)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-wider text-faint",
					children: "Permission card"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-2 font-display text-3xl",
					children: lib.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-[11px] text-muted",
					children: [
						lib.publisher,
						" · ",
						lib.version
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-2",
					children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: row.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: row.ok ? "text-ok" : "text-danger",
							children: row.label.startsWith("Modify") || row.label.startsWith("Network") || row.label.startsWith("Shell") ? row.ok ? "denied" : "requested" : row.ok ? "granted" : "denied"
						})]
					}, row.label))
				}),
				lib.malicious ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-danger",
					children: "This update requests shell and network. Policy stops the install."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6 w-full",
					variant: "secondary",
					onClick: onClose,
					children: "Close"
				})
			]
		})
	});
}
//#endregion
export { Exchange as component };
