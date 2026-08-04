import type { FC } from 'react';
import type { Translation } from '../../i18n/translation-keys';
import type { SchemaBuilderRegistry } from '../../registry/types';
import type { JsonSchema } from '../../types/jsonSchema';
import { Button } from '@workspace/ui/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/ui/resizable';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';
import { Loader2, Maximize2 } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useControllableSchema } from '../../hooks/use-controllable-schema';
import { useTranslation } from '../../hooks/use-translation';
import { SchemaBuilderProvider } from '../../i18n/schema-builder-config';
import { cn } from '../../lib/utils';
import { SchemaBuilderRegistryProvider } from '../../registry/SchemaBuilderRegistryContext';
import SchemaFieldsEditor from './SchemaFieldsEditor';

const SchemaJsonEditor = lazy(() => import('./SchemaJsonEditor'));

function JsonEditorFallback({ label }: { label: string }) {
  return (
    <div className="grid h-full min-h-48 place-items-center bg-muted/20 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

/** @public */
export interface SchemaBuilderProps {
  value?: JsonSchema
  defaultValue?: JsonSchema
  onChange?: (schema: JsonSchema) => void
  readOnly?: boolean
  className?: string
  autoFocus?: boolean
  locale?: Translation
  messages?: Partial<Translation>
  registry?: SchemaBuilderRegistry
  layout?: 'fixed' | 'fill'
  showFullscreenToggle?: boolean
  initialLeftPanelWidth?: number
}

/** @public */
const SchemaBuilder: FC<SchemaBuilderProps> = ({
  value,
  defaultValue,
  onChange,
  readOnly = false,
  className,
  autoFocus = true,
  locale,
  messages,
  registry,
  layout = 'fixed',
  showFullscreenToggle = true,
  initialLeftPanelWidth = 50,
}) => {
  const [schema, setSchema] = useControllableSchema({
    value,
    defaultValue,
    onChange,
  });

  return (
    <SchemaBuilderProvider locale={locale} messages={messages}>
      <SchemaBuilderRegistryProvider value={registry}>
        <SchemaBuilderContent
          value={schema}
          onChange={setSchema}
          readOnly={readOnly}
          className={className}
          autoFocus={autoFocus}
          layout={layout}
          showFullscreenToggle={showFullscreenToggle}
          initialLeftPanelWidth={initialLeftPanelWidth}
        />
      </SchemaBuilderRegistryProvider>
    </SchemaBuilderProvider>
  );
};

interface SchemaBuilderContentProps {
  value: JsonSchema
  onChange: (schema: JsonSchema) => void
  readOnly?: boolean
  className?: string
  autoFocus?: boolean
  layout: 'fixed' | 'fill'
  showFullscreenToggle: boolean
  initialLeftPanelWidth: number
}

const SchemaBuilderContent: FC<SchemaBuilderContentProps> = ({
  value,
  onChange,
  readOnly = false,
  className,
  autoFocus = true,
  layout,
  showFullscreenToggle,
  initialLeftPanelWidth,
}) => {
  const t = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMode, setMobileMode] = useState<'visual' | 'json'>('visual');
  const toggleFullscreen = () => setIsFullscreen(current => !current);

  const fullscreenClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-background'
    : '';

  return (
    <div
      className={cn(
        'json-editor-container w-full overflow-hidden rounded-xl border bg-background shadow-xs',
        layout === 'fill' && 'h-full min-h-0',
        fullscreenClass,
        className,
        'jsonjoy',
      )}
    >
      <div className={cn('block w-full md:hidden', layout === 'fill' && 'h-full min-h-0')}>
        <div className="flex items-center justify-between px-4 py-3 border-b w-full">
          <h3 className="font-medium">{t.schemaEditorTitle}</h3>
          <div className="flex items-center gap-2">
            {showFullscreenToggle
              ? (
                  <Button type="button" variant="ghost" size="icon" onClick={toggleFullscreen} aria-label={t.schemaEditorToggleFullscreen}>
                    <Maximize2 size={16} />
                  </Button>
                )
              : null}
            <Tabs value={mobileMode} onValueChange={value => setMobileMode(value as 'visual' | 'json')}>
              <TabsList>
                <TabsTrigger value="visual">{t.schemaEditorEditModeVisual}</TabsTrigger>
                <TabsTrigger value="json">{t.schemaEditorEditModeJson}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div
          className={cn(
            'focus:outline-hidden w-full',
            isFullscreen ? 'h-screen' : layout === 'fill' ? 'h-[calc(100%-65px)] min-h-0' : 'h-125',
          )}
        >
          {mobileMode === 'visual'
            ? (
                <SchemaFieldsEditor
                  readOnly={readOnly}
                  value={value}
                  onChange={onChange}
                  autoFocus={autoFocus}
                />
              )
            : (
                <Suspense fallback={<JsonEditorFallback label={t.schemaEditorLoading} />}>
                  <SchemaJsonEditor
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                  />
                </Suspense>
              )}
        </div>
      </div>

      {/* For large screens - show side by side */}
      <div
        className={cn(
          'hidden w-full md:flex md:flex-col',
          isFullscreen ? 'h-screen' : layout === 'fill' ? 'h-full min-h-0' : 'h-150',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b w-full shrink-0">
          <h3 className="font-medium">{t.schemaEditorTitle}</h3>
          {showFullscreenToggle
            ? (
                <Button type="button" variant="ghost" size="icon" onClick={toggleFullscreen} aria-label={t.schemaEditorToggleFullscreen}>
                  <Maximize2 size={16} />
                </Button>
              )
            : null}
        </div>
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 grow">
          <ResizablePanel defaultSize={initialLeftPanelWidth} minSize={20}>
            <SchemaFieldsEditor
              readOnly={readOnly}
              value={value}
              onChange={onChange}
              autoFocus={autoFocus}
            />
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize panels" />
          <ResizablePanel defaultSize={100 - initialLeftPanelWidth} minSize={20}>
            <Suspense fallback={<JsonEditorFallback label={t.schemaEditorLoading} />}>
              <SchemaJsonEditor
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                autoFocus={autoFocus}
              />
            </Suspense>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default SchemaBuilder;
