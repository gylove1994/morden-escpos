// exports for public API

import type { InferSchemaDialogProps } from './components/features/InferSchemaDialog';
import type { ValidateJsonDialogProps } from './components/features/ValidateJsonDialog';
import type { SchemaBuilderProps } from './components/SchemaEditor/SchemaBuilder';
import type { SchemaFieldsEditorProps } from './components/SchemaEditor/SchemaFieldsEditor';
import type { SchemaJsonEditorProps } from './components/SchemaEditor/SchemaJsonEditor';
import {
  InferSchemaDialog,

} from './components/features/InferSchemaDialog';
import {
  ValidateJsonDialog,

} from './components/features/ValidateJsonDialog';
import SchemaBuilder from './components/SchemaEditor/SchemaBuilder';
import SchemaFieldsEditor from './components/SchemaEditor/SchemaFieldsEditor';
import SchemaJsonEditor from './components/SchemaEditor/SchemaJsonEditor';

export { de } from './i18n/locales/de';
export { en } from './i18n/locales/en';
export { es } from './i18n/locales/es';
export { fr } from './i18n/locales/fr';
export { pl } from './i18n/locales/pl';
export { ru } from './i18n/locales/ru';
export { uk } from './i18n/locales/uk';
export { zh } from './i18n/locales/zh';
export {
  SchemaBuilderProvider,
  useSchemaBuilderConfig,
} from './i18n/schema-builder-config';
export type { Translation } from './i18n/translation-keys';
export type {
  SchemaBuilderComponents,
  SchemaBuilderRegistry,
  SchemaBuilderSlots,
} from './registry/index';
export {
  mergeRegistry,
  SchemaBuilderRegistryProvider,
  useComponent,
  useRegistry,
  useSlot,
  useSlotProps,
} from './registry/index';
export type { JsonSchema } from './types/jsonSchema';
export {
  InferSchemaDialog,
  type InferSchemaDialogProps,
  SchemaBuilder,
  type SchemaBuilderProps,
  SchemaFieldsEditor,
  type SchemaFieldsEditorProps,
  SchemaJsonEditor,
  type SchemaJsonEditorProps,
  ValidateJsonDialog,
  type ValidateJsonDialogProps,
};
