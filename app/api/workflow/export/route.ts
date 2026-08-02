import { workflowSchema } from "@/lib/validation";
import { apiRoute, parseBody } from "@/lib/http";

export const POST = apiRoute(async (request) => {
    const parsed = await parseBody(request, workflowSchema, "Für den Export fehlen Angaben.");
    const now = new Date().toISOString();
    const payload = {
      exportType: "neutral-json-handoff",
      label: "MVP draft",
      warning: "Review with DATEV and the firm's individual processes before use. No live integration.",
      createdAt: now,
      case: {
        topic: parsed.topic,
        summary: parsed.summary,
        requestedAction: parsed.requestedAction || "Set the next internal step.",
        missingInformation: parsed.missingInformation || [],
      },
      internalChecklist: [
        "Review the facts and source relationship.",
        "Request missing information through the agreed secure channel.",
        "Set the responsible professional and internal deadline.",
        "Obtain professional approval before external communication.",
      ],
    };
    return payload;
});
