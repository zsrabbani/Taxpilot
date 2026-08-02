import { createQueryEmbedding, groundedOpenAIAnswer } from "@/lib/openai";
import { retrieve } from "@/lib/retrieval";
import { hasSensitiveDemoInput, questionSchema } from "@/lib/validation";
import { insufficientAnswer } from "@/lib/answers";
import { apiRoute, ApiError, parseBody } from "@/lib/http";

export const POST = apiRoute(async (request) => {
  const { question } = await parseBody(request, questionSchema);
  if (hasSensitiveDemoInput(question)) throw new ApiError("Please do not enter tax IDs, bank details, or real client data in the demo.");
  const queryEmbedding = await createQueryEmbedding(question);
  const retrieved = retrieve(question, 5, 0.16, queryEmbedding);
  return retrieved.length ? groundedOpenAIAnswer(question, retrieved) : insufficientAnswer();
});
