# Upstream

This workspace package is derived from
[`lovasoa/jsonjoy-builder`](https://github.com/lovasoa/jsonjoy-builder).

- Upstream version: `1.0.4`
- Pinned commit: `4c8629724cb58f501eb9f5be5cf8817e535f03e5`
- License: MIT (see `LICENSE`)

## Local differences

- Distributed as the private `@workspace/jsonjoy-builder` package.
- Exports TypeScript source directly; there is no package-specific bundle.
- Uses `@workspace/ui` primitives and the repository design tokens.
- Supports a parent-filling, accessible resizable editor layout.
- Uses this repository's TypeScript, ESLint, Vitest, and Storybook setup.
