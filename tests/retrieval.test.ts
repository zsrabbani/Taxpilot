import { describe, expect, it } from "vitest";
import { retrieve } from "@/lib/retrieval";

describe("local retrieval", () => {
  it("ranks ELSTER and income-tax evidence for document questions", () => {
    const results = retrieve("Welche Unterlagen benötige ich für eine Einkommensteuererklärung?");
    expect(results.length).toBeGreaterThan(0);
    expect(results.slice(0, 3).map((result) => result.source_id)).toContain("elster-belege-einkommensteuer");
  });

  it("ranks the freiberufler onboarding chunks", () => {
    const results = retrieve("Was muss ich bei der Aufnahme eines neuen Freiberuflers beachten?");
    expect(results.map((result) => result.source_id)).toContain("ao-138-abs-1b-4");
    expect(results.map((result) => result.source_id)).toContain("elster-erfassung-freiberuflich");
  });

  it("supports English questions against the German source corpus", () => {
    const results = retrieve("Which documents do I need for an income-tax return?");
    expect(results.map((result) => result.source_id)).toContain("elster-belege-einkommensteuer");
  });

  it("does not retrieve an unrelated question", () => {
    expect(retrieve("Wie repariere ich mein Fahrrad?", 5, 0.16)).toEqual([]);
  });
});
