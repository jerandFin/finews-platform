# FinNews Level 2 engineering automation

FinNews CI runs syntax checks, API smoke tests and a high-severity dependency audit on pull requests and pushes to `main`. When enabled, the repair workflow runs on Mondays at 08:17 UTC, by manual dispatch, or after a failed CI run for a same-repository push to the current `main` commit.

Diagnosis uses a read-only GitHub token and a workspace-restricted Codex process. A fresh read-only job validates the proposed patch and runs the checks. A separate publisher stages the patch without executing proposed code, checks that the base is current and protected, then pushes a new branch and requests a draft pull request. Repairs without changes end before publication. Draft proposals require human review and approval.

The patch allowlist covers current application files and regular API test files. Dependencies, CI configuration, agent instructions and deployment configuration are outside this scope. Handle findings in those areas through a separate reviewed pull request.

## GitHub and Render settings

1. In GitHub **Settings → Rules → Rulesets**, protect `main`. Require a pull request, the `quality` check from FinNews CI, and human approval where reviewers are available. Restrict bypass, force pushes and deletions. GitHub prevents authors from approving their own pull requests.
2. In **Settings → Actions → General**, keep the default workflow token read-only and allow Actions to create pull requests. GitHub combines creation and approval in one repository setting. Keep write permissions scoped to the publisher and require review by a human.
3. In Render, verify the production service tracks `main`, set **Auto-Deploy** to **Off**, and disable PR previews or automatic preview environments for this repository before testing. Keep deploy hooks and Render credentials out of Actions. Confirm production uses Node 22 and starts with `npm start`.
4. Keep the Actions variable `FINNEWS_CODEX_ENABLED` unset while the setup PR is under review. Only the owner may approve merging the setup PR into `main`. The required workflow must be on the default branch before GitHub accepts manual dispatch.
5. For repair mode, add a budget-limited OpenAI project key as the `OPENAI_API_KEY` Actions secret. Only the diagnosis step uses this key. Do not upload production credentials to Actions.

## Verify draft publication

After the settings above are verified and the setup PR is merged with owner approval, dispatch **FinNews Codex repair** from `main` in **smoke** mode. The smoke run needs no OpenAI key. It adds a comment in an API test file and exercises the same validation and publisher as a repair run. The run summary links to the verified draft. Close the smoke draft and delete its temporary branch after confirming the target is `main` and Render shows no deployment or preview for the run. After the smoke test passes, set the Actions variable `FINNEWS_CODEX_ENABLED` to `true` and dispatch **repair** mode to verify model access and diagnosis.

GitHub may suppress workflows or require approval for PRs opened with `GITHUB_TOKEN`. The repair validation job runs before publishing. If a draft is promoted for review, verify the required `quality` check runs on that commit and obtain the normal approval. Keep protection enabled.

A publishing error after the push can leave a `codex/finnews-*` branch. Inspect that branch and check for a draft before cleaning it up. Unset `FINNEWS_CODEX_ENABLED` to stop new repair and smoke jobs.
