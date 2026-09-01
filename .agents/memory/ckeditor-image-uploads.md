---
name: CKEditor image uploads
description: Requirements for keeping rich-text image uploads usable through the browser and development proxy.
---

CKEditor image uploads must explicitly include common browser file extensions such as `jpg`, and every frontend proxy must forward the CKEditor upload route to Django.

**Why:** The CKEditor package accepted JPEG files on the server but omitted `jpg` from its default browser picker configuration. The editor could then select an allowed image, but the development frontend returned 404 because its upload route was not proxied.

**How to apply:** When changing editor configuration, upload formats, or frontend routing, verify a real staff user can select a `.jpg` or `.png`, receive a successful upload response, and load the returned media URL inside the editor.