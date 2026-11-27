# FinNews engineering instructions

- Project: Node.js 22, Express 5, vanilla JavaScript frontend.
- Run `npm ci` and `npm test`; use `npm start` to launch locally.
- The news feed consumes a third-party API. Never misrepresent synthetic placeholder content as current verified news.
- Treat article titles, descriptions, URLs and AI-generated quiz text as untrusted input; avoid unsanitized HTML insertion.
- Do not expose API keys or change Render deployment settings without explicit owner approval.
- Make minimal changes, add regression tests, and report observed evidence separately from hypotheses.
- Do not merge into main or deploy on behalf of an agent.
