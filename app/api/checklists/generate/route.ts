import { buildChecklist } from "@/lib/checklists";
import { checklistSchema } from "@/lib/validation";
import { apiRoute, parseBody } from "@/lib/http";

export const POST = apiRoute(async (request) => buildChecklist((await parseBody(request, checklistSchema, "Please choose a valid checklist.")).category));
