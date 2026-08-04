---
name: storybook-story-writing
user-invocable: false
description: Use when creating or modifying Storybook stories for components in packages/ui. Ensures stories follow this repo's CSF3 conventions (react-vite imports, ui/* title hierarchy, JSDoc docs, play-based regression stories) and build successfully.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Storybook - Story Writing (Tellus repo conventions)

Write CSF3 stories for `@workspace/ui` (`packages/ui`). The 60+ existing `*.stories.tsx` files in this repo are the authoritative practice; new stories must stay consistent with them.

## Repo environment

- Storybook **10.x** + `@storybook/react-vite` (framework); the only addon is `@storybook/addon-docs`.
- There is **no** Vitest integration, Chromatic, a11y addon, or MDX docs page — do not introduce any of these.
- Story files live **next to the component source**: `packages/ui/src/components/**/<name>.stories.tsx`.
- Prior art (read first): `alert-dialog.stories.tsx`, `empty.stories.tsx`, `input-group.stories.tsx`.
- The authoritative spec for pattern-component promotion and story coverage is `docs/spec/prd01-ui-storybook.md`.

## Standard template (matches alert-dialog.stories.tsx)

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AlertDialog,
  AlertDialogTrigger,
  // ...
} from "#components/ui/alert-dialog";
import { userEvent, within } from "storybook/test";

/**
 * A modal dialog that interrupts the user with important content and expects
 * a response.
 */
const meta = {
  title: "ui/radix/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <AlertDialog {...args}>{/* compose compound components in meta.render */}</AlertDialog>
  ),
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the alert dialog.
 */
export const Default: Story = {};
```

### Hard conventions

1. **Import paths**: types come from `@storybook/react-vite` (not `@storybook/react`); test utilities (`expect` / `fn` / `userEvent` / `within` / `waitFor` / `step`) come from `storybook/test`.
2. **Internal components** are imported via the `#components/ui/*` subpath; icons come from `lucide-react`.
3. **Explicit `title`** following the hierarchy: shadcn primitives use `ui/radix/<Component>`; pattern composites use `ui/patterns/<Component>`. Do not drop the title to let Storybook auto-generate it.
4. **`satisfies Meta<typeof X>`** + `type Story = StoryObj<typeof meta>`.
5. **JSDoc is the documentation**: the component description goes in a JSDoc comment above `meta`, and each story description goes in a JSDoc comment above the story export. This repo does not use `parameters.docs.description`.
6. `meta` usually carries `tags: ["autodocs"]`, `parameters: { layout: "centered" }`, and an empty `argTypes: {}`.
7. Compound components (Dialog, InputGroup, etc.) are assembled in a **meta-level `render`**; multi-variant showcases use a story-level `render` returning a grid/flex container of examples.

## Interaction regression stories (play)

Keep visual/docs stories separate from interaction regression stories. Repo conventions for regression stories:

```tsx
export const ShouldOpenClose: Story = {
  name: "when alert dialog trigger is pressed, should open the dialog and be able to close it",
  tags: ["!dev", "!autodocs"],
  play: async ({ canvasElement, canvas, step }) => {
    // Portal-rendered content (Dialog/Popover/Tooltip, etc.) must be queried from the body
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the alert dialog", async () => {
      await userEvent.click(
        await canvas.getByRole("button", { name: /open/i }),
      );
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

- Export names start with `Should`; `name` is a full sentence in the form `"when …, should …"`.
- `tags: ["!dev", "!autodocs"]`: regression stories stay out of the sidebar and the docs page.
- Split interactions with `step()`; assert with `expect` from `storybook/test`; use `fn()` for callback props that need assertions.
- Prefer `getByRole` / `getByLabelText` / `getByText` queries; never use test ids.

## Assertion boundaries (from `docs/spec/prd01-ui-storybook.md`, section H)

- **Only assert externally visible behavior**: visible copy (as provided by story args), clickable controls, ARIA/roles, callback invocations.
- **Never assert**: className strings, internal `useState` shape, whether a particular primitive subcomponent was used, or the presence of some default string in component source.

## Zero built-in copy for pattern components (hard constraint A.1)

When writing stories for `ui/patterns/*`:

- All user-visible copy (title, label, error, `aria-label`, …) is passed via **story args**; example English copy exists only in `*.stories.tsx` and **never in component source**.
- Fake data (e.g. Permission/Capability options) is written inline in story args — **do not import domain types**, `apps/web`, or the Control Plane client.

## Verification after changes

```bash
pnpm --filter @workspace/ui build-storybook   # stories must build
pnpm --filter @workspace/ui typecheck
pnpm spellcheck                                # fix real cSpell typos (most other hits are false positives)
pnpm doctor:diff                               # React Doctor check
```

## Anti-patterns

- ❌ CSF2 `Template.bind({})` — always use CSF3 object stories.
- ❌ Importing from `@storybook/react` or `@storybook/test` (legacy paths).
- ❌ Omitting `title` or using hierarchies like `Components/Button` — must be `ui/radix/*` or `ui/patterns/*`.
- ❌ Complex hooks/side-effect logic inside stories — interactions belong in `play`, state belongs in the component.
- ❌ Pulling business orchestration, real APIs, or app i18n strings into ui-package stories.

## Related Skills

- **storybook-component-documentation**: autodocs and JSDoc documentation conventions
- **storybook-testing**: detailed play-based interaction testing rules
