/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
export {
  defaultComponents,
  defaultRegistry,
  defaultSlots,
} from './defaults';
export { mergeRegistry } from './mergeRegistry';
export {
  SchemaBuilderRegistryProvider,
  useComponent,
  useRegistry,
  useSlot,
  useSlotProps,
} from './SchemaBuilderRegistryContext';
export type {
  BadgeProps,
  // Component adapters
  ButtonProps,
  ButtonToggleProps,
  FieldActionsSlotProps,
  FieldBodySlotProps,
  FieldFrameSlotProps,
  FieldHeaderSlotProps,
  FieldMainSlotProps,
  FullscreenToggleSlotProps,
  InputProps,
  LabelProps,
  MobileMode,
  MobileModeSwitchSlotProps,
  SchemaBuilderComponents,
  // Root
  SchemaBuilderRegistry,
  SchemaBuilderSlotProps,
  SchemaBuilderSlots,
  SchemaDialogProps,
  // Slots
  SlotChildrenProps,
  SwitchProps,
} from './types';
