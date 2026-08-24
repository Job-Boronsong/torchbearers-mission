---
name: Playwright browser runtime
description: Replit Nix workspaces need Chromium runtime libraries in addition to the frontend Playwright package.
---

Playwright browser checks in this workspace require Chromium's shared runtime libraries to be declared in the Replit Nix configuration; installing the npm test package alone is not sufficient. The browser binary itself is a Playwright-managed cache download.

**Why:** A newly installed Playwright Chromium binary failed to launch until its Nix runtime dependencies were available.

**How to apply:** Keep the Nix dependencies when maintaining the frontend browser test environment. On a fresh workspace, install the Playwright Chromium binary before running the frontend E2E command.

The Project workflow starts the web app and validation workflow in parallel. Keep the locked frontend dependency install in the post-merge release hook rather than repeating `npm ci` in the validation workflow.

**Why:** `npm ci` replaces `node_modules`, which can race Vite while the app is starting.

**How to apply:** The validation workflow may invoke the frontend E2E command once dependencies are present; the release hook is responsible for its clean locked install.