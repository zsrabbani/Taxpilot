import { NextResponse } from "next/server";
import { z } from "zod";

export class ApiError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T, errorMessage?: string): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Invalid JSON request.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(errorMessage || parsed.error.issues[0]?.message || "Invalid input.");
  return parsed.data;
}

export function apiRoute<T>(handler: (request: Request) => Promise<T>) {
  return async (request: Request) => {
    try {
      return NextResponse.json(await handler(request));
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      const message = error instanceof Error ? error.message : "The request could not be processed.";
      return NextResponse.json({ error: message }, { status });
    }
  };
}
