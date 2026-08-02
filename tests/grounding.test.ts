import { describe, expect, it } from "vitest";
import { demoGroundedAnswer, insufficientAnswer } from "@/lib/answers";
import { retrieve } from "@/lib/retrieval";
import { REFUSAL_TEXT } from "@/lib/types";

describe("grounding and citation mapping", () => {
  it("returns only citations present in retrieved source metadata", () => {
    const retrieved = retrieve("Welche Unterlagen benötige ich für eine Einkommensteuererklärung?");
    const answer = demoGroundedAnswer("Welche Unterlagen benötige ich für eine Einkommensteuererklärung?", retrieved);
    expect(answer.citationIds).toContain("elster-belege-einkommensteuer");
    expect(answer.citationIds.every((id) => retrieved.some((item) => item.source_id === id))).toBe(true);
  });

  it("produces an English demo answer for an English question", () => {
    const question = "Which documents do I need for an income-tax return?";
    const answer = demoGroundedAnswer(question, retrieve(question));
    expect(answer.answer).toMatch(/income-tax return/i);
    expect(answer.citationIds).toContain("elster-belege-einkommensteuer");
  });

  it("refuses unrelated questions instead of guessing", () => {
    const answer = insufficientAnswer([]);
    expect(answer.confidence).toBe("Insufficient evidence");
    expect(answer.answer).toBe(REFUSAL_TEXT);
    expect(answer.citationIds).toEqual([]);
  });
});
