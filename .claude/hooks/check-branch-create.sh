#!/usr/bin/env bash
# PreToolUse guardrail for git branch creation.
#
# Blocks `git checkout -b`, `git switch -c`, and `git branch <name>` unless:
#   1. local main/master is up to date with origin, and
#   2. no other local branch has commits not yet merged into main/master
#      (catches a forgotten merge from the previous /implement run).
#
# Any other Bash command passes through untouched.
set -euo pipefail

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# Only act on git branch-creation commands.
if ! printf '%s' "$command" | grep -qE '(^|[;&|]) *git +(checkout +-b\b|switch +-c\b|branch +[A-Za-z0-9])'; then
  exit 0
fi

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root"

default_branch="main"
if ! git show-ref --verify --quiet "refs/heads/$default_branch"; then
  if git show-ref --verify --quiet "refs/heads/master"; then
    default_branch="master"
  else
    exit 0
  fi
fi

git fetch origin "$default_branch" --quiet 2>/dev/null || true

reasons=()

if git show-ref --verify --quiet "refs/remotes/origin/$default_branch"; then
  behind=$(git rev-list "$default_branch..origin/$default_branch" --count 2>/dev/null || echo 0)
  if [ "$behind" -gt 0 ]; then
    reasons+=("local $default_branch is $behind commit(s) behind origin/$default_branch. Run: git switch $default_branch && git pull")
  fi
fi

stale_branches=()
while IFS= read -r b; do
  [ -z "$b" ] && continue
  [ "$b" = "$default_branch" ] && continue
  ahead=$(git rev-list "$default_branch..$b" --count 2>/dev/null || echo 0)
  if [ "$ahead" -gt 0 ]; then
    stale_branches+=("$b ($ahead unmerged commit(s))")
  fi
done < <(git for-each-ref refs/heads --format='%(refname:short)')

if [ "${#stale_branches[@]}" -gt 0 ]; then
  joined=$(printf '%s, ' "${stale_branches[@]}")
  reasons+=("unmerged local branch(es): ${joined%, }. Merge or delete them before starting new work")
fi

if [ "${#reasons[@]}" -gt 0 ]; then
  msg="Blocked new branch creation from $default_branch:"
  for r in "${reasons[@]}"; do
    msg="$msg"$'\n'"- $r"
  done
  jq -n --arg reason "$msg" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
fi

exit 0
