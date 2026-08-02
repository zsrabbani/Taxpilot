import { communicationSchema, hasSensitiveDemoInput } from "@/lib/validation";
import type { IntakeBrief } from "@/lib/types";
import { apiRoute, ApiError, parseBody } from "@/lib/http";

export const POST = apiRoute(async (request) => {
  const { message } = await parseBody(request, communicationSchema);
  if (hasSensitiveDemoInput(message)) throw new ApiError("Please use synthetic demo data only, without tax IDs or bank details.");
  const lower = message.toLocaleLowerCase("de-DE");
  const topic = lower.includes("umsatz") || lower.includes("ustva") || lower.includes("vat") ? "VAT" : lower.includes("freiberuf") || lower.includes("selbstständig") || lower.includes("selbstaendig") || lower.includes("freelance") || lower.includes("self-employed") ? "New self-employed activity" : lower.includes("einkommen") || lower.includes("steuererklärung") || lower.includes("income tax") || lower.includes("tax return") ? "Income tax" : "General inquiry";
  const relationshipStatus = lower.includes("bestehend") || lower.includes("mandat") || lower.includes("existing") || lower.includes("client") ? "Existing client (synthetic)" : "New inquiry / status unclear";
  const missingInformation = [
    ...(topic === "New self-employed activity" ? ["Start date", "Type and location of activity"] : []),
    ...(topic === "VAT" ? ["Filing period", "Relevant turnover and invoice data"] : []),
    ...(topic === "General inquiry" ? ["Specific facts", "Desired timeline"] : []),
  ];
  const feeMatch = message.match(/(?:€|EUR)\s?([\d.,]+)/i);
  const brief: IntakeBrief = {
      relationshipStatus,
      topic,
      summary: message.length > 240 ? `${message.slice(0, 237)}…` : message,
      requestedAction: "Classify the facts, request missing information, and set the next internal review step.",
      missingInformation,
      ...(feeMatch ? { estimatedFee: `Explizit genannt: € ${feeMatch[1]}` } : {}),
      confidence: topic === "General inquiry" || missingInformation.length > 1 ? "Review needed" : "Clear",
      draftEmail: `Subject: Follow-up questions about your inquiry\n\nHello,\n\nThank you for your message. To assess it further, we still need: ${missingInformation.join(", ") || "a brief addition about the facts"}.\n\nPlease send the information through the agreed secure channel.\n\nKind regards\nYour tax advisory team\n\nDraft — please have the firm review it before sending.`,
  };
  return brief;
});
