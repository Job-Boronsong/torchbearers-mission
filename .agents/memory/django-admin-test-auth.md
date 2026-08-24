---
name: Django admin test authentication
description: How project security settings affect automated admin UI tests.
---

Use `force_login()` for Django admin test-client setup, and set a newly-created
test user's password-change flag to false before exercising admin pages.

**Why:** The Axes authentication backend requires a request object, which
prevents the ordinary Django test-client `login()` helper from authenticating.
New users are also redirected to the forced password-change route before
reaching admin content.

**How to apply:** Keep a separate anonymous request assertion when testing
admin protection. For the authenticated portion, create a staff user with the
needed permissions, disable only its test-only forced-password-change flag, and
use `force_login()`.