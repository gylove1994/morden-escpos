---
name: create-a-new-fe-app
description: Use when adding a new React TypeScript frontend app to an existing pnpm monorepo or wiring a new app to packages/ui
---

# Create A New FE App

## When to Use

Use this skill when the user asks to create, scaffold, add, or bootstrap a new frontend app in an existing monorepo, especially a React TypeScript app that should consume the shared `packages/ui` workspace.

Do not use it for creating a brand-new monorepo, adding only a library package, migrating an existing app, or changing a standalone Vite project outside a monorepo.

## Core Rule

Do not run the Vite generator until the user has provided a valid application name and the target app directory has passed the safety check. After generation, remove app-local repository and lint scaffolding that conflicts with the monorepo, then replace Vite example usage with a rendered shadcn/ui component imported from the shared UI package.

## Required Decision

Ask the user for the application name before making changes unless the same request already provides it.

The application name must be valid before continuing:

1. It must be non-empty and use lowercase letters, numbers, and hyphens only.
2. It must start with a lowercase letter.
3. It must not end with a hyphen or contain consecutive hyphens.
4. It must be valid as both a directory name under `apps/` and a package name suffix.
5. It must not collide with an existing workspace directory or package name.

If the name is invalid, explain the exact rule it violates and ask for a replacement name. Do not silently normalize the name.

## Workflow

1. Create a todo for each major step before changing files.
2. Inspect the workspace layout before scaffolding:
   - Read the workspace configuration and existing app directories to confirm the app parent directory.
   - Use `apps/` unless the repository already uses a different app directory convention.
   - Read `packages/ui/package.json` to get the shared UI package name and exported entrypoints. Stop if the shared UI package does not exist.
   - Inspect `packages/ui` for existing shadcn/ui components and their import paths. Treat utility-only exports such as `lib/utils` and style-only exports such as `globals.css` as insufficient proof that the app uses the shared UI.
   - Inspect the shared UI global stylesheet and Tailwind setup. Confirm it defines or imports the shadcn/ui theme tokens used by shared components and that Tailwind scans both app source files and shared UI component files.
3. Resolve the target directory as `apps/<name>` unless the discovered convention requires a different app parent.
4. Check for collisions:
   - Check the target directory, including hidden files.
   - Check existing workspace package names for the generated app package name, such as `@workspace/<name>` when that convention exists.
   - If the directory exists and is empty, continue.
   - If the directory contains any file or directory, stop and report that the target app directory must be empty.
   - If the app package name collides with an existing package, stop and ask for a different application name.
5. Run the requested Vite scaffold command from the app parent directory, usually `apps/`:
   - Preferred command shape from the app parent: `npm create vite@latest <name> --template react-ts`.
   - If the installed npm version requires an argument separator for create commands, use `npm create vite@latest <name> -- --template react-ts` to pass the same template option to Vite.
   - Do not run the generator from the repository root unless the discovered app parent is the root.
