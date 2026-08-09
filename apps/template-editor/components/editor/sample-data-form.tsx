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
import { useTranslations } from 'next-intl';

import { parseSampleData } from '../../lib/print-job';

interface SampleDataFormProps {
  schema: TemplateInputSchema
  value: string
  onChange: (value: string) => void
}

export default function SampleDataForm({ schema, value, onChange }: SampleDataFormProps) {
  const t = useTranslations('SampleData');
  const errors = useTranslations('Errors');
  const parsed = parseSampleData(value);
  const error = parsed.errorKey ? errors(parsed.errorKey) : undefined;
  const hasProperties = Object.keys(schema.properties ?? {}).length > 0;

  if (!hasProperties) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          {t('defineSchema')}
        </p>
        <RawJsonEditor value={value} error={error} onChange={onChange} open />
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
              {t('invalidJson')}
            </p>
          )}
      <RawJsonEditor value={value} error={error} onChange={onChange} />
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
  const t = useTranslations('SampleData');
  return (
    <details open={open} className="rounded-lg border bg-muted/20">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium">{t('rawJson')}</summary>
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
