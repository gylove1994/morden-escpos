---
name: storybook-testing
license: MIT
description: Storybook 10 testing patterns adapted for the Tellus repo (packages/ui, react-vite). In use here - CSF3 stories, play() interaction/regression stories, autodocs. Not set up here - Vitest integration, Chromatic, a11y addon, sb.mock, MCP addon. Use when writing play-based interaction tests for @workspace/ui components.
tags: [storybook, csf3, play-functions, component-testing, autodocs]
context: fork
version: 2.1.0-tellus
author: OrchestKit (adapted for Tellus)
user-invocable: false
complexity: medium
targets:
  - library: storybook
    version: ">=10.0.0"
allowed-tools:
  - Read
  - Glob
  - Grep
  - WebFetch
  - WebSearch
---

# Storybook Testing — Tellus repo adaptation (Storybook 10)

## Current repo state (read this first)

The Storybook testing surface in `packages/ui` has **exactly one layer**: in-story `play()` interaction regression, running inside `storybook dev` / `build-storybook`.

| Capability | Status in this repo |
|------------|---------------------|
| CSF3 + `satisfies Meta` | ✅ Used by all stories |
| `play()` interaction regression stories | ✅ Conventions below; prior art: `alert-dialog.stories.tsx`, `combobox.stories.tsx`, `command.stories.tsx` |
| Autodocs | ✅ `tags: ["autodocs"]` + JSDoc (see storybook-component-documentation) |
| `@storybook/addon-vitest` / story tests in CI | ❌ Not installed; do not introduce on your own |
| Chromatic / TurboSnap visual regression | ❌ Undecided; explicitly deferred by the PRD (`prd01-ui-storybook.md`, section G) |
| `@storybook/addon-a11y` | ❌ Not installed |
| `sb.mock` module automocking | ❌ Not used; ui-package components have no API dependencies — data is injected via props, so module mocking is unnecessary |
| `@storybook/addon-mcp` | ❌ Not installed |
| MDX docs pages | ❌ None |

If a capability marked "not installed" is needed, confirm with the user first and go through an ADR/issue — **never** add the dependency in passing.

## play() conventions in this repo

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"; // not @storybook/react
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
```

```tsx
export const ShouldOpenClose: Story = {
  name: "when alert dialog trigger is pressed, should open the dialog and be able to close it",
  tags: ["!dev", "!autodocs"], // regression stories stay out of the sidebar and docs page
  play: async ({ canvasElement, canvas, step }) => {
    // Portal content (Dialog/Popover/Tooltip, etc.) must be queried from the body
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the alert dialog", async () => {
      await userEvent.click(await canvas.getByRole("button", { name: /open/i }));
    });

    await step("close the alert dialog", async () => {
      await userEvent.click(
        await canvasBody.getByRole("button", { name: /cancel/i }),
        { delay: 100 },
      );
    });
  },
};
```

Key rules:

- Keep visual/docs stories and regression stories **separate**; regression story export names start with `Should`, and `name` is a full sentence in the form `"when …, should …"`.
- Split interactions with `step()`; `await` every `userEvent` / `expect` call.
- Query with `getByRole` / `getByLabelText` / `getByText`; never use test ids.
- When callback props need assertions, provide `fn()` in args and verify with `toHaveBeenCalled*`.
- Wrap assertions on asynchronously appearing content in `waitFor` (see `hover-card.stories.tsx`).

### Assertion boundaries (`docs/spec/prd01-ui-storybook.md`, section H)

- ✅ Good assertions: user-visible open/close, copy feedback, checkbox changes, error region appearing, callback invocations (copy as provided by story args).
- ❌ Bad assertions: className strings, internal state shape, whether a particular primitive subcomponent was used, or a fixed default string in component source.

## Verification (no CI test pipeline)

```bash
pnpm --filter @workspace/ui storybook        # open locally; check play results in the Interactions panel
pnpm --filter @workspace/ui build-storybook  # build must pass
pnpm --filter @workspace/ui typecheck
pnpm spellcheck
```

## Anti-patterns (this repo)

| Anti-pattern | Use instead |
|--------------|-------------|
| CSF2 `Template.bind({})` | CSF3 object stories + `satisfies` |
| Importing from `@storybook/react` / `@storybook/test` | `@storybook/react-vite` / `storybook/test` |
| Omitting `title` | Explicit `ui/radix/*` or `ui/patterns/*` |
| `vi.mock()` in story files | ui-package components mock no modules; inject data via props/args |
| Asserting implementation details | Test user-visible behavior only |
| Proactively configuring the Vitest addon / Chromatic / a11y addon | Confirm the decision first |

## Applicability of rules and references

`rules/` and `references/` retain generic Storybook 10 material; consult them per this table:

| File | Applicability in this repo |
|------|----------------------------|
| `rules/storybook-csf3-factories.md` | ✅ Applies (see the repo note inside for the `title` rule) |
| `rules/storybook-play-functions.md` | ✅ Applies (see the repo note inside for import paths) |
| `rules/storybook-autodocs.md` | ✅ Mostly applies; component descriptions use JSDoc, not `parameters.docs.description` |
| `rules/storybook-vitest-integration.md` | ⚠️ Not enabled; future reference only |
| `rules/storybook-chromatic-turbosnap.md` | ⚠️ Not enabled (explicitly deferred by the PRD) |
| `rules/storybook-sb-mock.md` | ⚠️ Not enabled |
| `rules/storybook-a11y-testing.md` | ⚠️ Not enabled |
| `references/*` | ⚠️ Migration/CI/addon-ecosystem material; read only when adopting a new capability |

## Related Skills

- `storybook-story-writing` — this repo's CSF3 story structure and naming conventions (read first)
- `storybook-component-documentation` — autodocs + JSDoc documentation conventions
