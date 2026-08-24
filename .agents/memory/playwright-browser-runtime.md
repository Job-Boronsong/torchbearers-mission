---
name: Playwright browser runtime
description: Replit Nix workspaces need Chromium runtime libraries in addition to the frontend Playwright package.
---

Playwright browser checks in this workspace require Chromium's shared runtime libraries to be declared in the Replit Nix configuration; installing the npm test package alone is not sufficient. The browser binary itself is a Playwright-managed cache download.

**Why:** A newly installed Playwright Chromium binary failed to launch until its Nix runtime dependencies were available.

**How to apply:** Keep the Nix dependencies when maintaining the frontend browser test environment. On a fresh workspace, install the Playwright Chromium binary before running the frontend E2E command.