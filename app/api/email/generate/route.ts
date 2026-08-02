import { emailSchema } from "@/lib/validation";
import { apiRoute, parseBody } from "@/lib/http";

export const POST = apiRoute(async (request) => {
  const { subjectHint } = await parseBody(request, emailSchema, "Please provide a basis for the draft.");
  const subject = subjectHint || "Information needed for the next review";
  const body = `Subject: ${subject}\n\nHello,\n\nFor the next step, we still need the information and documents mentioned in this draft. Please send them through the agreed secure channel.\n\nOnce the documents are available, we will review the next useful step. Please contact us if you have any questions.\n\nKind regards\nYour tax advisory team\n\nDraft — please have the firm review it before sending.`;
  return { subject, body, disclaimer: "Draft — please have the firm review it before sending." };
});
