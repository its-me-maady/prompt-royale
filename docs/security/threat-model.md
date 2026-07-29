<!-- agent-notes: { ctx: "Initial threat model for PromptRoyale", deps: [], state: "active", last: "pierrot@2026-07-29" } -->
# Threat Model: PromptRoyale MVP

## Trust Boundaries
1. **Client Browser (Untrusted):** Where the React frontend runs. 
2. **Discord Voice Channels (Semi-Trusted/External):** Communication layer. We do not control Discord's security, but we trust their API for invite generation.
3. **PromptRoyale Backend (Trusted):** Node.js/Express server handling game state, voting logic, and AI prompt wrapping.
4. **MongoDB (Trusted):** Stores user profiles, pre-generated Question Banks, and historical metrics.
5. **LLM API (Trusted/External):** Gemini/OpenAI API used for parsing PDFs and generating combat narratives.

## Initial Attack Surface & STRIDE Analysis
- **Spoofing / Tampering (Game State):** A player could intercept network traffic to alter their vote or directly manipulate the Boss HP if state is trusted on the client. 
  - *Mitigation:* The frontend must be purely a dumb presentation layer. All vote tallying and HP calculation MUST happen on the backend.
- **Denial of Service (AI Endpoints):** Malicious users uploading massive PDFs repeatedly to bankrupt the LLM API credits or crash the server.
  - *Mitigation:* Implement strict rate limiting, file size limits on PDF uploads, and asynchronous queueing for AI generation.
- **Information Disclosure (Prompt Injection):** Students using the "Prompt Lab" to inject instructions that extract internal system prompts or cause the AI to generate inappropriate narratives.
  - *Mitigation:* Strict system prompt boundaries and input sanitization before sending to the LLM. 

## Compliance & Privacy
- **User Data:** We are storing educational materials (professor PDFs) and student performance data. Ensure basic encryption at rest in MongoDB.
