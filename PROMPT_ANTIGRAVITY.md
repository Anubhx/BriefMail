/goal Complete BriefMail as an autonomous AI email triage and executive briefing client with safe human-in-the-loop dispatch, calendar scheduling, and n8n webhook triggers at ZERO COST.

### 🛠 Required Skills:
- `modern-web-guidance`

### 🎯 Requirements & Architecture:
0. **Safe Git Branching Strategy (Zero Risk to Main):**
   - Start by creating and switching to a dedicated feature branch: `git checkout -b feature/production-v2`.
   - Ensure all modifications, new files, and tests live on this branch so existing production builds remain untouched.
1. **Gemini Model Upgrade:**
   - In `src/lib/ai/model-router.ts` and `classify-pipeline.ts`, set primary free model to `gemini-3.5-flash-lite` with `gemini-3.5-flash` fallback.
2. **"Draft-Only" Staged Dispatch Safety Layer:**
   - Ensure all AI-generated email replies go into an "Action Required / Staged" Kanban column. Provide a keyboard shortcut (`Cmd+Enter` or button) to approve and dispatch.
3. **Smart Meeting Availability Ingestion:**
   - Detect phrases like "Are you free this Wednesday?" and automatically suggest 3 available 30-minute time slots in IST format inside the draft reply.
4. **1-Click Demo Inbox Mode:**
   - Provide a "Load Demo Executive Inbox" switch on the dashboard with 12 pre-categorized simulated emails (VC term sheet, investor update, customer escalation, newsletter) so recruiters don't need to connect real Gmail.
5. **7:00 AM Morning Digest Card:**
   - Sleek expandable morning briefing widget summarizing key pending actions in under 60 seconds.

### 🧪 Verification Checklist:
- Enable Demo Inbox Mode and verify Kanban board drag-and-drop works smoothly.
- Test 1-click draft approval and check state transitions.
- Push the new branch to remote: `git push -u origin feature/production-v2`.
- Confirm `main`/`master` remains untouched so changes can be safely reviewed and merged later.
