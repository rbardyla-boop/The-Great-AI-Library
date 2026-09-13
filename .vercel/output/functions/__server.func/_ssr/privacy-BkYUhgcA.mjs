import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-BkYUhgcA.js
var import_jsx_runtime = require_jsx_runtime();
function PrivacyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-2xl space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
				children: "Privacy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl tracking-[-0.03em]",
				children: "This device is the master."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Originals, the hash-chained ledger, catalog, and V.A.L.U.E.S. receipts are stored in this browser (IndexedDB / local storage). They are not uploaded to a shared database."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: [
					"The only network call the Reading Room makes is when you choose ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Re-ask with Grok, grounded" }),
					" or ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Ask Grok to justify" }),
					". Those requests send the question plus retrieved passages or a VALUES judgment — not your whole library, not credentials, not a tracking pixel."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "There is no analytics vendor, no advertising cookie, and no account. Clearing site data forgets the Library on this device. That is deletion."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "text-sm text-info",
				children: "Return"
			}) })
		]
	});
}
//#endregion
export { PrivacyPage as component };
