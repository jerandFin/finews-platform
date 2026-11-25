#!/usr/bin/env bash
set -euo pipefail

repo="$GITHUB_REPOSITORY"
main="$(gh api "repos/$repo/branches/main")"
if ! jq -e '.protected' <<< "$main" > /dev/null; then
  echo 'Protect main before enabling automated draft publication.' >&2
  exit 1
fi
if [[ "$(jq -r '.commit.sha' <<< "$main")" != "$GITHUB_SHA" ]]; then
  echo 'Main advanced during diagnosis. Run against the new main tip.' >&2
  exit 1
fi

case "$MODE" in
  smoke)
    title='test: FinNews draft publisher smoke check'
    body='Verification only. Close this draft after reviewing the workflow run.'
    ;;
  repair)
    title='fix: Codex-proposed FinNews repair'
    body='This patch passed the repair workflow checks. Review its diff and test evidence before making it ready for review.'
    ;;
  *)
    echo 'Unexpected repair mode.' >&2
    exit 1
    ;;
esac

branch="codex/finnews-$MODE-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
run_url="$GITHUB_SERVER_URL/$repo/actions/runs/$GITHUB_RUN_ID"
body="$body"$'\n\n'"Validation: $run_url"

git -c user.name='github-actions[bot]' \
    -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    -c core.hooksPath=/dev/null commit -m "$title"
commit="$(git rev-parse HEAD)"
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
    -c core.hooksPath=/dev/null push --force-with-lease="refs/heads/$branch:" \
    origin "HEAD:refs/heads/$branch"

# A new run uses its own branch and never overwrites an earlier proposal.
if ! result="$(gh api --method POST "repos/$repo/pulls" \
    -f title="$title" -f body="$body" -f head="$branch" -f base=main -F draft=true)"; then
  printf 'Draft creation failed after pushing %s. Check PR permissions and inspect that branch.\n' "$branch" >&2
  exit 1
fi

url="$(jq -er --arg branch "$branch" --arg commit "$commit" \
    'select(.draft and .state == "open" and (.merged | not) and .base.ref == "main"
      and .head.ref == $branch and .head.sha == $commit) | .html_url' <<< "$result")"
printf 'Verified draft pull request: %s\n' "$url" >> "$GITHUB_STEP_SUMMARY"
