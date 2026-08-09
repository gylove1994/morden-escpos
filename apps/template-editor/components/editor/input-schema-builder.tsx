/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { JsonSchema } from '@workspace/jsonjoy-builder';
import type { Translation } from '@workspace/jsonjoy-builder/locales';
import type { TemplateInputSchema } from 'morden-node-escpos/schema';

import { Button } from '@workspace/ui/components/ui/button';
import { useMessages, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const SchemaBuilder = dynamic(
  () => import('@workspace/jsonjoy-builder').then(module => module.SchemaBuilder),
  {
    ssr: false,
  },
);

const InferSchemaDialog = dynamic(
  () => import('@workspace/jsonjoy-builder').then(module => module.InferSchemaDialog),
  { ssr: false },
);

interface InputSchemaBuilderProps {
  value: TemplateInputSchema
  onChange: (schema: TemplateInputSchema) => void
  fill?: boolean
}

function asInputSchema(schema: JsonSchema): TemplateInputSchema {
  if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
    return schema as TemplateInputSchema;
  }
  return { type: 'object', properties: {} };
}

export function InputSchemaBuilder({ value, onChange, fill = false }: InputSchemaBuilderProps) {
  const messages = useMessages();
  const schemaBuilderMessages = messages.SchemaBuilder as unknown as Translation;
  const t = useTranslations('Schema');
  const [inferOpen, setInferOpen] = useState(false);

  return (
    <div className={fill ? 'jsonjoy flex h-full min-h-0 flex-col gap-3' : 'jsonjoy space-y-2'}>
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setInferOpen(true)}>
          {t('infer')}
        </Button>
      </div>
      <div className={fill
        ? 'min-h-0 flex-1 overflow-hidden rounded-lg border bg-background'
        : 'h-96 overflow-hidden rounded-lg border bg-background'}
      >
        <SchemaBuilder
          className="h-full"
          layout={fill ? 'fill' : 'fixed'}
          showFullscreenToggle={!fill}
          initialLeftPanelWidth={55}
          value={value as JsonSchema}
          messages={schemaBuilderMessages}
          onChange={schema => onChange(asInputSchema(schema))}
        />
      </div>
      <InferSchemaDialog
        open={inferOpen}
        messages={schemaBuilderMessages}
        onOpenChange={setInferOpen}
        onInfer={schema => onChange(asInputSchema(schema))}
      />
    </div>
  );
}
