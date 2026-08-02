export type Confidence = "Grounded" | "Partially grounded" | "Insufficient evidence";

export type SourceRecord = {
  id: string;
  title: string;
  organisation: string;
  law?: string;
  paragraph?: string;
  absatz?: string;
  section_title?: string;
  category: string[];
  source_url: string;
  retrieved_date: string;
  last_reviewed_date: string;
  text: string;
  illustrative: boolean;
};

export type RetrievalChunk = {
  id: string;
  source_id: string;
  text: string;
  keywords: string[];
  embedding?: number[];
};

export type RetrievedChunk = RetrievalChunk & { score: number; source: SourceRecord };

export type GroundedAnswer = {
  answer: string;
  nextSteps: string[];
  citationIds: string[];
  confidence: Confidence;
  disclaimer: string;
  mode: "Demo mode" | "OpenAI grounded generation" | "Refusal";
  retrieved: RetrievedChunk[];
};

export type ChecklistItem = {
  id: string;
  text: string;
  grounded: boolean;
  sourceIds: string[];
};

export type Checklist = {
  title: string;
  description: string;
  items: ChecklistItem[];
  disclaimer: string;
};

export type IntakeBrief = {
  relationshipStatus: string;
  topic: string;
  summary: string;
  requestedAction: string;
  missingInformation: string[];
  estimatedFee?: string;
  confidence: "Clear" | "Review needed";
  draftEmail: string;
};

export const REFUSAL_TEXT =
  "I could not find sufficient support in the available TaxPilot knowledge base. Please review this with a qualified tax advisor.";

export const DISCLAIMER =
  "Information draft based on the displayed sources — not a substitute for professional tax advice. Review before use.";
