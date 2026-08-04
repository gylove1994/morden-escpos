---
name: create-a-new-monorepo
description: Use when creating a new TypeScript monorepo, initializing a fresh workspace, or bootstrapping apps and packages from an empty directory
---

# Create A New Monorepo

## When to Use

Use this skill when the user asks to create a new monorepo, initialize a fresh workspace, scaffold a repository, or set up a TypeScript monorepo foundation.

Do not use it for adding packages to an existing monorepo, migrating an existing repository, or changing a non-empty project. Stop instead when the target directory is not empty, except for a directory that contains only `.git` and has no commits.

## Core Rule

Do not create project files until the user has chosen the target location and visibility, the target directory has passed the empty-directory check, and the generated project can keep one root ESLint configuration for the whole repository.

## Required Decisions

Ask the user these blocking questions before editing files:

1. Should the monorepo be created in the current working directory or in a new folder?
2. If using a new folder, what folder path should be used?
3. Should the repository be private or open source?
4. If open source, which license should be used?

If the user has already answered any of these in the same request, reuse that answer and ask only for missing decisions.

## Workflow

1. Create a todo for each major step before making changes.
2. Resolve the target directory from the user's answer.
3. Check the target directory, including hidden files:
   - If it does not exist, create it.
   - If it is empty, continue.
   - If it contains only `.git`, verify that repository has no commits before continuing.
   - If it contains anything else, stop and report that the target directory must be empty.
4. Initialize or update git:
   - If `.git` does not exist, initialize the repository with `master` as the initial branch.
   - If `.git` already exists and has no commits, set `HEAD` to `refs/heads/master`.
   - Do not rewrite history or rename branches in a repository with commits.
5. Use `pnpm` for every package operation and generated script. The only scaffold CLI exception is the required AI Elements full install command, which uses `npx ai-elements@latest` after shadcn/ui is fully installed.
6. Create the root monorepo scaffold:
   - `apps/.gitkeep`
   - `packages/.gitkeep`
   - `pnpm-workspace.yaml`
   - `package.json`
   - `turbo.json`
   - `tsconfig.json`
   - `.gitignore`
7. Create the shared shadcn UI workspace at `packages/ui`:
   - Follow the shadcn monorepo guidance for workspace imports, `components.json` aliases, and package exports, using the standard `packages/ui` path.
   - Use `packages/ui`, not `package/ui`, as the shared UI package location.
   - Name the package `@workspace/ui` unless the user explicitly chose a different workspace scope.
   - Configure package-local `#components`, `#hooks`, and `#lib` imports.
   - Export `./globals.css`, `./components/*`, `./hooks/*`, and `./lib/*` for app workspaces.
   - Keep Tailwind config empty in `components.json` for Tailwind CSS v4.
   - Create every `packages/ui` file listed in `reference.md` before installing dependencies.
8. Configure Storybook in `packages/ui`:
   - Add Storybook scripts to the UI package.
   - Add `.storybook/main.ts` and `.storybook/preview.ts`.
   - Configure the shadcn Storybook registry namespace in `packages/ui/components.json`.
   - Use the `@storybook` registry from `reference.md` unless the user asks for the Base UI registry.
   - Wire Storybook's Vite config so Tailwind CSS v4 styles are processed.
9. Configure Turborepo from the root for workspace tasks while keeping root `lint` backed by the single root ESLint config so an empty scaffold still lints real files.
10. Configure one root ESLint flat config for the whole repository:
   - Use `@antfu/eslint-config`.
   - Enable TypeScript and React.
   - Keep all ignores and custom rules in the root config.
   - Do not add package-local ESLint configs unless the user explicitly asks after scaffold completion.
11. Install and configure Lefthook and Commitlint:
   - Add `lefthook.yml`.
   - Add `commitlint.config.mjs`.
   - Wire commit message validation to Commitlint.
   - Wire pre-commit linting to the root lint script.
12. Create a basic GitHub Actions lint workflow.
13. Write root and `packages/ui` manifests from `reference.md`, then run dependency install commands in reference order:
    - Install root workspace dependencies with `pnpm add -wD ...`.
    - Install package-local UI dependencies with `pnpm --filter @workspace/ui ...`.
    - Run `pnpm install`.
14. Install generated shared UI assets from `packages/ui` in this exact order:
    - Change into `packages/ui` before running any shadcn, Storybook registry, or AI Elements CLI command.
    - Run the full shadcn/ui install with `pnpm dlx shadcn@latest add --all`.
    - Confirm shadcn/ui created shared files under `packages/ui/src/components/ui`.
    - Run the full Storybook registry install with `pnpm dlx shadcn@latest add @storybook/all-stories`.
    - Run the full AI Elements install with `npx ai-elements@latest`.
    - Confirm AI Elements landed under the shared UI package, normally `packages/ui/src/components/ai-elements`, not under an app workspace.
15. Run installation and verification with `pnpm`.
16. Report files created, decisions used, generated component locations, checks run, and any known gaps.

## Required ESLint Policy

The generated root `eslint.config.mjs` must follow the current `@antfu/eslint-config` flat-config pattern and include:

- `typescript: true`
- `react: true`
- the required ignores
- the required custom rules

Use the exact ignore list and rule overrides from `reference.md`.

## Common Mistakes

