---
'@x402scan/mcp': patch
---

## 0.2.1### Patch Changes- Fix Content-Type header parsing to handle charset and other parameters - Use `content-type` package for RFC-compliant header parsing - Fix audio/video/text type matching that previously used broken literal switch cases - Extract base MIME type before matching (e.g., `application/json; charset=utf-8` → `application/json`)
