---
name: Strict Mode API retry tests
description: How React development-mode effect replay affects browser tests that simulate initial API failures.
---

When a browser test simulates an initial API outage in the Vite development build, explicitly assert the expected initial request count before allowing the visitor-triggered retry request to succeed. Effects without request deduplication may replay requests; callers that share an in-flight promise should make one request.

**Why:** React development mode can mount, clean up, and remount effects, but the API boundary may intentionally coalesce those concurrent loads. Hard-coding the old duplicated-request assumption can either mask an outage state or break the recovery test after deduplication.

**How to apply:** For an initial-load outage test, count or otherwise identify the automatic requests, fail the expected shared or replayed calls, and only let the subsequent request made by the visible retry control continue to the backend.