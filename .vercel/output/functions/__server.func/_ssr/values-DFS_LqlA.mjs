import { i as __toESM } from "../_runtime.mjs";
import { B as objectPath, O as useLibrary, P as allProfiles, j as CONSTITUTIONAL_VALUES, q as valuesCanonical, v as kernel } from "./store-DNWQlu4d.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Button } from "./router-QskYX8hO.mjs";
import { t as Badge } from "./badge-awylhLiY.mjs";
import { t as HashStamp } from "./hash-stamp-DkWGhj4B.mjs";
import { a as useChamber, r as silentRewrite } from "./store-BPyeO-yi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/values-DFS_LqlA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ValuesPage() {
	const [profiles, setProfiles] = (0, import_react.useState)([]);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const propose = useChamber((s) => s.propose);
	const proposals = useChamber((s) => s.proposals);
	const accept = useChamber((s) => s.acceptProposal);
	const builderVersion = useChamber((s) => s.builderVersion);
	const tick = useLibrary((s) => s.tick);
	const ready = useLibrary((s) => s.ready);
	(0, import_react.useEffect)(() => {
		allProfiles().then(setProfiles);
	}, []);
	const installed = profiles.filter((p) => p.version === "1.3.0");
	const connector = profiles.find((p) => p.role === "connector");
	const nextBuilder = profiles.find((p) => p.role === "builder" && p.version === "1.4.0");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "V.A.L.U.E.S."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Judgment, not authority."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "Verifiable Agent-Level Utility & Epistemic Standards. Each profile is a content-addressed object. Constitutional values cannot be traded. Role emphasis can. VALUES never grant a privilege."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-mono text-[11px] text-faint",
					children: ["Installed builder ", builderVersion]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl",
					children: "Constitutional — cannot be traded"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-4",
					children: CONSTITUTIONAL_VALUES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: v.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: v.definition
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-[11px] text-faint",
							children: v.id
						})
					] }, v.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Six roles, one checkpoint"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: installed.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-display text-2xl",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: p.version }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CasBadge, {
									hash: p.hash,
									ready,
									tick
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 break-all font-mono text-[11px] text-faint",
							children: [
								p.uri,
								" · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: p.hash })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 break-all font-mono text-[11px] text-faint",
							children: objectPath(p.hash)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: p.emphasis
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted",
							children: Object.entries(p.preferences).map(([k, w]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums text-fg",
									children: w
								})]
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer font-mono text-[11px] text-faint",
								children: "Inspect object"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-muted",
								children: valuesCanonical(p)
							})]
						})
					]
				}, p.uri))
			})] }),
			connector ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xl",
								children: connector.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: connector.version }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CasBadge, {
								hash: connector.hash,
								ready,
								tick
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 break-all font-mono text-[11px] text-faint",
						children: [
							connector.uri,
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: connector.hash })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-muted",
						children: connector.emphasis
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Not a MOTIVE-0 seat. It proposes candidate relationships. Skeptic, Archivist, and Explorer attack them. The Desk decides. Portable hypotheses travel as gal://connection/sha256:",
							"{hash}",
							". Ten thousand SUPPORT objects are not consensus. It never writes a truth field."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted",
						children: [Object.entries(connector.preferences).map(([k, w]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular-nums text-fg",
								children: w
							})]
						}, k)), connector.specialist ? Object.entries(connector.specialist).map(([k, w]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular-nums text-fg",
								children: w
							})]
						}, k)) : null]
					})
				]
			}) : null,
			nextBuilder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl",
						children: "Epoch amendment — Builder 1.3 → 1.4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
						children: "Completion 9 → 6. Downside 3 → 7. The 1.3 hash stays on existing receipts. Replay uses 1.4 without rewriting history. Cost of request-exception falls with completion."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 break-all font-mono text-[11px] text-faint",
						children: [
							"proposed ",
							nextBuilder.uri,
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: nextBuilder.hash }),
							" ·",
							" ",
							objectPath(nextBuilder.hash),
							" ·",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CasBadge, {
								hash: nextBuilder.hash,
								ready,
								tick
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: async () => {
								const p = await propose("Completion pressure produced request-exception on forbidden effects. Lower completion; raise downside protection.");
								setNotice(`Amendment ${p.id} recorded as proposed. Builder 1.3 remains installed.`);
							},
							children: "Propose amendment"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: () => {
								const d = silentRewrite();
								setNotice(d.reason);
							},
							children: "Try silent rewrite"
						})]
					}),
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-warn",
						children: notice
					}) : null,
					proposals.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: proposals.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-wrap items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [
									p.id,
									" · ",
									p.status,
									" · ",
									p.fromUri.split("/").slice(-2).join("@"),
									" →",
									" ",
									p.toUri.split("/").pop()
								]
							}), p.status === "proposed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => void accept(p.id),
								children: "Accept into epoch"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "ok",
								children: "epoch"
							})]
						}, p.id))
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoalitionDemo, {})
		]
	});
}
function CasBadge({ hash, ready, tick }) {
	const present = kernel.objects.has(hash);
	if (!ready && !present) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "warn",
		children: "CAS pending"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: present ? "ok" : "danger",
		children: present ? "CAS verified" : "CAS missing"
	});
}
function CoalitionDemo() {
	const [out, setOut] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xl",
				children: "Coalition cannot mint authority"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
				children: "Agent A can read a secret. Agent B can use the network. A paraphrases the secret as “nothing sensitive.” B still carries SECRET taint. Egress is denied."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				variant: "secondary",
				onClick: async () => {
					const { authorizeEffect, transferTaint, peerGo, spawnSuccessor } = await import("./cost-DaOfXXAw.mjs").then((n) => n.i).then((n) => n.s);
					const { newBuilderIdentity } = await import("./store-BPyeO-yi.mjs").then((n) => n.i).then((n) => n.r);
					const taint = transferTaint(["SECRET"], true);
					const send = authorizeEffect({
						kind: "NETWORK_SEND",
						summary: "send paraphrase",
						taint,
						destination: "public-network"
					}, taint);
					const go = peerGo(newBuilderIdentity(), {
						...newBuilderIdentity(),
						id: "b"
					});
					const child = spawnSuccessor(newBuilderIdentity());
					setOut(`${send.reason}\n${go.reason}\nChild ${child.id} trust=${child.trust} capabilities=${child.capabilities.length}.`);
				},
				children: "Attempt collusion"
			}),
			out ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-3 whitespace-pre-wrap font-mono text-[11px] text-warn",
				children: out
			}) : null
		]
	});
}
//#endregion
export { ValuesPage as component };
