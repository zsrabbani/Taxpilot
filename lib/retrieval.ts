import { getSource, retrievalCorpus } from "./corpus";
import type { RetrievedChunk } from "./types";

const STOP_WORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "einem", "einen",
  "und", "oder", "für", "von", "mit", "bei", "auf", "zu", "im", "in", "ist", "sind", "ich",
  "wir", "was", "wie", "welche", "welcher", "welches", "benötige", "benötigen", "muss", "müssen",
  "bitte", "kann", "können", "sollte", "sollen", "the", "a", "an", "and", "of", "to", "is"
]);

function normalizeToken(token: string): string {
  return token.toLocaleLowerCase("de-DE").replace(/[ä]/g, "a").replace(/[ö]/g, "o").replace(/[ü]/g, "u").replace(/ß/g, "ss");
}

export function tokenize(input: string): string[] {
  return input
    .split(/[^\p{L}\p{N}]+/u)
    .map(normalizeToken)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function expandToken(token: string): string[] {
  const expansions: Record<string, string[]> = {
    income: ["einkommensteuer", "steuererklaerung"],
    "income-tax": ["einkommensteuer", "steuererklaerung"],
    taxreturn: ["einkommensteuer", "steuererklaerung"],
    documents: ["unterlagen", "belege"],
    document: ["unterlagen", "belege"],
    receipts: ["belege", "unterlagen"],
    receipt: ["belege", "unterlagen"],
    einkommensteuererklaerung: ["einkommensteuer", "steuererklaerung"],
    einkommensteuererklärung: ["einkommensteuer", "steuererklaerung"],
    unterlagen: ["belege", "aufbewahrung"],
    freiberufler: ["freiberufliche", "taetigkeit", "erfassung"],
    freelancer: ["freiberufler", "freiberufliche", "taetigkeit", "erfassung"],
    freelance: ["freiberufler", "freiberufliche", "taetigkeit", "erfassung"],
    "self-employed": ["freiberufler", "freiberufliche", "taetigkeit", "erfassung"],
    selfemployed: ["freiberufler", "freiberufliche", "taetigkeit", "erfassung"],
    registration: ["erfassung", "aufnahme", "finanzamt"],
    onboarding: ["aufnahme", "erfassung", "freiberufler"],
    freiberufliche: ["freiberufler", "taetigkeit"],
    ustva: ["umsatzsteuer", "voranmeldung"],
    vat: ["umsatzsteuer", "voranmeldung"],
    "vat-return": ["umsatzsteuer", "voranmeldung"],
    vatreturn: ["umsatzsteuer", "voranmeldung"],
    invoice: ["rechnung", "umsatzsteuer"],
    invoices: ["rechnung", "umsatzsteuer"],
    "small-business": ["kleinunternehmer", "umsatzsteuer"],
    smallbusiness: ["kleinunternehmer", "umsatzsteuer"],
    deadline: ["frist", "steuererklaerung"],
    filing: ["steuererklaerung", "abgabe", "frist"],
    late: ["verspaetung", "verspaetungszuschlag"],
    surcharge: ["verspaetungszuschlag"],
    retention: ["aufbewahrung", "unterlagen"],
    retain: ["aufbewahrung", "unterlagen"],
    umsatzsteuervoranmeldung: ["umsatzsteuer", "voranmeldung"],
    verspätungszuschlag: ["verspaetung", "zuschlag"],
    verspaetungszuschlag: ["verspaetung", "zuschlag"],
  };
  return expansions[token] ?? [token];
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  return leftMagnitude && rightMagnitude ? dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude)) : 0;
}

export function retrieve(query: string, limit = 5, threshold = 0.16, queryEmbedding?: number[]): RetrievedChunk[] {
  const queryTokens = tokenize(query).flatMap(expandToken);
  if (queryTokens.length === 0) return [];

  const scored = retrievalCorpus.map((chunk) => {
    const haystack = new Set([...tokenize(chunk.text), ...chunk.keywords.flatMap(tokenize)]);
    const matches = queryTokens.filter((token) => haystack.has(token));
    const uniqueMatches = new Set(matches).size;
    const keywordBoost = queryTokens.filter((token) => chunk.keywords.some((keyword) => tokenize(keyword).includes(token))).length * 0.03;
    const lexicalScore = Math.min(0.99, uniqueMatches / Math.max(queryTokens.length, 1) + keywordBoost);
    const embeddingScore = queryEmbedding && chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
    const score = queryEmbedding && chunk.embedding ? embeddingScore : lexicalScore;
    const source = getSource(chunk.source_id);
    return source ? { ...chunk, score, source } : null;
  }).filter((item): item is RetrievedChunk => Boolean(item));

  return scored
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function hasTopic(query: string, topicTokens: string[]): boolean {
  const tokens = tokenize(query);
  return topicTokens.some((topic) => tokens.includes(normalizeToken(topic)));
}
