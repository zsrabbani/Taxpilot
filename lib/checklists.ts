import type { Checklist, ChecklistItem } from "./types";

const item = (id: string, text: string, sourceIds: string[] = []): ChecklistItem => ({ id, text, grounded: sourceIds.length > 0, sourceIds });

export function buildChecklist(category: "freelancer" | "income-tax" | "vat-return" | "gmbh"): Checklist {
  if (category === "freelancer") {
    return {
      title: "New self-employed / freelancer",
      description: "A first structured intake path for a new freelance case.",
      items: [
        item("freelancer-1", "Record the start date and type of freelance activity.", ["ao-138-abs-1b-4", "elster-erfassung-freiberuflich"]),
        item("freelancer-2", "Check the responsible tax office based on the place of management.", ["elster-formular-fseeun"]),
        item("freelancer-3", "Prepare the tax registration questionnaire electronically and plan the one-month deadline.", ["ao-138-abs-1b-4", "elster-erfassung-freiberuflich"]),
        item("freelancer-4", "Add internal intake questions and power-of-attorney status.", []),
      ],
      disclaimer: "The last item is an illustrative internal workflow suggestion, not a statement of law.",
    };
  }

  if (category === "income-tax") {
    return {
      title: "Income-tax return",
      description: "A source-backed document and review path for the initial request.",
      items: [
        item("income-1", "Clarify the assessment period and filing obligation for the specific case.", ["estg-25"]),
        item("income-2", "Request relevant receipts and schedules internally.", ["elster-belege-einkommensteuer"]),
        item("income-3", "Retain receipts for possible follow-up questions; submit them electronically only if needed.", ["elster-belege-einkommensteuer"]),
        item("income-4", "Have the responsible professional review individual facts and missing evidence.", []),
      ],
      disclaimer: "Document lists may vary by facts and must be completed through professional review.",
    };
  }

  if (category === "vat-return") {
    return {
      title: "VAT pre-return",
      description: "A review path for filing period, invoice data, and electronic submission.",
      items: [
        item("vat-1", "Determine the filing period for the case.", ["ustg-18-abs-1-2"]),
        item("vat-2", "Compile turnover and relevant invoice details for the period.", ["ustg-14-abs-4"]),
        item("vat-3", "Plan electronic submission by the tenth day after the filing period ends.", ["ustg-18-abs-1-2"]),
        item("vat-4", "Review the small-business rule and other special cases for the specific situation.", ["ustg-19-abs-1"]),
      ],
      disclaimer: "The selection and tax treatment of individual transactions is not fully covered.",
    };
  }

  return {
    title: "GmbH onboarding",
    description: "A thin illustrative workflow for structured internal intake.",
    items: [
      item("gmbh-1", "Record legal form, incorporation date, and start of activity.", []),
      item("gmbh-2", "Review the responsible tax office and tax registration materials.", []),
      item("gmbh-3", "Coordinate internal bookkeeping, invoicing, and contact setup.", []),
      item("gmbh-4", "Have the responsible professional add further tax duties and deadlines.", []),
    ],
    disclaimer: "GmbH onboarding is included only as an illustrative internal workflow template; it is not a complete legal or tax checklist.",
  };
}
