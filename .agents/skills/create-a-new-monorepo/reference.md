# Create A New Monorepo Reference

Use these templates as a starting point. Adjust package names and the selected license from the user's answers.

## Dependencies

Install development dependencies with `pnpm`:

```bash
pnpm add -wD turbo typescript eslint @antfu/eslint-config @eslint-react/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh lefthook @commitlint/cli @commitlint/config-conventional
```

Use `-w` for root workspace dependencies. Running `pnpm add -D ...` from the workspace root fails with `ERR_PNPM_ADDING_TO_ROOT`.

Install shared UI workspace dependencies with `pnpm`:

```bash
pnpm --filter @workspace/ui add @radix-ui/react-slot class-variance-authority clsx lucide-react radix-ui tailwind-merge
pnpm --filter @workspace/ui add -D @storybook/addon-docs @storybook/react-vite @tailwindcss/vite @types/react @types/react-dom react react-dom storybook tailwindcss tw-animate-css vite
```

Before writing `package.json`, get the active pnpm version and use it in `packageManager`.

After the base scaffold and dependency install succeed, install all shared generated components from `packages/ui`:

```bash
cd packages/ui
pnpm dlx shadcn@latest add --all
pnpm dlx shadcn@latest add @storybook/all-stories
npx ai-elements@latest
```

Run these commands in this order from `packages/ui`, where `components.json` lives. Confirm the full shadcn/ui install created shared files under `packages/ui/src/components/ui` before installing AI Elements. AI Elements must be installed only after the full shadcn/ui install and must land in the shared UI package, typically `packages/ui/src/components/ai-elements`, not in an app-local component directory.

This scaffold is React/Vite only. Do not add `next`, `@storybook/nextjs-vite`, or other Next.js dependencies. After installing `@storybook/all-stories`, normalize generated stories for React Vite before verification:

- Replace any `@storybook/nextjs-vite` imports with `@storybook/react-vite`.
- Replace any `next/image` usage with a plain React `<img>` element.
- Re-run typecheck and Storybook build after normalization.

For verification, do not accept a single sample component as evidence of a full install. Confirm representative shadcn/ui files such as `button.tsx`, `dialog.tsx`, `field.tsx`, and `table.tsx`; confirm many Storybook story files from `@storybook/all-stories`; and confirm multiple AI Elements files under `src/components/ai-elements`.

## `package.json`

For a private repository:

```json
{
  "name": "new-monorepo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "turbo build",
    "commitlint": "commitlint",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "prepare": "lefthook install",
    "test": "turbo test",
    "typecheck": "tsc --noEmit",
    "typecheck:workspaces": "turbo typecheck"
  },
  "devDependencies": {},
  "packageManager": "pnpm@10.33.2"
}
```

Replace every `10.33.2` in these templates with the exact version reported by `pnpm --version`.

For an open source repository, omit `private`, set `license` to the selected SPDX identifier, and create a matching `LICENSE` file from the canonical license text. Do not invent license text.

## `pnpm-workspace.yaml`

```yaml
packages:
  - apps/*
  - packages/*

settings:
  shellEmulator: true
  trustPolicy: no-downgrade
```

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": [
        "^build"
      ],
      "outputs": [
        "dist/**"
      ]
    },
    "build-storybook": {
      "dependsOn": [
        "^build-storybook"
      ],
      "outputs": [
        "storybook-static/**"
      ]
    },
    "lint": {
      "dependsOn": [
        "^lint"
      ]
    },
    "lint:fix": {
      "dependsOn": [
        "^lint:fix"
      ],
      "cache": false
    },
    "test": {
      "dependsOn": [
        "^test"
      ]
    },
    "typecheck": {
      "dependsOn": [
        "^typecheck"
      ]
    }
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "lib": [
      "ES2023",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2023"
  },
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ],
  "include": [
    "apps",
    "package",
    "*.config.*"
  ]
}
```

## `eslint.config.mjs`

Use one root flat config for the whole repository:

```js
import antfu from '@antfu/eslint-config';

