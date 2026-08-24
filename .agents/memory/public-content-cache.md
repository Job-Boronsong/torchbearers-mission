---
name: Public content cache
description: Scope and freshness behavior for recently loaded public CMS content.
---

Public CMS responses use a short-lived in-memory cache, so cache reuse applies to
client-side navigation in the current browser session, not a full page reload.

**Why:** A full reload starts a new JavaScript runtime and necessarily clears
memory. Keeping the cache process-local preserves a clear, short CMS refresh
policy without persisting stale responses across sessions.

**How to apply:** Test cache reuse by navigating through React Router links. If
future work needs reuse after a browser refresh, add an explicitly bounded
browser-storage cache with its own invalidation policy rather than assuming the
in-memory cache survives reloads.