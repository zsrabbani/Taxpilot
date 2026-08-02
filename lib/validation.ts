import { z } from "zod";

const unsafeIdentifiers = [
  /steuer[- ]?id/i,
  /identifikationsnummer/i,
  /iban/i,
  /passwort/i,
  /geheimnis/i,
  /\b\d{10,11}\b/,
];

export const questionSchema = z.object({
  question: z.string().trim().min(8, "Please write a slightly more detailed question.").max(1200, "The question is too long."),
});

export const checklistSchema = z.object({
  category: z.enum(["freelancer", "income-tax", "vat-return", "gmbh"]),
  context: z.string().trim().max(800).optional(),
});

export const emailSchema = z.object({
  sourceText: z.string().trim().min(8).max(5000),
  subjectHint: z.string().trim().max(160).optional(),
});

export const communicationSchema = z.object({
  message: z.string().trim().min(20, "Please enter a short synthetic message.").max(2400),
});

export const workflowSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(5).max(1600),
  requestedAction: z.string().trim().max(500).optional(),
  missingInformation: z.array(z.string().trim().max(200)).max(12).optional(),
});

export function hasSensitiveDemoInput(input: string): boolean {
  return unsafeIdentifiers.some((pattern) => pattern.test(input));
}
