"use client";

import { useEffect, useMemo, useState } from "react";
import type { Checklist, GroundedAnswer, IntakeBrief, SourceRecord } from "@/lib/types";
import { sourceRegister } from "@/lib/corpus";

type View = "knowledge" | "checklists" | "communication" | "workflow" | "sources" | "strategy" | "email";
type Category = "freelancer" | "income-tax" | "vat-return" | "gmbh";

const navItems: Array<{ key: View; label: string; symbol: string }> = [
  { key: "knowledge", label: "Knowledge assistant", symbol: "⌕" },
  { key: "checklists", label: "Checklists", symbol: "☑" },
  { key: "communication", label: "Communication Hub", symbol: "↗" },
  { key: "workflow", label: "Workflow Desk", symbol: "≡" },
  { key: "sources", label: "Sources", symbol: "◉" },
  { key: "strategy", label: "Strategy & pitch", symbol: "◇" },
];

const suggestedQuestions = [
  "Which documents do I need for an income-tax return?",
  "What should I ask when onboarding a new freelancer?",
  "Which information do we need for a VAT pre-return?",
];

const sourceCategories: Array<{ key: Category; title: string; detail: string; symbol: string }> = [
  { key: "freelancer", title: "New self-employed / freelancer", detail: "Intake & registration", symbol: "↗" },
  { key: "income-tax", title: "Income-tax return", detail: "Assessment & receipts", symbol: "□" },
  { key: "vat-return", title: "VAT pre-return", detail: "Filing period & submission", symbol: "▤" },
  { key: "gmbh", title: "GmbH onboarding", detail: "Illustrative workflow", symbol: "◫" },
];

const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "The request could not be processed.");
  return payload;
}

async function runAction<T>(job: () => Promise<T>, setLoading: (value: boolean) => void, setError: (value: string) => void, onSuccess: (value: T) => void, fallback: string) {
  setLoading(true);
  setError("");
  try { onSuccess(await job()); }
  catch (error) { setError(error instanceof Error ? error.message : fallback); }
  finally { setLoading(false); }
}

function statusClass(confidence: GroundedAnswer["confidence"]): string {
  if (confidence === "Grounded") return "status-badge status-grounded";
  if (confidence === "Partially grounded") return "status-badge status-partial";
  return "status-badge status-refusal";
}

function formatSourceMeta(source: SourceRecord): string {
  return [source.law, source.paragraph, source.absatz || source.section_title].filter(Boolean).join(" · ") || source.section_title || "Official source";
}

function SourceInspector({ source, emptyText = "Click a source to inspect the relevant excerpt, metadata, and direct link." }: { source?: SourceRecord; emptyText?: string }) {
  if (!source) {
    return <aside className="card inspector empty"><div className="inspector-kicker">Source inspector</div><p className="muted-small">{emptyText}</p></aside>;
  }
  return (
    <aside className="card inspector">
      <div className="inspector-kicker">Source inspector</div>
      <h3>{source.title}</h3>
      <div className="inspector-org">{source.organisation}</div>
      <hr className="inspector-rule" />
      <dl className="inspector-dl">
        <dt>Reference</dt><dd>{formatSourceMeta(source)}</dd>
        <dt>Imported</dt><dd>{source.retrieved_date}</dd>
        <dt>Reviewed</dt><dd>{source.last_reviewed_date}</dd>
      </dl>
      <hr className="inspector-rule" />
      <div className="excerpt">{source.text}</div>
      <a className="external-link" href={source.source_url} target="_blank" rel="noreferrer">Open official source ↗</a>
    </aside>
  );
}

