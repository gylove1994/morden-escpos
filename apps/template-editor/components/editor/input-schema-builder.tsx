'use client';

import type { JsonSchema } from '@workspace/jsonjoy-builder';
import type { TemplateInputSchema } from 'morden-node-escpos/schema';
import type { ComponentProps } from 'react';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const SchemaBuilder = dynamic(
  () => import('@workspace/jsonjoy-builder').then(module =>
    function LocalizedSchemaBuilder(props: ComponentProps<typeof module.SchemaBuilder>) {
      return <module.SchemaBuilder {...props} locale={module.zh} />;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-64 place-items-center bg-muted/20 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>正在加载 Schema 编辑器…</span>
        </div>
      </div>
    ),
  },
);

const InferSchemaDialog = dynamic(
  () => import('@workspace/jsonjoy-builder').then(module =>
    function LocalizedInferSchemaDialog(props: ComponentProps<typeof module.InferSchemaDialog>) {
      return (
        <module.SchemaBuilderProvider locale={module.zh}>
          <module.InferSchemaDialog {...props} />
        </module.SchemaBuilderProvider>
      );
    }),
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
  const [inferOpen, setInferOpen] = useState(false);

  return (
    <div className={fill ? 'jsonjoy flex h-full min-h-0 flex-col gap-3' : 'jsonjoy space-y-2'}>
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setInferOpen(true)}>
          从 JSON 推断
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
          onChange={schema => onChange(asInputSchema(schema))}
        />
      </div>
      <InferSchemaDialog
        open={inferOpen}
        onOpenChange={setInferOpen}
        onInfer={schema => onChange(asInputSchema(schema))}
      />
    </div>
  );
}
