---
name: Managed Python upgrades
description: A package-manager behavior to account for after upgrading pinned Python dependencies.
---

When using the workspace package-management installer to upgrade a Python package already pinned in `requirements.txt`, inspect the manifest afterward and retain only one canonical pin per package.

**Why:** The installer may append the requested version rather than replacing the existing entry, leaving duplicate declarations even though the runtime package upgraded successfully.

**How to apply:** After an installer-driven Python upgrade, review the requirements manifest before validating or committing; remove duplicate entries and keep the intended version once.