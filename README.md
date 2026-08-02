# TaxPilot Knowledge Desk

TaxPilot is a deliberately thin MVP for German tax advisory firms: grounded answers, source-backed checklists, and client-ready first drafts. It is an AI knowledge layer around existing practice systems such as DATEV; it is not a DATEV replacement, a live integration, legal advice, or a substitute for professional judgement.

> Demo-Umgebung: Bitte keine personenbezogenen Mandantendaten, Steuer-IDs, Kontodaten oder echten Dokumente eingeben.

## Product surface

- **Knowledge assistant:** English Q&A over 11 locally curated official source chunks. The answer card shows confidence, source badges, a source inspector, next steps, and demo/generation mode.
- **Sources:** source register with direct URLs, legal/section metadata, excerpt, import date, and review date.
- **Checklists:** editable checklists for new freelancers, income-tax returns, VAT pre-returns, and an explicitly illustrative GmbH onboarding shell. Every item is source-backed or labelled illustrative.
- **Email draft:** editable and copyable English first draft with the required professional-review warning.
- **Communication Hub:** synthetic typed message → structured intake brief + formal follow-up draft. No telephony, inbox, calendar, or CRM connection.
- **Workflow Desk:** internal handoff checklist + downloadable neutral JSON preview. It is labelled: “MVP-Entwurf: Vor Nutzung mit DATEV und den kanzleiindividuellen Prozessen prüfen. Keine Live-Integration.”
- **Strategie & Pitch:** illustrative ROI slider, 30-day GTM outline, objection handling, and working five-minute teleprompter timer.
- **Vertical selector:** TaxPilot is active; CraftHub and LogHub are clearly labelled shell previews only.

## Architecture

```text
Next.js App Router
  ├─ app/page.tsx                 English responsive workspace UI
  ├─ app/api/*/route.ts            server-side validation + workflows
  ├─ lib/retrieval.ts              local lexical ranking + threshold
  ├─ lib/openai.ts                 optional server-only grounded generation
  ├─ data/sources.json             source register and exact excerpts
  └─ data/chunks.json              retrieval chunks / local corpus
```

`POST /api/taxpilot/query` validates the question, rejects sensitive demo inputs, retrieves the top 3–5 chunks, and refuses before any model call when no chunk clears the threshold. If `OPENAI_API_KEY` is present, only retrieved excerpts and their source IDs are sent to the model. Model citations are filtered against the retrieved IDs. With no key, deterministic demo mode returns source-derived responses for supported topics or the same refusal text; it never fabricates citations.

The query system prompt is in `lib/openai.ts` and explicitly prohibits general model knowledge, invented links/paragraphs, and confident answers without evidence. Prompts are not persisted or logged by this app.

## Real source register

The following source sections were checked against official pages while building this corpus. The product displays the direct links and the exact excerpt used by each chunk.

| Source | Topic | Direct URL |
| --- | --- | --- |
| § 149 AO Abs. 2 | General filing deadline | https://www.gesetze-im-internet.de/ao_1977/__149.html |
| § 149 AO Abs. 3 | Filing by tax advisers | https://www.gesetze-im-internet.de/ao_1977/__149.html |
| § 152 AO Abs. 1 | Late filing surcharge | https://www.gesetze-im-internet.de/ao_1977/__152.html |
| § 138 AO Abs. 1b, 4 | Registration and one-month notice | https://www.gesetze-im-internet.de/ao_1977/__138.html |
| ELSTER guidance | Freelancer tax registration questionnaire | https://www.elster.de/elsterweb/helpGlobal?themaGlobal=help_fseeun_202401 |
| ELSTER form page | Questionnaire for sole proprietorship | https://www.portal.elster.de/eportal/formulare-leistungen/alleformulare/fseeun |
| § 25 EStG | Income-tax assessment period and return duty | https://www.gesetze-im-internet.de/estg/__25.html |
| ELSTER document guidance | Handling income-tax receipts | https://download.elster.de/download/dokumente/Merkblatt_Umgang_mit_Belegen.pdf |
| § 18 UStG | VAT pre-return timing and submission | https://www.gesetze-im-internet.de/ustg_1980/__18.html |
| § 14 UStG | Invoice information | https://www.gesetze-im-internet.de/ustg_1980/__14.html |
| § 19 UStG | Small-business rule thresholds | https://www.gesetze-im-internet.de/ustg_1980/__19.html |
| § 147 AO | Tax-relevant retention periods | https://www.gesetze-im-internet.de/ao_1977/__147.html |

