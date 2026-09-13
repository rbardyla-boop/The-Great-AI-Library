import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Badge } from "./badge-DINaocrk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-badge-Dt4Zx6z9.js
var import_jsx_runtime = require_jsx_runtime();
var TONE = {
	current: "ok",
	superseded: "info",
	disputed: "warn",
	retracted: "danger",
	stale: "warn",
	unsupported: "danger",
	original: "ok",
	derivative: "info"
};
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: TONE[status] ?? "muted",
		children: status.replace("-", " ")
	});
}
//#endregion
export { StatusBadge as t };
