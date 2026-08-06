/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { RJSFSchema } from '@rjsf/utils';
import type { TemplateInputSchema } from 'morden-node-escpos/schema';

import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import { Textarea } from '@workspace/ui/components/ui/textarea';

import { parseSampleData } from '../../lib/print-job';

interface SampleDataFormProps {
  schema: TemplateInputSchema
  value: string
  onChange: (value: string) => void
}

export default function SampleDataForm({ schema, value, onChange }: SampleDataFormProps) {
  const parsed = parseSampleData(value);
  const hasProperties = Object.keys(schema.properties ?? {}).length > 0;

  if (!hasProperties) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          请先点击顶部「输入 Schema」定义字段，再使用表单填写示例数据。
        </p>
        <RawJsonEditor value={value} error={parsed.error} onChange={onChange} open />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {parsed.data
        ? (
            <Form
              schema={schema as RJSFSchema}
              validator={validator}
              formData={parsed.data}
              showErrorList={false}
              onChange={({ formData }) => onChange(JSON.stringify(formData ?? {}, null, 2))}
            >
              <></>
            </Form>
          )
        : (
            <p className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-xs text-destructive">
              示例 JSON 无法解析，请先在下方修复。
            </p>
          )}
      <RawJsonEditor value={value} error={parsed.error} onChange={onChange} />
    </div>
  );
}

function RawJsonEditor({
  value,
  error,
  onChange,
  open = false,
}: {
  value: string
  error?: string | undefined
  onChange: (value: string) => void
  open?: boolean
}) {
  return (
    <details open={open} className="rounded-lg border bg-muted/20">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium">原始 JSON</summary>
      <div className="space-y-2 border-t p-3">
        <Textarea
          className="min-h-40 resize-y font-mono text-xs"
          spellCheck={false}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={event => onChange(event.target.value)}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </details>
  );
}
