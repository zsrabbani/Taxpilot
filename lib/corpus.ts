import sources from "@/data/sources.json";
import chunks from "@/data/chunks.json";
import type { RetrievalChunk, SourceRecord } from "./types";

export const sourceRegister = sources as SourceRecord[];
export const retrievalCorpus = chunks as RetrievalChunk[];

export function getSource(sourceId: string): SourceRecord | undefined {
  return sourceRegister.find((source) => source.id === sourceId);
}