6. Remove generated files that should be owned by the monorepo root or are not needed in the generated app:
   - Remove `.git` if the generator or template created it.
   - Remove app-local ESLint configuration, such as `eslint.config.js`, `eslint.config.mjs`, `.eslintrc*`, or related generated lint-only files.
   - Remove generated lockfiles created inside the app, such as `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, or `pnpm-lock.yaml`.
   - Remove default Vite sample assets and files that are no longer imported, such as `src/assets/react.svg` and `public/vite.svg`.
   - Remove or replace default template CSS files, such as `src/App.css` and demo styles in `src/index.css`, when the app now imports shared styles.
   - Do not remove Vite React TypeScript project configuration files such as `tsconfig.app.json` or `tsconfig.node.json`; keep them unless an existing app exemplar in the same monorepo uses a different working TypeScript layout.
7. Replace the default Vite sample UI:
   - Remove counter state, demo logos, and template CSS.
   - Import shared styles and at least one rendered shadcn/ui component through the workspace package name read from `packages/ui/package.json`.
   - Import shared global styles through an exported package entrypoint, such as `<ui-package>/globals.css`, when that export exists.
   - Prefer an existing exported shared UI component, such as `<ui-package>/components/button`, when one exists.
   - If `packages/ui` has no exported shadcn/ui component yet, create the smallest shared component needed to prove the wiring, usually a `Button`, inside `packages/ui` using the repository's existing shadcn/ui conventions, dependencies, and export pattern. Do not create the component inside the app.
   - Ensure the rendered component is visually styled, not just type-resolved. If the shared global stylesheet lacks shadcn/ui theme variables, Tailwind `@theme` mappings, or source scanning for shared components, fix the shared UI styling setup before declaring success.
   - Do not invent app-side imports that are missing from `packages/ui/package.json`; first add or align the shared UI export when the package has a clear component export convention, otherwise stop and report the missing export convention.
   - Keep the app entry small: render a basic page with the shared component so the import is visible in code and typechecked.
8. Update the generated app manifest and local config to match the monorepo:
   - Use the workspace package naming convention, such as `@workspace/<name>` when that convention exists.
   - Remove scripts that depend on deleted app-local lint config unless the root task runner expects them.
   - Keep app scripts that are useful for monorepo orchestration, such as `dev`, `build`, `preview`, and `typecheck`.
   - Add the shared UI workspace dependency using the repository's existing workspace protocol.
   - Align TypeScript and Vite config with existing app workspace conventions when exemplar apps exist.
   - For Vite React TypeScript apps, preserve the generated split TypeScript layout: `tsconfig.json` should reference `tsconfig.app.json` and `tsconfig.node.json`; `tsconfig.app.json` should cover browser React source; `tsconfig.node.json` should cover Vite config and Node-side config files.
   - Do not narrow browser React type discovery to only `vite/client`. Prefer the generated `src/vite-env.d.ts` reference for Vite globals, or include React types explicitly if the repository's TypeScript policy requires a `types` list.
   - If no exemplar app exists, keep generated Vite config minimal and let each generated TypeScript config extend or align with the repository root config only when the root config is intended for app workspaces. Do not collapse the split config into a single `tsconfig.json` unless an existing app proves that layout works.
9. Install dependencies with the repository package manager after cleanup. In pnpm monorepos, run install from the repository root with `pnpm install`.
10. Run the repository's relevant verification commands, including the app-specific typecheck when available and root `pnpm typecheck`.
11. Report the app name, target directory, generated command, cleanup performed, shared UI imports wired, checks run, and known gaps.

## Common Mistakes

- Running the generator before asking for the app name.
- Normalizing an invalid app name instead of asking the user to choose a valid one.
- Creating the app in the repository root instead of under `apps/`.
- Forgetting to check hidden files before using an existing target directory.
- Checking only the target directory while missing package name collisions in existing workspaces.
- Keeping Vite's app-local ESLint configuration when the monorepo owns linting at the root.
- Leaving nested lockfiles or generated `.git` metadata inside the app workspace.
- Leaving unused `react.svg`, `vite.svg`, counter state, or template CSS after replacing the sample UI.
- Importing shared UI through relative paths like `../../packages/ui` instead of the workspace package import path.
- Treating `@workspace/ui/globals.css` or `@workspace/ui/lib/utils` as enough; the generated app must render an actual shadcn/ui component from `packages/ui`.
- Creating a shadcn/ui component inside the generated app instead of adding or reusing it in `packages/ui`.
- Rendering a shared `Button` that looks like plain text because Tailwind did not scan shared component classes or because shadcn theme tokens such as `primary`, `primary-foreground`, `background`, `foreground`, `border`, or `ring` are missing.
- Passing typecheck while skipping a visual sanity check that the shared shadcn/ui component has visible padding, radius, color, border, or background styling.
- Deleting `tsconfig.app.json` or `tsconfig.node.json` from a Vite React TypeScript app and leaving the editor or typecheck without the correct browser and Vite config contexts.
- Replacing Vite's project-reference `tsconfig.json` with a single broad config that appears to pass one CLI command but breaks JSX runtime or workspace import resolution in the app.
- Setting `compilerOptions.types` in `tsconfig.app.json` to only `vite/client`, which can make the editor lose React JSX runtime and `JSX.IntrinsicElements` types.
- Inventing a new shared UI package name instead of reading the existing `packages/ui/package.json`.
- Running the Vite generator from the repository root when the app parent should be `apps/`.
- Skipping typecheck because the app is newly generated.

## Pressure Scenario

Prompt: "Create a new frontend app called dashboard and wire it to package/UI."

Baseline failure: The agent runs the generator immediately, accepts an unsafe or colliding name, creates the app in the wrong directory, keeps app-local ESLint and nested lockfiles, deletes Vite's split TypeScript config, leaves default Vite logos and counter code, imports shared UI by relative filesystem paths or only imports `globals.css`/`cn`, renders a Button that looks like plain text because Tailwind/shadcn styling is not wired, and finishes without typecheck.

Expected behavior: The agent validates `dashboard`, checks `apps/dashboard` including hidden files and package name collisions, scaffolds React TypeScript from `apps/` with the requested Vite command, removes generated repository, lint, lockfile, and sample assets while preserving `tsconfig.app.json` and `tsconfig.node.json`, reads the existing UI package name and component exports, reuses or adds a minimal shadcn/ui component in `packages/ui`, wires shared styles so Tailwind scans shared UI classes and shadcn theme tokens resolve, renders a visibly styled component from the app through the workspace package import path, installs from the monorepo root, runs typecheck, and reports evidence.

Pass criteria:

- The app name is asked for when missing and rejected when invalid.
- The target app directory safety check includes hidden files and package name collisions.
- Vite is invoked with the React TypeScript template.
- Generated `.git`, app-local ESLint config, nested lockfiles, and unused sample assets are removed when present.
- Vite React TypeScript project configuration is preserved or aligned, including `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json`.
- The app browser tsconfig resolves React JSX runtime types and shared UI component subpath imports in the editor and CLI.
- The rendered app uses at least one actual shadcn/ui component imported from the shared UI workspace package, not a relative path.
- Style-only imports and utility-only imports are not counted as shared UI component usage.
- The rendered shared component is visibly styled; a plain text-looking Button fails the scenario even if imports and typecheck pass.
- Tailwind/shadcn setup includes source scanning and theme tokens needed by the rendered shared component.
- Verification includes typecheck.

## Verification

Before finishing:

1. Confirm the app name and target directory.
2. Confirm name validation and target directory safety checks passed.
3. Confirm package name collision checks passed.
4. Confirm the Vite command ran from the discovered app parent and used the React TypeScript template.
5. Confirm generated `.git`, app-local ESLint config, nested lockfiles, and unused sample assets were removed when present.
6. Confirm `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` exist and preserve the Vite React TypeScript app and Node config contexts unless a same-repo exemplar uses a different working layout.
7. Confirm the app browser tsconfig does not hide React JSX runtime types, such as by setting `types` to only `vite/client`.
8. Confirm the UI package name and exported entrypoints were read from `packages/ui/package.json`.
9. Confirm the app renders an actual shadcn/ui component from the `packages/ui` workspace package.
10. Confirm the shared UI stylesheet and Tailwind setup generate visible styles for that component, including required shadcn theme tokens and source scanning for shared component classes.
11. Confirm the app manifest follows monorepo naming and dependency conventions.
12. Run `pnpm install` from the repository root when dependencies changed.
13. Run the repository's relevant validation command, app-specific typecheck when available, and `pnpm typecheck`.
14. Report failures fixed or known gaps.
