import { DISCLAIMER, REFUSAL_TEXT } from "./types";
import type { GroundedAnswer, RetrievedChunk } from "./types";

function includesAny(value: string, terms: string[]): boolean {
  const normalized = value.toLocaleLowerCase("de-DE");
  return terms.some((term) => normalized.includes(term));
}

export function demoGroundedAnswer(question: string, retrieved: RetrievedChunk[]): GroundedAnswer {
  const ids = retrieved.map((item) => item.source_id);
  const lower = question.toLocaleLowerCase("de-DE");

  if (includesAny(lower, ["freiberuf", "freelancer", "freelance", "self-employed", "self employed", "selbstständig", "selbstaendig", "aufnahme", "onboarding", "registration", "gründung", "gruendung"])) {
    const sources = retrieved.filter((item) => ["ao-138-abs-1b-4", "elster-erfassung-freiberuflich", "elster-formular-fseeun"].includes(item.source_id));
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "When a new freelance activity starts, the firm should first clarify the start date, type of activity, and responsible tax office. The notification and additional tax-relevant information must be submitted electronically through the officially designated interface, such as ELSTER, within one month of the reportable event.",
      nextSteps: ["Record the start date and type of activity.", "Check the responsible tax office based on the place of management.", "Prepare the tax registration questionnaire electronically and plan the one-month deadline."],
      citationIds: sources.map((item) => item.source_id), confidence: sources.length > 1 ? "Grounded" : "Partially grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  if (includesAny(lower, ["einkommensteuer", "einkommenssteuer", "income tax", "income-tax", "tax return", "taxreturn", "jahreserklärung", "jahreserklaerung"]) && includesAny(lower, ["unterlagen", "belege", "benötige", "benoetige", "dokumente", "documents", "receipts", "records"])) {
    const sources = retrieved.filter((item) => ["estg-25", "elster-belege-einkommensteuer"].includes(item.source_id));
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "For an income-tax return, first determine the relevant assessment period. Receipts and separate schedules generally do not need to be sent to the tax office; they should be retained for possible follow-up questions. In individual cases, the tax office may request receipts.",
      nextSteps: ["Clarify the assessment period and filing obligation for the case.", "Request the relevant receipts and schedules internally.", "Keep receipts available for follow-up questions and submit them electronically only if needed."],
      citationIds: sources.map((item) => item.source_id), confidence: sources.length > 1 ? "Grounded" : "Partially grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  if (includesAny(lower, ["umsatzsteuer", "ustva", "voranmeldung", "vat", "vat return", "vat-return", "pre-return"])) {
    const sources = retrieved.filter((item) => ["ustg-18-abs-1-2", "ustg-14-abs-4", "ustg-19-abs-1"].includes(item.source_id));
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "For a VAT pre-return, check the filing period and the relevant taxable turnover. The pre-return generally must be submitted electronically through the officially designated interface by the tenth day after the filing period ends. When a professional or commercial activity starts, the calendar month is generally the filing period for the current and following calendar year.",
      nextSteps: ["Determine the filing period for the case.", "Compile turnover and invoice details for the period.", "Check the electronic submission process and due date for the specific case."],
      citationIds: sources.map((item) => item.source_id), confidence: sources.length > 1 ? "Grounded" : "Partially grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  if (includesAny(lower, ["frist", "abgabefrist", "steuererklärung wann", "wann muss", "deadline", "filing deadline", "when is my return due"])) {
    const sources = retrieved.filter((item) => ["ao-149-abs-2", "ao-149-abs-3", "ao-152-abs-1"].includes(item.source_id));
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "Unless a different statutory rule applies, tax returns are generally due no later than seven months after the end of the calendar year. For certain returns prepared by tax professionals, subject to statutory exceptions, the general deadline is the last day of February of the second calendar year following the assessment period. A late-filing surcharge may be assessed for late submission.",
      nextSteps: ["Record the return type and assessment period.", "Check whether the firm has been engaged to prepare the return.", "Review any alternative deadline, official order, or grounds for excusable delay in the specific case."],
      citationIds: sources.map((item) => item.source_id), confidence: sources.length > 1 ? "Grounded" : "Partially grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  if (includesAny(lower, ["aufbewahrung", "aufbewahren", "archiv", "belege behalten", "retention", "retain", "keep records", "archive"])) {
    const sources = retrieved.filter((item) => item.source_id === "ao-147-abs-1-3");
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "Section 147 AO covers, among other things, books and records, annual financial statements, received and sent business correspondence, accounting documents, and other documents relevant for taxation. The listed periods differ: ten years for certain records, eight years for accounting documents, and six years for other records, unless another rule applies.",
      nextSteps: ["Classify the types of records.", "Document the start of each retention period.", "Review special rules and any still-running assessment periods for the specific case."],
      citationIds: sources.map((item) => item.source_id), confidence: "Grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  if (includesAny(lower, ["kleinunternehmer", "kleinunternehmerregelung", "small business", "small-business"])) {
    const sources = retrieved.filter((item) => item.source_id === "ustg-19-abs-1");
    if (sources.length === 0) return insufficientAnswer(retrieved);
    return {
      answer: "Section 19 UStG sets a total-turnover threshold of no more than €25,000 in the previous calendar year and no more than €100,000 in the current calendar year for the small-business rule. Whether the rule applies in a specific case depends on the statutory requirements and facts.",
      nextSteps: ["Check total turnover for the previous and current year.", "Clarify the entrepreneur's seat and type of turnover.", "Review filing obligations and possible special cases professionally."],
      citationIds: sources.map((item) => item.source_id), confidence: "Grounded", disclaimer: DISCLAIMER, mode: "Demo mode", retrieved,
    };
  }

  return insufficientAnswer(retrieved);
}

export function insufficientAnswer(retrieved: RetrievedChunk[] = []): GroundedAnswer {
  return { answer: REFUSAL_TEXT, nextSteps: [], citationIds: [], confidence: "Insufficient evidence", disclaimer: DISCLAIMER, mode: "Refusal", retrieved };
}