function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="section-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{children}</div></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("knowledge");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vertical, setVertical] = useState("taxpilot");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceRecord | undefined>();
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [category, setCategory] = useState<Category>("freelancer");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [communicationText, setCommunicationText] = useState("A new synthetic client starts as a freelance designer in September. They ask how tax registration through ELSTER works and which documents are needed to get started.");
  const [brief, setBrief] = useState<IntakeBrief | null>(null);
  const [communicationLoading, setCommunicationLoading] = useState(false);
  const [communicationError, setCommunicationError] = useState("");
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowPayload, setWorkflowPayload] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState("");
  const [roiHours, setRoiHours] = useState(18);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setTimerSeconds((value) => value > 0 ? value - 1 : 0), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (timerSeconds === 0) setTimerRunning(false);
  }, [timerSeconds]);

  const answerSources = useMemo(() => new Map((answer?.retrieved ?? []).map((item) => [item.source.id, item.source])), [answer]);
  const selectedAnswerSource = selectedSource || (answer?.retrieved[0]?.source);
  const timerLabel = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;
  const roiValue = Math.round(roiHours * 42);

  async function askQuestion(nextQuestion = question) {
    setQuestion(nextQuestion);
    setAnswer(null);
    setSelectedSource(undefined);
    await runAction(
      () => postJson<GroundedAnswer>("/api/taxpilot/query", { question: nextQuestion }),
      setQuestionLoading,
      setQuestionError,
      (payload) => {
      setAnswer(payload);
      setSelectedSource(payload.retrieved[0]?.source);
      },
      "The question could not be processed.",
    );
  }

  async function createChecklist(nextCategory = category) {
    await runAction(
      () => postJson<Checklist>("/api/checklists/generate", { category: nextCategory }),
      setChecklistLoading,
      setChecklistError,
      (payload) => {
      setChecklist(payload);
      setView("checklists");
      },
      "The checklist could not be created.",
    );
  }

  async function createEmail(sourceText = answer?.answer || checklist?.description || "Create a short draft for the requested documents.") {
    await runAction(
      () => postJson<{ body?: string }>("/api/email/generate", { sourceText, subjectHint: answer ? "Follow-up questions about your tax inquiry" : checklist?.title }),
      setEmailLoading,
      setQuestionError,
      (payload) => {
      setEmail(payload.body || "");
      setView("email");
      },
      "The draft could not be created.",
    );
  }

  async function qualifyCommunication() {
    await runAction(
      () => postJson<IntakeBrief>("/api/communication/qualify", { message: communicationText }),
      setCommunicationLoading,
      setCommunicationError,
      (payload) => {
      setBrief(payload);
      },
      "The message could not be qualified.",
    );
  }

  async function exportWorkflow() {
    const workflow = brief ? { topic: brief.topic, summary: brief.summary, requestedAction: brief.requestedAction, missingInformation: brief.missingInformation } : { topic: "Grounded answer", summary: answer?.answer || "No basis selected yet.", requestedAction: "Review the answer professionally and set the next internal step.", missingInformation: [] };
    await runAction(
      () => postJson<Record<string, unknown>>("/api/workflow/export", workflow),
      setWorkflowLoading,
      setQuestionError,
      (payload) => {
      setWorkflowPayload(payload);
      },
      "The export could not be created.",
    );
  }

  async function copyValue(value: string, label: string) {
    if (await copyToClipboard(value)) { setCopied(label); window.setTimeout(() => setCopied(""), 1600); }
  }

  function downloadPayload() {
    if (!workflowPayload) return;
    const blob = new Blob([JSON.stringify(workflowPayload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href; anchor.download = "taxpilot-mvp-handoff.json"; anchor.click(); URL.revokeObjectURL(href);
  }

  function navigate(nextView: View) { setView(nextView); setMobileOpen(false); setQuestionError(""); }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark">T.</div><div><div className="brand-name">TaxPilot</div><div className="brand-label">Knowledge Desk</div></div></div>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.key} className={`nav-button ${view === item.key || (item.key === "knowledge" && view === "email") ? "active" : ""}`} onClick={() => navigate(item.key)}><span className="nav-symbol">{item.symbol}</span>{item.label}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-disclaimer"><span>▱</span><span>Not a substitute for professional tax advice.</span></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Open navigation">☰</button><div className="breadcrumb">TaxPilot / <strong>{view === "knowledge" ? "Knowledge assistant" : view === "email" ? "Email draft" : navItems.find((item) => item.key === view)?.label}</strong></div></div>
          <div className="topbar-right"><span className="demo-pill"><span className="demo-dot" /> Demo mode</span><select className="vertical-select" aria-label="Product vertical" value={vertical} onChange={(event) => setVertical(event.target.value)}><option value="taxpilot">TaxPilot — Tax advisory</option><option value="crafthub">CraftHub — Preview</option><option value="loghub">LogHub — Preview</option></select></div>
        </header>

        <div className="page-wrap">
          {vertical !== "taxpilot" && <div className="notice"><span className="notice-mark">◌</span><span><strong>{vertical === "crafthub" ? "CraftHub" : "LogHub"} is a product-shell preview.</strong> The TaxPilot knowledge base is the only active vertical in this MVP.</span></div>}
          <div className="notice"><span className="notice-mark">!</span><span>Demo environment: Please do not enter personal client data or tax IDs.</span></div>

          {view === "knowledge" && <KnowledgeView question={question} setQuestion={setQuestion} questionLoading={questionLoading} questionError={questionError} answer={answer} selectedSource={selectedAnswerSource} answerSources={answerSources} setSelectedSource={setSelectedSource} askQuestion={askQuestion} createChecklist={createChecklist} createEmail={createEmail} copyValue={copyValue} copied={copied} />}
          {view === "email" && <EmailView email={email} setEmail={setEmail} emailLoading={emailLoading} createEmail={createEmail} copyValue={copyValue} copied={copied} />}
          {view === "checklists" && <ChecklistsView category={category} setCategory={setCategory} checklist={checklist} checklistLoading={checklistLoading} checklistError={checklistError} createChecklist={createChecklist} setChecklist={setChecklist} createEmail={createEmail} copyValue={copyValue} copied={copied} />}
          {view === "communication" && <CommunicationView communicationText={communicationText} setCommunicationText={setCommunicationText} brief={brief} communicationLoading={communicationLoading} communicationError={communicationError} qualifyCommunication={qualifyCommunication} copyValue={copyValue} copied={copied} />}
          {view === "workflow" && <WorkflowView brief={brief} answer={answer} workflowPayload={workflowPayload} workflowLoading={workflowLoading} exportWorkflow={exportWorkflow} downloadPayload={downloadPayload} />}
          {view === "sources" && <SourcesView selectedSource={selectedSource} setSelectedSource={setSelectedSource} />}
          {view === "strategy" && <StrategyView roiHours={roiHours} setRoiHours={setRoiHours} roiValue={roiValue} timerLabel={timerLabel} timerRunning={timerRunning} setTimerRunning={setTimerRunning} setTimerSeconds={setTimerSeconds} />}
          <div className="footer-note">TaxPilot helps teams turn scattered tax knowledge into grounded answers, source-backed checklists, and client-ready first drafts. The knowledge base is curated and incomplete.</div>
        </div>
      </main>
    </div>
  );
}

function KnowledgeView({ question, setQuestion, questionLoading, questionError, answer, selectedSource, answerSources, setSelectedSource, askQuestion, createChecklist, createEmail, copyValue, copied }: {
  question: string; setQuestion: (value: string) => void; questionLoading: boolean; questionError: string; answer: GroundedAnswer | null; selectedSource?: SourceRecord; answerSources: Map<string, SourceRecord>; setSelectedSource: (source?: SourceRecord) => void; askQuestion: (question?: string) => void; createChecklist: (category?: Category) => void; createEmail: () => void; copyValue: (value: string, label: string) => void; copied: string;
}) {
  return <>
    <PageHeading eyebrow="TaxPilot / Knowledge Desk" title="How can we help?"><p className="intro">Ask a question based on your reviewed knowledge sources. TaxPilot answers only when the curated knowledge base provides sufficient support.</p></PageHeading>
    <div className="card query-card"><textarea className="query-textarea" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: Which documents do I need for an income-tax return?" aria-label="Question for the knowledge assistant" /><div className="query-footer"><span className="muted-small">Reviewed sources only · no general model knowledge</span><button className="primary-btn" onClick={() => askQuestion()} disabled={questionLoading || question.trim().length < 8}>{questionLoading && <span className="spinner" />} {questionLoading ? "Checking sources …" : "Find answer"}</button></div>{questionError && <div className="error-text">{questionError}</div>}</div>
    <div className="suggestions">{suggestedQuestions.map((suggestion, index) => <button key={suggestion} className="suggestion-card" onClick={() => askQuestion(suggestion)}><span className="suggestion-label">Example question 0{index + 1}</span>{suggestion}</button>)}</div>
    {answer && <div className="workspace-grid"><section className="card answer-card"><div className="answer-top"><div><div className="eyebrow">TaxPilot answer</div><div className="answer-meta"><span className={statusClass(answer.confidence)}>{answer.confidence}</span><span>{answer.mode}</span></div></div><button className="ghost-btn" onClick={() => copyValue(answer.answer, "answer")}>{copied === "answer" ? "Copied" : "Copy answer"}</button></div><div className={`answer-body ${answer.confidence === "Insufficient evidence" ? "refusal" : ""}`}>{answer.answer}</div>{answer.nextSteps.length > 0 && <div className="next-steps"><h3>Useful next steps</h3><ul className="step-list">{answer.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul></div>}<div className="sources-strip"><h3>Source support — click to inspect</h3><div className="source-chips">{answer.citationIds.length > 0 ? answer.citationIds.map((sourceId) => { const source = answerSources.get(sourceId); return source ? <button className="source-chip" key={sourceId} onClick={() => setSelectedSource(source)}><b>§</b>{source.paragraph || source.organisation} · {source.title.split(" — ")[0]}</button> : null; }) : <span className="muted-small">No source provided sufficient support for this question.</span>}</div></div><div className="answer-actions"><button className="secondary-btn" onClick={() => createChecklist(answer.answer.includes("VAT") ? "vat-return" : answer.answer.includes("freelance") ? "freelancer" : "income-tax")}>☑ Create checklist</button><button className="secondary-btn" onClick={() => createEmail()}>✉ Create email draft</button></div></section><SourceInspector source={selectedSource} /></div>}
    {!answer && <div className="mini-grid"><div className="card mini-stat"><div className="mini-stat-label">Curated sources</div><div className="mini-stat-value">11</div><div className="mini-stat-foot">Laws · ELSTER · authorities</div></div><div className="card mini-stat"><div className="mini-stat-label">Answer principle</div><div className="mini-stat-value">Refuse</div><div className="mini-stat-foot">when evidence is missing</div></div><div className="card mini-stat"><div className="mini-stat-label">Integration status</div><div className="mini-stat-value">Preview</div><div className="mini-stat-foot">no live DATEV connection</div></div></div>}
  </>;
}

function ChecklistsView({ category, setCategory, checklist, checklistLoading, checklistError, createChecklist, setChecklist, createEmail, copyValue, copied }: { category: Category; setCategory: (value: Category) => void; checklist: Checklist | null; checklistLoading: boolean; checklistError: string; createChecklist: (category?: Category) => void; setChecklist: (value: Checklist | null) => void; createEmail: () => void; copyValue: (value: string, label: string) => void; copied: string }) {
  const copyText = checklist ? `${checklist.title}\n\n${checklist.items.map((item) => `- ${item.text}`).join("\n")}` : "";
  return <><PageHeading eyebrow="Workflow building block" title="Checklists"><p className="intro">Create an editable first review path. Each item is either linked to a source or marked as an illustrative internal workflow suggestion.</p></PageHeading><div className="category-grid">{sourceCategories.map((item) => <button className={`category-card ${category === item.key ? "selected" : ""}`} key={item.key} onClick={() => { setCategory(item.key); void createChecklist(item.key); }}><div className="category-icon">{item.symbol}</div><div className="category-name">{item.title}</div><div className="category-meta">{item.detail}</div></button>)}</div>{checklistError && <div className="error-text">{checklistError}</div>}{checklistLoading && <div className="card empty-state">Assembling sources …</div>}{checklist && !checklistLoading && <div className="card checklist-card"><div className="checklist-head"><div><div className="eyebrow">Editable working draft</div><h2>{checklist.title}</h2><div className="checklist-description">{checklist.description}</div></div><div className="form-actions"><button className="secondary-btn" onClick={() => copyValue(copyText, "checklist")}>{copied === "checklist" ? "Copied" : "Copy checklist"}</button><button className="secondary-btn" onClick={createEmail}>Email draft</button></div></div><div className="check-items">{checklist.items.map((item, index) => <label className="check-item" key={item.id}><input type="checkbox" aria-label={`Mark item ${index + 1} complete`} /><input type="text" value={item.text} aria-label={`Checklist item ${index + 1}`} onChange={(event) => setChecklist({ ...checklist, items: checklist.items.map((current) => current.id === item.id ? { ...current, text: event.target.value } : current) })} />{item.grounded ? <span className="evidence-badge">Source-backed</span> : <span className="evidence-badge illustrative-badge">Illustrative</span>}</label>)}</div><div className="checklist-note">{checklist.disclaimer}</div></div>}{!checklist && !checklistLoading && <div className="card empty-state">Choose a case type to create a small, source-backed working draft.</div>}</>;
}

function EmailView({ email, setEmail, emailLoading, createEmail, copyValue, copied }: { email: string; setEmail: (value: string) => void; emailLoading: boolean; createEmail: () => void; copyValue: (value: string, label: string) => void; copied: string }) {
  return <><PageHeading eyebrow="Communication building block" title="Email draft"><p className="intro">A friendly, concise first draft from an answer or checklist. It remains editable and carries the professional review reminder.</p></PageHeading><div className="card form-card">{email ? <><label className="field-label" htmlFor="email-editor">Draft <span className="field-hint">editable in this browser</span></label><textarea id="email-editor" className="text-area email-editor" value={email} onChange={(event) => setEmail(event.target.value)} /><div className="form-actions"><button className="secondary-btn" onClick={() => copyValue(email, "email")}>{copied === "email" ? "Copied" : "Copy email"}</button><button className="primary-btn" onClick={() => createEmail()} disabled={emailLoading}>{emailLoading ? "Creating …" : "Create again"}</button></div></> : <div className="email-empty">No draft yet.<br />Create one from a grounded answer or checklist.</div>}</div></>;
}

function CommunicationView({ communicationText, setCommunicationText, brief, communicationLoading, communicationError, qualifyCommunication, copyValue, copied }: { communicationText: string; setCommunicationText: (value: string) => void; brief: IntakeBrief | null; communicationLoading: boolean; communicationError: string; qualifyCommunication: () => void; copyValue: (value: string, label: string) => void; copied: string }) {
  return <><PageHeading eyebrow="P1 · synthetic demo flow" title="Communication Hub"><p className="intro">Turn a typed sample message into an internal intake brief and formal follow-up draft. No telephony, inbox, or CRM connection.</p></PageHeading><div className="two-column"><div className="card form-card"><label className="field-label" htmlFor="communication-input">Synthetic message <span className="field-hint">no real client data</span></label><textarea id="communication-input" className="text-area" value={communicationText} onChange={(event) => setCommunicationText(event.target.value)} /><div className="form-actions"><button className="primary-btn" onClick={qualifyCommunication} disabled={communicationLoading || communicationText.length < 20}>{communicationLoading ? "Structuring …" : "Qualify intake"}</button></div>{communicationError && <div className="error-text">{communicationError}</div>}</div><div className="card form-card">{brief ? <><div className="eyebrow">Internal intake brief</div><div className="brief-grid"><div className="brief-cell"><div className="brief-label">Relationship</div><div className="brief-value">{brief.relationshipStatus}</div></div><div className="brief-cell"><div className="brief-label">Topic</div><div className="brief-value">{brief.topic}</div></div><div className="brief-cell wide"><div className="brief-label">Summary</div><div className="brief-value">{brief.summary}</div></div><div className="brief-cell wide"><div className="brief-label">Requested action</div><div className="brief-value">{brief.requestedAction}</div></div><div className="brief-cell"><div className="brief-label">Missing information</div><div className="brief-value">{brief.missingInformation.join(", ") || "None detected"}</div></div><div className="brief-cell"><div className="brief-label">Confidence</div><div className="brief-value">{brief.confidence}</div></div>{brief.estimatedFee && <div className="brief-cell wide"><div className="brief-label">Explicitly stated value</div><div className="brief-value">{brief.estimatedFee}</div></div>}</div><div className="form-actions"><button className="secondary-btn" onClick={() => copyValue(JSON.stringify(brief, null, 2), "brief")}>{copied === "brief" ? "Copied" : "Copy brief"}</button></div></> : <div className="email-empty">The structured brief will appear here.<br />Use the synthetic sample message or enter your own demo text.</div>}</div></div>{brief && <div className="card form-card" style={{ marginTop: 16 }}><label className="field-label" htmlFor="brief-email">Follow-up draft <span className="field-hint">review before sending</span></label><textarea id="brief-email" className="text-area" value={brief.draftEmail} onChange={() => undefined} readOnly /><div className="form-actions"><button className="secondary-btn" onClick={() => copyValue(brief.draftEmail, "follow-up")}>{copied === "follow-up" ? "Copied" : "Copy draft"}</button></div></div>}</>;
}

function WorkflowView({ brief, answer, workflowPayload, workflowLoading, exportWorkflow, downloadPayload }: { brief: IntakeBrief | null; answer: GroundedAnswer | null; workflowPayload: Record<string, unknown> | null; workflowLoading: boolean; exportWorkflow: () => void; downloadPayload: () => void }) {
  const source = brief ? { topic: brief.topic, summary: brief.summary } : answer ? { topic: "Grounded answer", summary: answer.answer } : null;
  return <><PageHeading eyebrow="Handoff building block" title="Workflow Desk"><p className="intro">Turn an intake brief or grounded answer into a neutral internal handoff. No DATEV connection and no live export.</p></PageHeading>{source ? <div className="two-column"><div className="card workflow-card"><div className="eyebrow">Internal action checklist</div><h2>{source.topic}</h2><div className="checklist-description">{source.summary}</div><div className="workflow-list"><div className="workflow-row">Review the facts and source relationship.</div><div className="workflow-row">Request missing information through the agreed secure channel.</div><div className="workflow-row">Set the responsible professional and internal deadline.</div><div className="workflow-row">Obtain professional approval before external communication.</div></div></div><div className="card workflow-card"><div className="eyebrow">Neutral export</div><h2>Structured handoff</h2><div className="export-box"><div className="export-label">MVP draft · neutral-json-handoff</div><p>Review with DATEV and the firm&apos;s individual processes before use. No live integration.</p><button className="primary-btn" onClick={exportWorkflow} disabled={workflowLoading}>{workflowLoading ? "Creating export …" : "Prepare JSON"}</button>{workflowPayload && <><div className="code-preview">{JSON.stringify(workflowPayload, null, 2)}</div><button className="secondary-btn" style={{ marginTop: 10 }} onClick={downloadPayload}>Download JSON</button></>}</div></div></div> : <div className="card empty-state">Create an intake brief in Communication Hub or a grounded answer in the Knowledge assistant first.</div>}</>;
}

function SourcesView({ selectedSource, setSelectedSource }: { selectedSource?: SourceRecord; setSelectedSource: (source?: SourceRecord) => void }) {
  const sources = sourceRegister;
  return <><PageHeading eyebrow="Curated knowledge base" title="Sources"><p className="intro">This list shows the sources TaxPilot currently searches. Official laws and authority pages are source material; internal templates and examples would be separate and clearly marked as illustrative.</p></PageHeading><div className="workspace-grid"><div className="source-list">{sources.length > 0 ? sources.map((source) => <button className="card source-row" key={source.id} onClick={() => setSelectedSource(source)}><div><div className="source-title">{source.title}</div><div className="source-meta">{source.organisation} · {formatSourceMeta(source)}</div><div className="source-categories">{source.category.map((category) => <span key={category} className="category-pill">{category}</span>)}</div></div><span className="external-link">Inspect →</span></button>) : <div className="card empty-state">Loading sources …</div>}</div><SourceInspector source={selectedSource} emptyText="Select a source on the left. The excerpt is shown unchanged from the local source register." /></div></>;
}

function StrategyView({ roiHours, setRoiHours, roiValue, timerLabel, timerRunning, setTimerRunning, setTimerSeconds }: { roiHours: number; setRoiHours: (value: number) => void; roiValue: number; timerLabel: string; timerRunning: boolean; setTimerRunning: (value: boolean) => void; setTimerSeconds: (value: number) => void }) {
  return <><PageHeading eyebrow="Strategy & Pitch Studio" title="The TaxPilot story"><p className="intro">A compact, clearly illustrative sales foundation for a conversation with an owner-led tax advisory firm.</p></PageHeading><div className="pitch-grid"><div className="card pitch-card"><h3>Problem → layer → next step</h3><p>Recurring questions, scattered knowledge, and slow first responses put pressure on teams. DATEV remains the core system for bookkeeping and firm processes; TaxPilot is designed as a knowledge, communication, and workflow layer around it.</p><div className="roadmap"><div className="roadmap-row"><div className="roadmap-time">Problem</div><div><strong>Senior capacity is consumed by routine questions.</strong><span>Illustrative customer scenario — not a market statistic.</span></div></div><div className="roadmap-row"><div className="roadmap-time">Layer</div><div><strong>Grounded answer, source-backed checklist, first draft.</strong><span>A small, reviewable starting point alongside existing systems.</span></div></div><div className="roadmap-row"><div className="roadmap-time">Pilot</div><div><strong>30 days with one recurring case type.</strong><span>Review source coverage, approval process, and actual usefulness together.</span></div></div></div><h3 style={{ marginTop: 28 }}>30-day GTM outline</h3><div className="roadmap"><div className="roadmap-row"><div className="roadmap-time">Days 1–7</div><div><strong>Select one case pattern.</strong><span>Set sources and internal approval rules.</span></div></div><div className="roadmap-row"><div className="roadmap-time">Days 8–21</div><div><strong>Test with a small team.</strong><span>Review answers, checklists, and drafts against internal standards — without real client data in the demo.</span></div></div><div className="roadmap-row"><div className="roadmap-time">Days 22–30</div><div><strong>Create a decision brief.</strong><span>What is used, what is rejected, and which review or privacy requirements are still missing?</span></div></div></div></div><div className="card pitch-card"><h3>ROI calculator</h3><p>Illustrative assumption, not a promised saving: €499/month subscription versus recovered internal capacity.</p><div className="roi-number">€ {roiValue.toLocaleString("de-DE")}</div><div className="roi-detail">indicative capacity value / month</div><input className="slider" type="range" min="4" max="40" value={roiHours} onChange={(event) => setRoiHours(Number(event.target.value))} aria-label="Illustrative hours per month" /><div className="slider-labels"><span>{roiHours} hours / month</span><span>€42 / hour (illustrative)</span></div><div className="objections"><div className="objection"><strong>“We already work entirely in DATEV.”</strong><span>TaxPilot is not meant to replace DATEV. The MVP shows a knowledge and handoff layer; a real integration is explicitly not included.</span></div><div className="objection"><strong>“Tax law changes — how do you prevent hallucinations?”</strong><span>Curated sources, visible citations, a relevance threshold, and hard refusal when evidence is missing. Updates and professional review remain the firm&apos;s responsibility.</span></div><div className="objection"><strong>“What about privacy and professional confidentiality?”</strong><span>This is a demo. A production version needs privacy design, permissions, tenant isolation, encryption, retention rules, and legal review; the MVP claims no certification.</span></div></div><div className="timer"><div className="timer-display">{timerLabel}</div><div className="timer-segment">5-minute Loom teleprompter · {timerRunning ? "running" : "ready"}</div><div className="timer-controls"><button className="primary-btn" onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? "Pause" : "Start"}</button><button className="secondary-btn" onClick={() => { setTimerRunning(false); setTimerSeconds(300); }}>Reset</button></div></div></div></div></>;
}
