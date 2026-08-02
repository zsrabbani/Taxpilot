import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Source = { id: string; text: string };

function tokenize(value: string): string[] {
  return value.toLocaleLowerCase("de-DE").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2);
}

async function main() {
  const sourcePath = resolve(process.cwd(), "data/sources.json");
  const outputPath = resolve(process.cwd(), "data/chunks.json");
  const sources = JSON.parse(await readFile(sourcePath, "utf8")) as Source[];
  const chunks: Array<{ id: string; source_id: string; text: string; keywords: string[]; embedding?: number[] }> = [];
  for (const source of sources) {
    const chunk: { id: string; source_id: string; text: string; keywords: string[]; embedding?: number[] } = { id: source.id, source_id: source.id, text: source.text, keywords: tokenize(source.text) };
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small", input: source.text }),
      });
      if (!response.ok) throw new Error(`Embedding request failed for ${source.id}: ${response.status}`);
      const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
      chunk.embedding = payload.data?.[0]?.embedding;
    }
    chunks.push(chunk);
  }
  await writeFile(outputPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");
  console.log(`Wrote ${chunks.length} local retrieval chunks to ${outputPath}`);
}

void main();
