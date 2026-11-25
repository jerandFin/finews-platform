# FinNews Level 2 engineering automation

This setup is proposed on a development branch. It does not activate until reviewed and merged into main.

## What runs automatically
- **FinNews CI:** every pull request and push to main; syntax, smoke tests, dependency audit.
- **FinNews Codex repair:** every Monday at 08:17 UTC, or when the CI workflow fails on main. It can also be started manually.
- The Codex action examines the code in a sandbox and may create a **draft pull request** using the bot token. It does not merge, deploy or directly edit main.

## Before enabling AI repairs
1. In GitHub **Settings > Secrets and variables > Actions**, add a repository secret named `OPENAI_API_KEY`. Use an appropriately budget-limited API key; ChatGPT subscription billing is separate.
2. In GitHub **Settings > Actions > General**, allow GitHub Actions to create pull requests if the repository supports this setting.
3. Configure **Settings > Rules > Rulesets** (or branch protection) on `main`:
   - Require a pull request before merging.
   - Require the **quality** CI check to pass.
   - Disable bypass where available, block force pushes and deletions.
   - Require human approval where repository ownership and plan support it. Sole owners may need a separate reviewer; do not assume self-approval satisfies the rule.
4. In Render, disable direct automatic deployments of unreviewed changes; deploy only approved commits from protected main. Confirm the correct `npm start` command and Node version.
5. Review API spending, weekly schedule and the repository Actions run permissions.
6. Make sure OpenAI keys are never in source files or shared in chat.

## Security limitations
- GitHub's default `GITHUB_TOKEN` may be blocked from creating pull requests until permissions are enabled.
- Existing GitHub Apps or Render integration settings may permit deploys independent of this workflow. Verify those controls separately.
- No workflow can guarantee that an AI fix is correct; review the diff and tests before merging.
- A failed CI workflow on a feature branch does **not** automatically start the repair job. The bot reacts only to failures on main, scheduled runs and manual dispatches.
- Do not blindly run untrusted PR code with API credentials; this workflow checks out main.
- Schedules run in UTC and may be delayed by GitHub.
- If no reproducible issue or changed files exist, the automation should produce no pull request.

## Verification
1. Open the setup PR, confirm CI runs and tests pass.
2. Configure the API secret and GitHub/Render rules.
3. Merge the reviewed setup PR only when approved.
4. In **Actions > FinNews Codex repair**, click **Run workflow**.
5. Inspect action logs; verify that suggested changes appear only as a draft PR.
6. Review and approve the draft PR manually. Merge only after quality checks pass.
