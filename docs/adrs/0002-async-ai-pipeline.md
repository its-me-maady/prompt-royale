<!-- agent-notes: { ctx: "ADR for async AI generation", deps: [], state: "active", last: "archie@2026-07-29" } -->
# ADR 0002: AI Question Bank Asynchronous Pipeline

## Context
Parsing dense professor PDFs and generating 10 high-quality MCQs using an LLM takes significantly longer than our 2.0s latency budget. We need a way to process these documents without blocking the user interface.

## Decision
We will decouple PDF processing from the live game loop using an asynchronous background pipeline.
- PDFs are uploaded to the Node.js backend.
- A background worker (using a lightweight queue) processes the PDF via the LLM API.
- The resulting 10 MCQs (the "Question Bank") are stored as a JSON object in MongoDB.
- A Job Status record is updated (Pending -> Processing -> Complete/Failed).

## Rationale
- Decoupling ensures the UI never hangs while waiting for the LLM.
- Pre-generating the Question Bank means the live Boss Raid can pull questions instantly from the database, easily hitting the latency target.

## Consequences (from Debate)
- **Mitigated Risk:** Silent failures. The client MUST poll the job status and gracefully handle failed generations so the user is never left hanging indefinitely.
