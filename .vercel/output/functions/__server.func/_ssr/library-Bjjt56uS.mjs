import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as string, i as object, t as array } from "../_libs/zod.mjs";
import { a as refreshLibrary, c as selectContradictions, d as selectRecords, f as useLibrary, i as kernel, s as selectClaims } from "./router-lsvE-Cg6.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { r as retrieve } from "./retrieve-Dsbwr_VL.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C1p7zOu_.mjs";
import { a as trackSearch, i as trackLocal, r as saveFeedback } from "./feedback-DK1qzvl0.mjs";
import { a as packetFromAttempt, o as publicReceipt } from "./receipts-0nGRUvI0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-Bjjt56uS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Passage = object({
	recordId: string().max(80),
	claimId: string().max(80),
	title: string().max(200),
	hash: string().max(80),
	passage: string().max(800)
});
var Input = object({
	query: string().min(1).max(500),
	passages: array(Passage).max(6)
});
var judgeGal = createServerFn({ method: "POST" }).validator((input) => Input.parse(input)).handler(createSsrRpc("040b92a9ff871ae8dfb674fa9fd3e8365c4d9f2d403ec5f7b0f105b586fce1e1"));
/** Append-only. Hashes and dispositions only. No passage text and no API key. */
async function fileAttempt(kernel, body) {
	const blob = JSON.stringify(body);
	if (/bearer\s|TYPESAFE_API_KEY|sk-|super-secret/i.test(blob)) throw new Error("attempt ledger refused a secret");
	if (/"passage"|"query"|"text"/.test(blob)) throw new Error("attempt ledger refused source text");
	return { eventHash: (await kernel.command({
		actor: "archivist",
		command: "JEV_ATTEMPT",
		summary: `JEV ${body.terminal} ${body.attemptId}. Authority false. Disposition ${body.disposition}.`,
		payload: {
			...body,
			authority: false
		},
		input: body.sourceHashes,
		result: body.terminal === "ACCEPTED_RESPONSE" ? "ok" : "failed"
	})).event_hash };
}
function ledgerBody(packet, extra) {
	return {
		attemptId: packet.provenance.jev_attempt_id,
		traceId: packet.header.trace_id,
		terminal: extra.terminal,
		model: packet.header.model_version,
		inputHash: packet.provenance.input_hash,
		questionHashes: packet.provenance.question_hashes,
		httpStatus: extra.httpStatus,
		latencyMs: extra.latencyMs,
		retryCount: extra.retryCount,
		requestId: extra.requestId,
		disposition: packet.payload.disposition,
		license: packet.epistemics.epistemic_license,
		sourceHashes: packet.provenance.source_hashes
	};
}
function LibraryHost() {
	const overlay = useLibrary();
	const [query, setQuery] = (0, import_react.useState)("Did Project Mercury overrun its budget?");
	const [passages, setPassages] = (0, import_react.useState)([]);
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	const [packet, setPacket] = (0, import_react.useState)(null);
	const [ledgerId, setLedgerId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("");
	const [thanks, setThanks] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		trackLocal("library_open", "/library");
	}, []);
	async function search() {
		trackSearch("/library", query, "search_started");
		trackSearch("/library", query, "library_query_started");
		const found = retrieve(query, {
			records: selectRecords(overlay),
			claims: selectClaims(overlay),
			contradictions: selectContradictions(overlay)
		}).passages.slice(0, 6);
		setPassages(found);
		trackSearch("/library", query, "search_completed");
		trackSearch("/library", query, "library_query_completed");
		setBusy(true);
		setThanks("");
		setLedgerId(null);
		try {
			const bundle = await judgeGal({ data: {
				query,
				passages: found.map((p) => ({
					recordId: p.recordId,
					claimId: p.claimId ?? "",
					title: p.title,
					hash: p.hash,
					passage: p.passage
				}))
			} });
			const attempt = bundle.receipt;
			const live = found.map((p) => p.hash);
			const decision = packetFromAttempt(attempt, {
				sourceHashes: live,
				recordIds: found.map((p) => p.recordId),
				liveHashes: live
			});
			setReceipt(bundle.receipt);
			setPacket(decision.packet);
			if (attempt.terminal === "ACCEPTED_RESPONSE") trackLocal("jev_success", "/library");
			else trackLocal("jev_service_failure", "/library");
			if (decision.packet.payload.human_review) trackLocal("human_review_required", "/library");
			const filed = await fileAttempt(kernel, ledgerBody(decision.packet, {
				terminal: attempt.terminal,
				httpStatus: attempt.httpStatus,
				latencyMs: attempt.latencyMs,
				retryCount: attempt.retryCount,
				requestId: attempt.requestId
			}));
			setLedgerId(filed.eventHash);
			refreshLibrary();
		} catch {
			const failed = {
				attemptId: "local_failure",
				traceId: "tr_local_failure",
				model: "none",
				questionHash: "",
				questionHashes: [],
				inputHash: "",
				outcome: "service_failure",
				terminal: "NETWORK_FAILURE",
				httpStatus: null,
				latencyMs: 0,
				retryCount: 0,
				requestId: null,
				judgments: [],
				note: "The judgment call did not return."
			};
			setReceipt(publicReceipt(failed));
			setPacket(packetFromAttempt(failed, {
				sourceHashes: [],
				recordIds: [],
				liveHashes: []
			}).packet);
			trackLocal("jev_service_failure", "/library");
		} finally {
			setBusy(false);
		}
	}
	const receiptId = receipt?.attemptId;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.22em] text-faint",
					children: "Reading Room · Library"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-[-0.03em] md:text-5xl",
					children: "Library"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
					children: "Three layers, kept apart. The source is what was preserved. Jev may judge that bounded excerpt. Policy decides what the judgment is allowed to mean. None of this promotes a claim or edits an original."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex flex-col gap-3 sm:flex-row",
				onSubmit: (e) => {
					e.preventDefault();
					search();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					maxLength: 500,
					"aria-label": "Library query",
					className: "h-11 flex-1 rounded-md bg-surface px-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: busy || query.trim().length === 0,
					className: "h-11 rounded-md bg-elevated px-4 text-sm disabled:opacity-50",
					children: busy ? "Judging…" : "Retrieve"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-[0.18em] text-faint",
						children: "Observed source"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "What the Library preserved"
					}),
					passages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Nothing retrieved yet."
					}) : passages.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-display text-xl",
									children: p.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "font-mono text-[11px] text-faint",
									onClick: () => trackLocal("record_open", "/library"),
									children: p.hash.slice(0, 8)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed",
								children: p.passage
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-mono text-[11px] text-faint",
								children: p.recordId
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/record/$id",
								params: { id: p.recordId },
								className: "mt-3 inline-block text-sm text-muted",
								children: "Open record"
							})
						]
					}, p.claimId ?? p.recordId))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-[0.18em] text-faint",
						children: "Model judgment"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "What Jev returned"
					}),
					!receipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No judgment yet. Retrieval still works if Jev is absent."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-[11px] text-faint",
								children: [
									receipt.terminal,
									" · ",
									receipt.model,
									" · ",
									receipt.latencyMs,
									" ms · retries ",
									receipt.retryCount
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed",
								children: receipt.note
							}),
							receipt.judgments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "No distribution was returned. Nothing was invented."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-2",
								children: receipt.judgments.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[11px] uppercase text-faint",
											children: j.id
										}),
										" ",
										j.label,
										j.confidence !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted",
											children: [" · concentration ", j.confidence.toFixed(2)]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block font-mono text-[11px] text-faint",
											children: Object.entries(j.probabilities).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(" · ")
										})
									]
								}, j.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 break-all font-mono text-[11px] text-faint",
								children: [
									"receipt ",
									receipt.attemptId,
									receipt.requestId ? ` · request ${receipt.requestId}` : ""
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] uppercase tracking-[0.18em] text-faint",
						children: "Policy disposition"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "What the Library will allow"
					}),
					!packet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No disposition yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-3xl",
								children: packet.payload.disposition.replaceAll("_", " ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted",
								children: [
									"Relation ",
									packet.payload.relation.replaceAll("_", " "),
									". License",
									" ",
									packet.epistemics.epistemic_license.replaceAll("_", " "),
									".",
									packet.payload.human_review ? " A person should look." : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 font-mono text-[11px] text-faint",
								children: ["allowed ", packet.permissions.allowed_use.join(", ")]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-[11px] text-faint",
								children: ["forbidden ", packet.permissions.forbidden_use.join(", ")]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 break-all font-mono text-[11px] text-faint",
								children: [
									"trace ",
									packet.header.trace_id,
									ledgerId ? ` · ledger ${ledgerId.slice(0, 16)}` : ""
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Was this useful?"
					}),
					receiptId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-[11px] text-faint",
						children: ["Tied to receipt ", receiptId]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 rounded-md bg-elevated px-4 text-sm",
							onClick: () => {
								trackLocal("feedback_yes", "/library");
								saveFeedback("yes", "", receiptId);
								setThanks("Thanks. That's all I collect. It stays on this device.");
							},
							children: "Yes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 rounded-md bg-elevated px-4 text-sm",
							onClick: () => {
								trackLocal("feedback_no", "/library");
								saveFeedback("no", "", receiptId);
								setThanks("Thanks. That's all I collect. It stays on this device.");
							},
							children: "No"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block text-sm text-muted",
						children: ["Tell me what was missing.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: note,
							maxLength: 500,
							onChange: (e) => setNote(e.target.value),
							className: "mt-2 min-h-20 w-full rounded-md bg-bg px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-2 h-10 rounded-md bg-elevated px-4 text-sm disabled:opacity-50",
						disabled: note.trim().length < 3,
						onClick: () => {
							trackLocal("feedback_text_submitted", "/library");
							saveFeedback("text", note, receiptId);
							setNote("");
							setThanks("Thanks. That's all I collect. The note stays on this device.");
						},
						children: "Send note"
					}),
					thanks ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm",
						children: thanks
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/insights",
								children: "This device's counts"
							}),
							" · ",
							"no account, no document bodies, no question text. Clove Insights on the public site is a separate system and is not written from here."
						]
					})
				]
			})
		]
	});
}
//#endregion
export { LibraryHost as component };
