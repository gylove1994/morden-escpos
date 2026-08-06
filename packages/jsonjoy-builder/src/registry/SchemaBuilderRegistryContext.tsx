/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { ReactNode } from 'react';
import type {
  SchemaBuilderComponents,
  SchemaBuilderRegistry,
  SchemaBuilderSlots,
} from './types';
import { createContext, useContext, useMemo } from 'react';
import { defaultComponents, defaultRegistry, defaultSlots } from './defaults';
import { mergeRegistry } from './mergeRegistry';

// ── Context ──────────────────────────────────

const SchemaBuilderRegistryContext
  = createContext<SchemaBuilderRegistry>(defaultRegistry);

// ── Provider ─────────────────────────────────

/**
 * Provides a registry of UI components and layout slots to the editor tree.
 * Registries nest: each provider merges its `value` on top of the nearest
 * parent registry, so you only need to override the parts you care about.
 *
 * @example
 * ```tsx
 * <SchemaBuilderRegistryProvider value={{ components: { Button: MyButton, Input: MyInput } }}>
 *   <SchemaBuilder schema={schema} onChange={onChange} />
 * </SchemaBuilderRegistryProvider>
 * ```
 *
 * @public
 */
export function SchemaBuilderRegistryProvider({
  value,
  children,
}: {
  value?: SchemaBuilderRegistry
  children: ReactNode
}) {
  const parent = useContext(SchemaBuilderRegistryContext);
  const merged = useMemo(() => mergeRegistry(parent, value), [parent, value]);
  return (
    <SchemaBuilderRegistryContext value={merged}>
      {children}
    </SchemaBuilderRegistryContext>
  );
}

// ── Hooks ────────────────────────────────────

/** Read the current registry tree. */
export function useRegistry(): SchemaBuilderRegistry {
  return useContext(SchemaBuilderRegistryContext);
}

/** Get a single component from the registry. Falls back to the default. */
export function useComponent<K extends keyof SchemaBuilderComponents>(
  name: K,
): SchemaBuilderComponents[K] {
  const reg = useContext(SchemaBuilderRegistryContext);
  const overridden = reg.components?.[name];
  if (overridden)
    return overridden as SchemaBuilderComponents[K];
  return defaultComponents[name];
}

/** Get a single slot from the registry. Falls back to the default. */
export function useSlot<K extends keyof SchemaBuilderSlots>(
  name: K,
): SchemaBuilderSlots[K] {
  const reg = useContext(SchemaBuilderRegistryContext);
  const overridden = reg.slots?.[name];
  if (overridden)
    return overridden as SchemaBuilderSlots[K];
  return defaultSlots[name];
}

/** Get slotProps for a given slot name. Merges defaults with user-provided props. */
export function useSlotProps(
  slotName: keyof SchemaBuilderSlots,
): Record<string, unknown> {
  const reg = useContext(SchemaBuilderRegistryContext);
  return reg.slotProps?.[slotName] ?? {};
}
