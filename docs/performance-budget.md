<!-- agent-notes: { ctx: "Performance budget targets", deps: [], state: "active", last: "archie@2026-07-29" } -->
# Performance Budget

## Overview
Given the target audience (impatient students) and the gamified nature of the application, latency is a critical product metric.

## Hard Targets
1. **Live Game State Updates (Voting & Damage Calculation):** 
   - **Target:** < 300 ms round trip.
   - **Reasoning:** Combat must feel snappy. When all 4 players lock in, the damage animation must trigger immediately.
2. **Combat Narrative Generation (LLM):** 
   - **Target:** < 2.0 seconds.
   - **Reasoning:** This is the only live LLM call during the Boss Raid. It generates 1-2 sentences of flavor text based on the vote outcome.
3. **PDF to Question Bank Generation (Asynchronous):**
   - **Target:** < 45 seconds (Background process).
   - **Reasoning:** Teachers/Students can wait for background processing as long as it doesn't block the UI, but it should be fast enough that they can play within a minute of uploading.
4. **Client UI Load Time (Largest Contentful Paint):**
   - **Target:** < 1.5 seconds.
   - **Reasoning:** Minimalist focus mode means the UI should be extremely lightweight. No massive assets blocking render.