- Starting file creation before asking whether to use the current directory or a new folder.
- Treating a directory as empty without checking dotfiles.
- Continuing in a directory that contains generated files, editor settings, package metadata, or any file other than an unborn `.git` repository.
- Using `npm`, `yarn`, or `npx` for package operations or shadcn commands; `npx ai-elements@latest` is the only allowed `npx` use.
- Creating separate ESLint configs inside `apps` or `packages/*` workspaces by default.
- Forgetting React's optional peer dependencies for `@antfu/eslint-config`.
- Creating GitHub Actions without `pnpm` setup and a lint job.
- Creating a private package while also writing an open source license file, or creating an open source package without the selected license.
- Creating the shared UI package under `package/ui` instead of the required `packages/ui` path.
- Installing root dependencies without `-w`, which fails at the workspace root.
- Adding shadcn components without `components.json` aliases and package exports that route app imports through `@workspace/ui`.
- Installing only one shadcn component instead of the full shared shadcn/ui set.
- Running shadcn, Storybook registry, or AI Elements commands from the repository root instead of `packages/ui`.
- Forgetting the shadcn Storybook registry namespace, which forces agents to hand-write stories instead of installing them through the registry.
- Installing only one Storybook story instead of the `@storybook/all-stories` collection.
- Adding Next.js or `@storybook/nextjs-vite` to satisfy generated Storybook stories instead of normalizing them for React Vite.
- Running AI Elements before confirming the full shadcn/ui install has completed.
- Installing AI Elements into an app-local component directory instead of the shared `packages/ui` workspace.
- Only creating `packages/ui/package.json` while skipping the source files, styles, or Storybook files listed in `reference.md`.

## Pressure Scenario

Prompt: "Create a new monorepo here with pnpm, Turbo, Antfu ESLint, hooks, shared shadcn UI, Storybook, AI Elements, and lint CI."

Baseline failure: The agent immediately writes project files into the current non-empty directory, uses whatever default branch git chooses, installs with npm, spreads ESLint settings across packages, creates `package/ui` instead of `packages/ui`, installs root dependencies without `-w`, installs one sample shadcn component and one Storybook story, runs AI Elements before shadcn is complete or into an app-local directory, omits registry setup, and skips asking whether the repo is private or open source.

Expected behavior: The agent asks for the target location and visibility first, stops on any non-empty target except an unborn `.git` repository, ensures the git branch is `master`, uses `pnpm`, creates one root ESLint config, adds Turborepo, hooks, commitlint, `.gitignore`, `apps`, `packages/ui` with shadcn monorepo aliases, Storybook, the shadcn Storybook registry, lint CI, the full shared shadcn/ui component set, the full Storybook stories collection, and the full AI Elements set in the shared UI workspace, then verifies with evidence.

Pass criteria:

- The agent asks only the missing blocking questions before edits.
- The target directory check includes hidden files and unborn git repositories.
- The workflow stops on non-empty targets.
- Generated scripts and commands use `pnpm`.
- ESLint is configured once at the repository root.
- The shared UI workspace is created at `packages/ui` with shadcn monorepo aliases and exports.
- Root workspace dependencies are installed with `pnpm add -wD`.
- shadcn, Storybook registry, and AI Elements CLI commands are run from `packages/ui`.
- The full shadcn/ui component set is installed into `packages/ui/src/components/ui`.
- Storybook and the `@storybook` shadcn registry namespace are configured for the UI package.
- The `@storybook/all-stories` collection is installed into the UI package.
- AI Elements is installed after shadcn/ui and lands in the shared UI package.
- The UI Storybook build succeeds.
- GitHub Actions runs the root lint command.

## Verification

Before finishing:

1. Confirm the target directory decision and visibility decision.
2. Confirm the empty-directory check result.
3. Confirm the git default branch is `master`.
4. Confirm root files, `apps/.gitkeep`, and `packages/ui` exist.
5. Confirm `pnpm install` completed.
6. Run `pnpm lint`, `pnpm typecheck`, and any repository validation command that exists.
7. Confirm every `packages/ui` source, style, and Storybook file listed in `reference.md` exists.
8. Confirm `packages/ui/components.json` defines shadcn aliases and the `@storybook` registry.
9. Confirm `packages/ui/package.json` exports shared UI entrypoints and includes Storybook scripts.
10. Confirm full shadcn/ui files exist under `packages/ui/src/components/ui`, including representative files such as `button.tsx`, `dialog.tsx`, `field.tsx`, and `table.tsx`.
11. Confirm Storybook stories from `@storybook/all-stories` exist in the UI package, including multiple generated `*.stories.tsx` files rather than a single sample story.
12. Confirm generated Storybook stories are normalized for React Vite and do not import `next/image` or `@storybook/nextjs-vite`.
13. Confirm AI Elements files exist under `packages/ui/src/components/ai-elements`, including multiple generated component files rather than a placeholder directory.
14. Run `pnpm --filter @workspace/ui typecheck` and `pnpm --filter @workspace/ui build-storybook`.
15. Confirm Lefthook is installed and the Commitlint command is executable.
16. Confirm the GitHub Actions lint workflow installs pnpm deterministically and runs `pnpm lint`.
17. Report failures fixed or known gaps.

## References

- See `reference.md` for starter file contents and required ESLint, Lefthook, Commitlint, gitignore, and GitHub Actions templates.
