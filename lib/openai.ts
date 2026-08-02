import { demoGroundedAnswer, insufficientAnswer } from "./answers";
import type { GroundedAnswer, RetrievedChunk } from "./types";

const SYSTEM_PROMPT = `You are TaxPilot Knowledge Desk, an informational knowledge assistant for a German tax advisory firm.

You may answer only from the verified source excerpts provided in this request. Do not use general knowledge, training data, assumptions, or information outside those excerpts.

Rules:
1. Every factual claim must be supported by one or more provided source IDs.
2. Never invent citations, source links, legal paragraphs, deadlines, requirements, or exceptions.
3. If the sources do not provide enough support, say clearly that the available TaxPilot knowledge base does not provide sufficient support and recommend verification by a qualified tax advisor.
4. Do not frame your output as binding tax or legal advice.
5. Respond in English unless the user asks in another language.
6. Be concise, practical, and clear for busy tax advisory staff.
7. If information is incomplete, distinguish clearly between what the sources support and what requires review.

Return JSON only with this shape: {"answer": string, "nextSteps": string[], "citationIds": string[], "confidence": "Grounded" | "Partially grounded" | "Insufficient evidence"}.`;

export async function createQueryEmbedding(value: string): Promise<number[] | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small", input: value }),
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    return payload.data?.[0]?.embedding;
  } catch {
    return undefined;
  }
}

export async function groundedOpenAIAnswer(question: string, retrieved: RetrievedChunk[]): Promise<GroundedAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return demoGroundedAnswer(question, retrieved);

  const context = retrieved.map((item) => ({
    sourceId: item.source_id,
    title: item.source.title,
    publisher: item.source.organisation,
    paragraph: item.source.paragraph,
    section: item.source.section_title,
    excerpt: item.text,
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ question, verifiedSources: context }) },
        ],
      }),
      cache: "no-store",
    });
    if (!response.ok) return demoGroundedAnswer(question, retrieved);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return demoGroundedAnswer(question, retrieved);
    const parsed = JSON.parse(content) as Partial<GroundedAnswer>;
    const validIds = new Set(retrieved.map((item) => item.source_id));
    const citationIds = Array.isArray(parsed.citationIds) ? parsed.citationIds.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
    if (!parsed.answer || citationIds.length === 0 || parsed.confidence === "Insufficient evidence") {
      return insufficientAnswer(retrieved);
    }
    return {
      answer: parsed.answer,
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.filter((step): step is string => typeof step === "string").slice(0, 5) : [],
      citationIds,
      confidence: parsed.confidence === "Partially grounded" ? "Partially grounded" : "Grounded",
      disclaimer: "Information draft based on the displayed sources — not a substitute for professional tax advice. Review before use.",
      mode: "OpenAI grounded generation",
      retrieved,
    };
  } catch {
    return demoGroundedAnswer(question, retrieved);
  }
}
