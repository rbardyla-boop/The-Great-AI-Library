import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as cn } from "./router-lsvE-Cg6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-DGoUUdzQ.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ children, tone = "muted", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase", {
			muted: "text-muted bg-elevated",
			ok: "text-ok bg-ok/10",
			warn: "text-warn bg-warn/10",
			danger: "text-danger bg-danger/10",
			info: "text-info bg-info/10",
			accent: "text-accent-fg bg-accent"
		}[tone], className),
		children
	});
}
//#endregion
export { Badge as t };
