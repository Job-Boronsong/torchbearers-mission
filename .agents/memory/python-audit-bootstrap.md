---
name: Python audit bootstrap
description: Environment-specific pip-audit behavior when auditing pinned requirements files
---

For fully pinned requirements files, use pip-audit with dependency resolution disabled if its normal requirements-file mode fails while bootstrapping pip, wheel, or setuptools through the package firewall.

**Why:** The audit itself can be clean while pip-audit's temporary resolver fails before dependency collection completes.

**How to apply:** Run the required `pip-audit --fix` first, then verify the pinned file with `pip-audit --disable-pip --no-deps -r requirements.txt`.