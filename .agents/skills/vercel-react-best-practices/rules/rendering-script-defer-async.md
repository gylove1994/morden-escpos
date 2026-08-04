---
title: Use defer or async on Script Tags
impact: HIGH
impactDescription: eliminates render-blocking
tags: rendering, script, defer, async, performance
---

## Use defer or async on Script Tags

**Impact: HIGH (eliminates render-blocking)**

Script tags without `defer` or `async` block HTML parsing while the script downloads and executes. This delays First Contentful Paint and Time to Interactive.

- **`defer`**: Downloads in parallel, executes after HTML parsing completes, maintains execution order
- **`async`**: Downloads in parallel, executes immediately when ready, no guaranteed order

Use `defer` for scripts that depend on DOM or other scripts. Use `async` for independent scripts like analytics.

**Incorrect (blocks rendering):**

```html
<head>
  <script src="https://example.com/analytics.js"></script>
  <script src="/scripts/utils.js"></script>
</head>
```

**Correct (non-blocking):**

```html
<head>
  <!-- Independent script - use async -->
  <script src="https://example.com/analytics.js" async></script>
  <!-- DOM-dependent script - use defer -->
  <script src="/scripts/utils.js" defer></script>
</head>
```

Reference: [MDN - Script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer)
