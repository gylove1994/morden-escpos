/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintCommandUnion, PrintJobJSON, TemplateInputSchema } from 'morden-node-escpos/schema';

export type PaperWidth = 58 | 80;
export type CutMode = 'full' | 'partial' | 'none';
export const CUT_COMPONENT_ID = 'document-cut';

export interface ContentFormat {
  align: 'LT' | 'CT' | 'RT'
  style: Extract<PrintCommandUnion, { type: 'style' }>['value']
  width: number
  height: number
}

export interface RichTextLeaf {
  [key: string]: unknown
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  width?: number
  height?: number
}

export interface RichTextParagraph {
  [key: string]: unknown
  type: 'p'
  children: RichTextLeaf[]
}

export type RichTextValue = RichTextParagraph[];

export interface EditorCommand {
  id: string
  command: PrintCommandUnion
  format?: ContentFormat
  richValue?: RichTextValue
}

export interface EditorDocument {
  name: string
  description: string
  paperWidth: PaperWidth
  encoding: string
  model: 'qsprinter' | null
  cutMode: CutMode
  commands: EditorCommand[]
  inputSchema: TemplateInputSchema
  sampleDataText: string
}

export interface DocumentSnapshot {
  document: EditorDocument
  selectedIds: string[]
}

export interface ImportResult {
  document?: EditorDocument
  errors: UserMessage[]
}

export interface ValidationResult {
  job?: PrintJobJSON
  errors: UserMessage[]
}

export interface UserMessage {
  key: string
  values?: Record<string, string | number>
}
