---
name: Public content cache
description: Scope and freshness behavior for recently loaded public CMS content.
---

Public CMS responses use a short-lived in-memory cache plus a bounded browser-storage
cache for the Home, About, Projects, and Blog listing pages. Both use the same 30-second
freshness window, so recently viewed public pages can also render quickly after refresh.

**Why:** A full reload starts a new JavaScript runtime and clears memory, while a small
browser-storage layer preserves the fast return experience without allowing CMS updates
to remain stale for long.

**How to apply:** Keep persistence restricted to the four public listing keys, write only
successful responses, and remove entries as soon as their shared TTL expires or storage
data is malformed.