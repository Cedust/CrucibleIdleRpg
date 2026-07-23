---
name: open-pr
description: Open a pull request for the current branch against a target branch (default main), with a drafted title and description. Use whenever the user asks to "create a PR", "open a PR", or "make a pull request".
---

You are opening a pull request for the current branch. Work through these steps.

## Step 1 — Determine scope

- Confirm the target base branch (default `main` unless the user specifies otherwise).
- Run `git status` first. If the user says to ignore remaining/uncommitted changes, leave them untouched — do not stage, commit, or stash them yourself.
- Confirm the current branch is pushed to `origin` and up to date (`git status` shows "up to date" or push it if the user has approved pushing).

## Step 2 — Draft the PR content

- Run `git log <base>..HEAD --oneline` and `git diff <base>...HEAD --stat` to see everything the PR will contain.
- Draft a concise title (conventional commit style: `feat:`, `fix:`, `chore:`, etc.) and a description with a `## Summary` — bullet points of what changed, derived from the commit log, not just the last commit

## Step 3 — Create the PR

Try in this order:

1. **`gh` CLI available and authenticated**: run
   ```
   gh pr create --base <base> --title "<title>" --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```
   Report the returned PR URL.

2. **`gh` unavailable or unauthenticated**: fall back to a prefilled GitHub compare link — no auth required, user opens it in the browser to finish creating the PR with one click.
   - Get the repo slug from `git remote get-url origin` (strip `.git`, handle both `https://github.com/OWNER/REPO` and `git@github.com:OWNER/REPO` forms).
   - Build the URL: `https://github.com/<owner>/<repo>/compare/<base>...<branch>?quick_pull=1&title=<urlencoded title>&body=<urlencoded body>`
   - URL-encode with a real encoder (e.g. PowerShell `[uri]::EscapeDataString`), not manual substitution. Read the body file back with explicit UTF-8 encoding (`Get-Content -Raw -Encoding UTF8`) — the default encoding mangles non-ASCII characters like em dashes and arrows. Prefer plain ASCII (`->`, `--`) in the body to sidestep encoding issues entirely.
   - Present the link to the user as a clickable markdown link and tell them why the direct creation wasn't possible (no `gh` CLI / no token).

Never guess at a token or ask the user to paste one into the conversation — if they want direct creation enabled, point them at installing `gh` and running `gh auth login`, or setting `GH_TOKEN`/`GITHUB_TOKEN` in their own shell.

## Step 4 — Report

State which path was used (direct `gh pr create` vs. fallback link) and give the resulting URL. Nothing else.
