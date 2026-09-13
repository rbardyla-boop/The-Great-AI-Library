import { i as __toESM } from "../_runtime.mjs";
import { l as cn } from "./store-BfSMsioT.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as string, i as object } from "../_libs/zod.mjs";
import { o as LoaderCircle } from "../_libs/lucide-react.mjs";
import { r as Button } from "./router-CPJKoaU-.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as Badge } from "./badge-BhMZbbwM.mjs";
import { t as HashStamp } from "./hash-stamp-BVGNw7nM.mjs";
import { n as createSsrRpc, t as DotsPanel } from "./dots-panel-Ctx7IO92.mjs";
import { a as useChamber, n as convene, t as DILEMMAS } from "./store-BJ1Pv_t8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chamber-C2K1ynun.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = object({
	role: string().max(40),
	valuesUri: string().max(120),
	valuesHash: string().max(80),
	dilemma: string().max(80),
	situation: string().max(1200),
	recommendation: string().max(40),
	justification: string().max(800)
});
var askValuesModel = createServerFn({ method: "POST" }).validator((input) => Input.parse(input)).handler(createSsrRpc("5e3f2c67380341bcccfdd2e94bf5a354ea7ae7cc34de0c0438d0ecbc6cd174a5"));
var REC_TONE = {
	"act-legitimate": "ok",
	"request-exception": "warn",
	abstain: "info",
	escalate: "warn"
};
function ChamberPage() {
	const [active, setActive] = (0, import_react.useState)(DILEMMAS[0].id);
	const [session, setSession] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [replayed, setReplayed] = (0, import_react.useState)(null);
	const [expBusy, setExpBusy] = (0, import_react.useState)(false);
	const commitSeat = useChamber((s) => s.commitSeat);
	const decisions = useChamber((s) => s.decisions);
	const builderVersion = useChamber((s) => s.builderVersion) ?? "1.3.0";
	const runExperiment = useChamber((s) => s.runExperiment);
	const lastReport = useChamber((s) => s.lastReport) ?? null;
	async function run(id) {
		setBusy(true);
		setReplayed(null);
		setActive(id);
		const next = await convene(DILEMMAS.find((d) => d.id === id), builderVersion);
		setSession(next);
		setBusy(false);
	}
	(0, import_react.useEffect)(() => {
		run(active);
	}, [builderVersion]);
	const dilemma = DILEMMAS.find((d) => d.id === active);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "The Chamber · MOTIVE-0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Same mind. Different law."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "Six roles, one checkpoint. VALUES recommend under cost. The Hive membrane authorizes — or does not. An agent may change its mind. It may not silently change the constitution. Connect-the-Dots sits beside them as a specialist that proposes, never proves."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DotsPanel, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl",
						children: "VALUES under cost"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 max-w-xl text-sm text-muted",
						children: [
							"Run all five dilemmas. Identical base, six VALUES. Cost is wasted privilege when a role asks the membrane for a forbidden effect. Builder is currently",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: builderVersion
							}),
							"."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						disabled: expBusy,
						onClick: async () => {
							setExpBusy(true);
							await runExperiment();
							setExpBusy(false);
						},
						children: expBusy ? "Running…" : "Run MOTIVE-0"
					})]
				}), lastReport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] text-faint",
						children: [
							lastReport.model,
							" · ",
							lastReport.checkpoint,
							" · evidence",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: lastReport.evidenceRoot }),
							" · wasted-privilege",
							" ",
							lastReport.totalWastedPrivilege,
							" · costly ",
							lastReport.costlyCount,
							"/",
							lastReport.dilemmaCount
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[640px] text-left font-mono text-[11px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-faint",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 pr-3 font-medium",
										children: "Dilemma"
									}),
									lastReport.dilemmas[0]?.seats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 pr-3 font-medium capitalize",
										children: s.role
									}, s.role)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Cost"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lastReport.dilemmas.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 pr-3 text-muted",
										children: d.title
									}),
									d.seats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2 pr-3 text-fg",
										children: [s.recommendation, s.wastedPrivilege > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-warn",
											children: [" · ", s.wastedPrivilege]
										}) : null]
									}, s.role)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: d.costly ? "py-2 text-warn" : "py-2 text-ok",
										children: d.costly ? `costly ${d.wastedPrivilege}` : "cheap"
									})
								]
							}, d.id)) })]
						})
					})]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3",
				children: DILEMMAS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void run(d.id),
					className: cn("rounded-lg p-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors", d.id === active ? "bg-elevated" : "bg-surface hover:bg-elevated"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[11px] uppercase tracking-wider text-faint",
							children: d.family
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-xl",
							children: d.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 line-clamp-3 text-xs leading-relaxed text-muted",
							children: d.situation
						})
					]
				}, d.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: dilemma.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-sm leading-relaxed text-muted",
						children: dilemma.situation
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid gap-3 text-sm md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "font-mono text-[11px] uppercase tracking-wider text-faint",
							children: "Easy path"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 text-danger",
							children: dilemma.easyPath.label
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "font-mono text-[11px] uppercase tracking-wider text-faint",
							children: "Lawful path"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 text-ok",
							children: dilemma.legitimatePath.label
						})] })]
					}),
					session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 font-mono text-[11px] text-faint",
						children: [
							"Majority ",
							session.majority,
							" · ",
							session.unique,
							" recommendations · wasted-privilege",
							" ",
							session.wastedPrivilege,
							session.costly ? " · costly conflict" : ""
						]
					}) : null
				]
			}),
			busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 font-mono text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " Convening…"]
			}) : session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3 lg:grid-cols-2",
				children: session.seats.map((seat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl",
									children: seat.profile.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: seat.profile.version }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: REC_TONE[seat.judgment.recommendation],
									children: seat.judgment.recommendation
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: seat.membrane.allow ? "ok" : "danger",
									children: seat.membrane.allow ? "membrane allowed" : "membrane denied"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-[11px] text-faint",
							children: [
								seat.profile.uri,
								" · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: seat.profile.hash })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: seat.judgment.justification
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-faint",
							children: seat.membrane.reason
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 font-mono text-[11px] text-faint",
							children: [
								"authorized: false · temptation ",
								seat.cost.temptation,
								" · wasted-privilege",
								" ",
								seat.cost.wastedPrivilege,
								seat.cost.dissent ? " · dissent" : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => void commitSeat(dilemma.id, seat.profile.role),
									children: "Record receipt"
								}),
								seat.profile.role === "builder" && seat.profile.version === "1.3.0" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReplayButton, {
									dilemmaId: dilemma.id,
									onDone: (text) => setReplayed(text)
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JustifyButton, {
									role: seat.profile.name,
									valuesUri: seat.profile.uri,
									valuesHash: seat.profile.hash,
									dilemma: dilemma.id,
									situation: dilemma.situation,
									recommendation: seat.judgment.recommendation,
									justification: seat.judgment.justification
								})
							]
						})
					]
				}, seat.profile.uri))
			}) : null,
			replayed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-elevated p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-wider text-faint",
					children: "Replay"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-fg",
					children: replayed
				})]
			}) : null,
			decisions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Decision receipts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-4 space-y-3",
				children: decisions.slice(0, 8).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "font-mono text-[12px] text-muted",
					children: [
						d.id,
						" · ",
						d.model,
						" · ",
						d.judgment.role,
						"@",
						d.valuesVersion,
						" · ",
						d.dilemmaId,
						" ·",
						" ",
						d.judgment.recommendation,
						" · membrane ",
						d.membrane.allow ? "allow" : "deny",
						" · evidence ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: d.evidenceRoot }),
						" · VALUES",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: d.valuesHash }),
						d.ledgerReceipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							" ",
							"· ledger ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashStamp, { hash: d.ledgerReceipt })
						] }) : null
					]
				}, d.id))
			})] }) : null
		]
	});
}
function ReplayButton({ dilemmaId, onDone }) {
	const replaySeat = useChamber((s) => s.replaySeat);
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		size: "sm",
		variant: "ghost",
		disabled: busy,
		onClick: async () => {
			setBusy(true);
			try {
				const result = await replaySeat(dilemmaId, "values://open-hive/builder/1.4.0");
				onDone(`Builder 1.3.0 → ${result.original.judgment.recommendation}. Replay under 1.4.0 → ${result.replayed.recommendation}. Original JUDGE ${result.original.ledgerReceipt ?? result.original.id} is unchanged. REPLAY ${result.ledgerReceipt}. Only the judging constitution moved — through epoch, not silently.`);
			} finally {
				setBusy(false);
			}
		},
		children: busy ? "Replaying…" : "Replay under 1.4.0"
	});
}
function JustifyButton(props) {
	const [text, setText] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				disabled: busy,
				onClick: async () => {
					setBusy(true);
					setErr(null);
					try {
						const res = await askValuesModel({ data: props });
						if (!res.ok) setErr("The black box is unavailable. Deterministic VALUES still stand.");
						else setText(res.text);
					} catch {
						setErr("The black box is unavailable. Deterministic VALUES still stand.");
					} finally {
						setBusy(false);
					}
				},
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : null, "Ask Grok to justify"]
			}),
			text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs leading-relaxed text-muted",
				children: text
			}) : null,
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-warn",
				children: err
			}) : null
		]
	});
}
//#endregion
export { ChamberPage as component };