export default antfu(
  {
    typescript: true,
    react: true,
    ignores: [
      'node_modules',
      'dist',
      'build',
      '.eslintcache',
      '**/*.md',
      '**/*.stories.tsx',
      '**/components/ai-elements/**',
      '**/components/ui/**',
      'out',
      '**/dist/**',
      '**/.mastra/**',
      '**/.cursor/**',
      '**/routeTree.gen.ts',
      '**/.devtools/**',
      '**/src/hooks/use-mobile.ts',
      '**/tsconfig.json',
      '**/package.json',
      'package.json',
      'pnpm-workspace.yaml',
      'tsconfig.json',
    ],
  },
  {
    rules: {
      'style/no-tabs': [
        'error',
        {
          allowIndentationTabs: true,
        },
      ],
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'style/semi': [
        'error',
        'always',
      ],
    },
  },
);
```

## `packages/ui/package.json`

Use `packages/ui` as the shared shadcn UI package location:

```json
{
  "name": "@workspace/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "build-storybook": "storybook build",
    "storybook": "storybook dev -p 6006",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "imports": {
    "#components/*": "./src/components/*.tsx",
    "#hooks/*": "./src/hooks/*.ts",
    "#lib/*": "./src/lib/*.ts"
  },
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

## `packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": [
    "src",
    ".storybook"
  ]
}
```

## `packages/ui/src/types/css.d.ts`

```ts
declare module '*.css';
```

## `packages/ui/components.json`

Keep the Tailwind config empty for Tailwind CSS v4. The `@storybook` registry namespace installs stories from the shadcn Storybook registry documented in the `https://github.com/lloydrichards/shadcn-storybook-registry` README.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "#components",
    "ui": "#components/ui",
    "lib": "#lib",
    "hooks": "#hooks",
    "utils": "#lib/utils"
  },
  "registries": {
    "@storybook": "https://registry.lloydrichards.dev/v3/radix/{name}.json"
  }
}
```

Use the Base UI registry only when the user asks for it:

```json
{
  "registries": {
    "@storybook": "https://registry.lloydrichards.dev/v3/base/{name}.json"
  }
}
```

When adding shadcn components later, after the initial scaffold is complete, run the CLI from the app workspace if the component belongs to an app, or from `packages/ui` if the component belongs to the shared UI package. Always use `pnpm dlx shadcn@latest` for shadcn commands. The only `npx` exception in this scaffold is the required AI Elements full install command.

Do not use the single-component examples below during the initial scaffold. The initial scaffold must use `add --all` and `@storybook/all-stories`.

Examples:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add @storybook/button-story
pnpm dlx shadcn@latest add @storybook/all-stories
```

## `packages/ui/src/lib/utils.ts`

```ts
import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## `packages/ui/src/styles/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
```

## `packages/ui/.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite';

import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [
        tailwindcss(),
      ],
    });
  },
};

export default config;
```

## `packages/ui/.storybook/preview.ts`

```ts
import type { Preview } from '@storybook/react-vite';

import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

## `.gitignore`

```gitignore
node_modules
dist
build
.eslintcache
out
.turbo
.env
.env.*
!.env.example
*.log
```

## `lefthook.yml`

```yaml
pre-commit:
  commands:
    lint:
      run: pnpm lint

commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}
```

## `commitlint.config.mjs`

```js
export default {
  extends: ['@commitlint/config-conventional'],
};
```

## `.github/workflows/lint.yml`

```yaml
name: Lint

on:
  pull_request:
  push:
    branches:
      - master

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint
```

## Git Checks

For an empty target without `.git`:

```bash
git init -b master
```

For a target that contains only `.git`, first confirm it has no commits:

```bash
git rev-parse --verify HEAD
```

If that command fails because there are no commits, set the unborn branch to `master`:

```bash
git symbolic-ref HEAD refs/heads/master
```
