import { G as shortHash, u as cn } from "./store-DNWQlu4d.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hash-stamp-DkWGhj4B.js
var import_jsx_runtime = require_jsx_runtime();
function HashStamp({ hash, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-mono text-[11px] tracking-wider text-faint tabular-nums", className),
		title: hash,
		children: shortHash(hash)
	});
}
//#endregion
export { HashStamp as t };
