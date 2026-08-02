import { describe, expect, it } from "vitest";
import { buildChecklist } from "@/lib/checklists";

describe("supported checklist generation", () => {
  it("includes grounded evidence for freelancer onboarding", () => {
    const checklist = buildChecklist("freelancer");
    expect(checklist.items.length).toBeGreaterThanOrEqual(3);
    expect(checklist.items.some((item) => item.grounded && item.sourceIds.includes("ao-138-abs-1b-4"))).toBe(true);
    expect(checklist.items.some((item) => !item.grounded)).toBe(true);
  });

  it("keeps GmbH onboarding visibly illustrative", () => {
    const checklist = buildChecklist("gmbh");
    expect(checklist.items.every((item) => !item.grounded)).toBe(true);
    expect(checklist.disclaimer).toMatch(/illustrative/i);
  });
});
