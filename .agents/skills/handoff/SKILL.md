---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up. Use only when the user explicitly invokes or requests a handoff.
---

Write a handoff document that summarizes the current conversation so a fresh agent can continue the work. Save it in the temporary directory of the user's operating system, not in the current workspace.

Include a `Suggested skills` section recommending skills the next agent should invoke.

Do not duplicate content already captured in specs, plans, ADRs, issues, commits, diffs, or other artifacts. Reference those artifacts by path or URL.

Redact sensitive information, including API keys, passwords, and personally identifiable information.

If the user supplies a description of the next session's focus, tailor the handoff to it.
