---
name: open-pr
description: Open a pull request for the current branch against a target branch (default main), with a drafted title and description. Use whenever the user asks to "create a PR", "open a PR", or "make a pull request".
---

Open a pull request for the current branch by following these steps.

## 1. Determine scope

- Confirm the target base branch. Default to `main` unless the user specifies otherwise.
- Run `git status` first. If the user says to ignore remaining or uncommitted changes, leave them untouched. Do not stage, commit, or stash them.
- Confirm the current branch is pushed to `origin` and up to date. Push it only when the user has approved pushing.

## 2. Draft the PR content

- Run `git log <base>..HEAD --oneline` and `git diff <base>...HEAD --stat` to inspect the complete PR scope.
- Draft a concise conventional-commit-style title (`feat:`, `fix:`, `chore:`, etc.).
- Draft a description with a `## Summary` and bullet points derived from all commits, not only the latest commit.

## 3. Create the PR

Try these options in order:

1. If GitHub tooling is available and authenticated, create the PR against `<base>` and report the returned URL.
2. Otherwise, create a prefilled GitHub compare link:
   - Read the repository slug from `git remote get-url origin`. Support HTTPS and SSH remote formats and strip `.git`.
   - Build `https://github.com/<owner>/<repo>/compare/<base>...<branch>?quick_pull=1&title=<urlencoded-title>&body=<urlencoded-body>`.
   - URL-encode title and body with a real encoder. When PowerShell reads a temporary body file, use explicit UTF-8 encoding. Prefer plain ASCII in the body when practical.
   - Give the user a clickable link and explain whether the GitHub CLI was missing or unauthenticated.

Never guess a token or ask the user to paste one into the conversation. If direct creation is unavailable, suggest installing and authenticating `gh`, or setting `GH_TOKEN` or `GITHUB_TOKEN` in their own shell.

## 4. Report

State whether direct PR creation or the fallback link was used, then provide the URL. Nothing else.