The source corpus is intentionally incomplete. It must not be treated as complete German tax-law coverage.

## Setup

Requirements: Node.js 18.17+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Environment variables

`OPENAI_API_KEY` is optional. If present, it enables server-side grounded generation. `OPENAI_MODEL` defaults to `gpt-4o-mini`; `OPENAI_EMBEDDING_MODEL` is reserved for a future embedding ingestion pass and is not required by this MVP because the runtime fallback is local lexical retrieval. `NEXT_PUBLIC_APP_URL` is only metadata/configuration. No key is exposed to the browser.

## Ingestion process

`data/sources.json` is the reviewed source register. `scripts/ingest.ts` deterministically rebuilds `data/chunks.json` from the register. If `OPENAI_API_KEY` is present during ingestion, it also stores `text-embedding-3-small` vectors; the runtime uses cosine similarity for chunks with vectors and falls back to deterministic lexical ranking otherwise:

```bash
npm run ingest
```

For a production ingestion pipeline, add an explicit fetch/review step, source checksum, approval state, effective-date tracking, chunk-level provenance, and a human review gate. Do not scrape protected material or add source text that has not been verified.

## Real versus illustrative content

Official laws, ELSTER pages, and the displayed excerpts are source material. The ROI assumptions (€499/month, €42/hour), 30-day GTM outline, objection responses, synthetic messages, sample emails, internal workflow steps, and the GmbH shell are illustrative. The app makes no claim about market size, savings, certifications, hosting location, DSGVO compliance, § 203 StGB / § 57 StBerG interpretation, or DATEV capability.

## Tests and verification

```bash
npm test
npm run lint
npm run build
```

The tests cover retrieval ranking, source/citation mapping, refusal behavior, and supported/illustrative checklist generation. Manual acceptance checks should include the three suggested questions, deadline/late-filing/retention questions, unrelated questions, vague questions, source inspection, editable checklists, email copying, intake qualification, JSON download, vertical preview, and timer controls.

## Deployment

This repo is Vercel-ready:

1. Create a Vercel project from the repository.
2. Use the detected Next.js framework and `npm run build`.
3. Add `OPENAI_API_KEY` server-side only if grounded generation is wanted; demo mode works without it.
4. Add `OPENAI_MODEL` if a different supported model is selected.
5. Deploy and smoke-test the refusal path and all source links.

No deployment has been claimed from this workspace because no Vercel credentials or deployment target were provided.

## Known MVP limitations

- Small curated corpus; no complete tax-code coverage, automatic source refresh, conflict resolution, or embedding index.
- Local lexical retrieval is intentionally simple; it is not a hosted vector database.
- No authentication, multi-tenancy, billing, retention store, audit log, tenant isolation, document uploads, or real client records.
- No real DATEV/DATEV Connect/EXTR integration, email sending, CRM, telephony, or calendar connection.
- OpenAI generation is optional and responses still require citation checks and professional approval.
- Demo mode runs deterministic templates for a narrow supported topic set; otherwise it refuses.

## Production-readiness work still required

A production version needs a DSGVO-compliant design review, permissions and tenant isolation, audit logs, encryption, retention/deletion rules, secure ingestion, source update/rollback policy, human approval, prompt/data minimization, provider contracts, incident handling, and legal/compliance review. This MVP intentionally makes none of those claims.
