'use client';

import type { PrintCommandUnion } from 'morden-node-escpos/schema';
import type { ContentFormat, CutMode } from '../../lib/editor-types';

import { Button } from '@workspace/ui/components/ui/button';

import { Field, FieldDescription, FieldGroup, FieldLabel } from '@workspace/ui/components/ui/field';
import { Input } from '@workspace/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { Braces, Copy, MousePointerClick, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { extractDefinedPaths, isPathDefined } from 'morden-node-escpos/template-inputs';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { CUT_COMPONENT_ID } from '../../lib/editor-types';
import { extractVariables } from '../../lib/preview';
import { richTextFromPlainText } from '../../lib/rich-text';
import { TextRichEditor } from './text-rich-editor';
import { VariableTextEditor } from './variable-text-editor';

const SampleDataForm = dynamic(() => import('./sample-data-form'), {
  ssr: false,
  loading: () => <div className="grid min-h-32 place-items-center text-xs text-muted-foreground">正在加载数据表单…</div>,
});

const commandLabels: Record<string, string> = {
  text: '文本',
  pureText: '文本',
  print: '原始文本',
  newLine: '空行',
  align: '对齐',
  style: '字形',
  size: '字号',
  qrcode: '二维码',
  image: '图片',
  raster: '图片',
  drawLine: '分隔线',
  table: '等宽表格',
  tableCustom: '自定义表格',
  feed: '空行',
};

const STYLE_OPTIONS = [
  { value: 'NORMAL', label: '常规' },
  { value: 'B', label: '粗体' },
  { value: 'U', label: '下划线' },
  { value: 'BU', label: '粗体 + 下划线' },
  { value: 'I', label: '斜体' },
] as const;

function styleSelectValue(style: ContentFormat['style'] | undefined): string {
  if (style === undefined) {
    return 'INHERIT';
  }
  if (typeof style !== 'string') {
    return 'CUSTOM';
  }
  const normalized = style.toUpperCase();
  return STYLE_OPTIONS.some(option => option.value === normalized) ? normalized : 'CUSTOM';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function NumberInput({
  id,
  label,
  value,
  min = 1,
  max = 8,
  onChange,
}: {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={event => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))}
      />
    </Field>
  );
}

function ContentFormatFields({
  format,
  showAlign = false,
  showStyle = false,
  showSize = false,
  onChange,
}: {
  format: ContentFormat
  showAlign?: boolean
  showStyle?: boolean
  showSize?: boolean
  onChange: (patch: Partial<ContentFormat>) => void
}) {
  return (
    <FieldGroup>
      {showAlign
        ? (
            <Field>
              <FieldLabel>对齐方式</FieldLabel>
              <Select value={format.align} onValueChange={align => onChange({ align: align as ContentFormat['align'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LT">左对齐</SelectItem>
                  <SelectItem value="CT">居中对齐</SelectItem>
                  <SelectItem value="RT">右对齐</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )
        : null}
      {showStyle
        ? (
            <Field>
              <FieldLabel>字形</FieldLabel>
              <Select
                value={styleSelectValue(format.style)}
                onValueChange={style =>
                  style !== 'CUSTOM' && onChange({ style: style as ContentFormat['style'] })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" disabled>导入的自定义样式</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )
        : null}
      {showSize
        ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberInput id="content-size-width" label="宽度倍数" value={format.width} onChange={width => onChange({ width })} />
              <NumberInput id="content-size-height" label="高度倍数" value={format.height} onChange={height => onChange({ height })} />
            </div>
          )
        : null}
    </FieldGroup>
  );
}

function ElementProperties() {
  const document = useEditorStore(state => state.document);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const updateDocument = useEditorStore(state => state.updateDocument);
  const updateCommand = useEditorStore(state => state.updateCommand);
  const updateFormat = useEditorStore(state => state.updateFormat);
  const updateRichValue = useEditorStore(state => state.updateRichValue);
  const removeSelected = useEditorStore(state => state.removeSelected);
  const duplicateSelected = useEditorStore(state => state.duplicateSelected);
  const selected = document.commands.find(item => item.id === selectedIds[0]);

  if (selectedIds[0] === CUT_COMPONENT_ID) {
    return (
      <div className="space-y-5 p-4">
        <div>
          <p className="text-sm font-semibold">切纸</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">固定在小票末尾，不能删除、复制或排序。</p>
        </div>
        <SectionTitle>组件属性</SectionTitle>
        <Field>
          <FieldLabel>切纸方式</FieldLabel>
          <Select value={document.cutMode} onValueChange={cutMode => updateDocument({ cutMode: cutMode as CutMode })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">全切</SelectItem>
              <SelectItem value="partial">半切</SelectItem>
              <SelectItem value="none">不切</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/30 p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <MousePointerClick className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium">选择一个组件</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">点击画布中的内容，即可在这里调整属性。</p>
          </div>
        </div>
      </div>
    );
  }

  const command = selected.command;
  const patch = (values: Record<string, unknown>) => {
    updateCommand(selected.id, current => ({ ...current, ...values }) as PrintCommandUnion);
  };
  const patchFormat = (values: Partial<ContentFormat>) => updateFormat(selected.id, values);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{commandLabels[command.type] ?? command.type}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{command.type}</p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="复制所选组件" onClick={duplicateSelected}>
            <Copy aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="删除所选组件" onClick={removeSelected}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <SectionTitle>组件属性</SectionTitle>

      {command.type === 'text' || command.type === 'pureText'
        ? (
            <Field>
              <FieldLabel>文本内容</FieldLabel>
              <TextRichEditor
                contentKey={selected.id}
                value={selected.richValue ?? richTextFromPlainText(command.content, selected.format)}
                onChange={next => updateRichValue(selected.id, next)}
              />
              <FieldDescription>
                选中文字可设置行内字形和宽高倍数；支持形如
                {' {{key}} '}
                的变量。
              </FieldDescription>
            </Field>
          )
        : null}

      {command.type === 'print'
        ? (
            <Field>
              <FieldLabel htmlFor="command-content">文本内容</FieldLabel>
              <VariableTextEditor
                contentKey={selected.id}
                ariaLabel="文本内容"
                id="command-content"
                value={command.content}
                onChange={content => patch({ content })}
                multiline
              />
              <FieldDescription>
                支持形如
                {'{{key}}'}
                {' '}
                的变量。
              </FieldDescription>
            </Field>
          )
        : null}

      {selected.format && (command.type === 'text' || command.type === 'pureText')
        ? (
            <>
              <SectionTitle>内容排版</SectionTitle>
              <ContentFormatFields format={selected.format} showAlign onChange={patchFormat} />
            </>
          )
        : null}

      {selected.format && command.type === 'print'
        ? (
            <>
              <SectionTitle>内容排版</SectionTitle>
              <ContentFormatFields format={selected.format} showAlign showStyle showSize onChange={patchFormat} />
            </>
          )
        : null}

      {selected.format && (command.type === 'qrcode' || command.type === 'qrimage')
        ? (
            <>
              <SectionTitle>内容排版</SectionTitle>
              <ContentFormatFields format={selected.format} showAlign onChange={patchFormat} />
            </>
          )
        : null}

      {selected.format && (command.type === 'image' || command.type === 'raster')
        ? (
            <>
              <SectionTitle>内容排版</SectionTitle>
              <ContentFormatFields format={selected.format} showAlign onChange={patchFormat} />
            </>
          )
        : null}

      {selected.format && command.type === 'table'
        ? (
            <>
              <SectionTitle>内容排版</SectionTitle>
              <ContentFormatFields format={selected.format} showStyle showSize onChange={patchFormat} />
            </>
          )
        : null}

      {command.type === 'drawLine'
        ? (
            <Field>
              <FieldLabel htmlFor="line-character">填充字符</FieldLabel>
              <Input
                id="line-character"
                maxLength={1}
                value={command.character ?? '-'}
                onChange={event => patch({ character: event.target.value.slice(0, 1) || '-' })}
              />
            </Field>
          )
        : null}

      {command.type === 'qrcode'
        ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="qr-content">二维码内容</FieldLabel>
                <VariableTextEditor
                  contentKey={selected.id}
                  ariaLabel="二维码内容"
                  id="qr-content"
                  value={command.content}
                  onChange={content => patch({ content })}
                  multiline
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput id="qr-size" label="模块大小" value={command.size ?? 5} min={1} max={16} onChange={size => patch({ size })} />
                <Field>
                  <FieldLabel>容错级别</FieldLabel>
                  <Select value={(command.level ?? 'M').toUpperCase()} onValueChange={level => patch({ level })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['L', 'M', 'Q', 'H'].map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          )
        : null}

      {command.type === 'image' || command.type === 'raster'
        ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="image-url">图片 URL</FieldLabel>
                <VariableTextEditor
                  contentKey={selected.id}
                  ariaLabel="图片 URL"
                  id="image-url"
                  value={command.path}
                  onChange={path => patch({ path })}
                />
                <FieldDescription>
                  仅支持可公开访问的 http(s) 图片地址；可使用形如
                  {' {{logoUrl}} '}
                  的变量。
                </FieldDescription>
              </Field>
              {command.type === 'raster'
                ? (
                    <Field>
                      <FieldLabel>光栅模式</FieldLabel>
                      <Select value={(command.mode ?? 'normal').toLowerCase()} onValueChange={mode => patch({ mode })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">正常</SelectItem>
                          <SelectItem value="dw">双倍宽度</SelectItem>
                          <SelectItem value="dh">双倍高度</SelectItem>
                          <SelectItem value="dwdh">双倍宽高</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )
                : null}
            </FieldGroup>
          )
        : null}

      {command.type === 'table'
        ? (
            <FieldGroup>
              {command.data.map((cell, index) => (
                // ESC/POS table cells do not carry stable ids.
                // eslint-disable-next-line react/no-array-index-key
                <Field key={index}>
                  <FieldLabel htmlFor={`table-cell-${index}`}>
                    第
                    {index + 1}
                    {' '}
                    列
                  </FieldLabel>
                  <div className="flex gap-2">
                    <VariableTextEditor
                      contentKey={`${selected.id}-table-${index}`}
                      ariaLabel={`第 ${index + 1} 列`}
                      id={`table-cell-${index}`}
                      value={String(cell)}
                      onChange={(content) => {
                        const data = [...command.data];
                        data[index] = content;
                        patch({ data });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`删除第 ${index + 1} 列`}
                      onClick={() => patch({ data: command.data.filter((_, cellIndex) => cellIndex !== index) })}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </Field>
              ))}
              <Button type="button" variant="outline" onClick={() => patch({ data: [...command.data, '新列'] })}>
                <Plus aria-hidden="true" />
                添加列
              </Button>
            </FieldGroup>
          )
        : null}

      {command.type === 'tableCustom'
        ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="custom-table-each">循环数组</FieldLabel>
                <Input
                  id="custom-table-each"
                  placeholder="例如：items 或 order.lines"
                  value={command.each ?? ''}
                  onChange={(event) => {
                    const each = event.target.value.trim();
                    patch({ each: each || undefined });
                  }}
                />
                <FieldDescription>
                  填写数组路径后，每个数组元素渲染一行；列文本使用当前元素字段，如
                  {' '}
                  {'{{name}}'}
                  。
                </FieldDescription>
              </Field>
              <SectionTitle>表格排版</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  id="custom-table-size-width"
                  label="宽度倍数"
                  value={command.options?.size[0] ?? 1}
                  onChange={(width) => {
                    const currentSize = command.options?.size ?? [1, 1];
                    patch({
                      options: {
                        ...command.options,
                        encoding: command.options?.encoding ?? document.encoding,
                        size: [width, currentSize[1]],
                      },
                    });
                  }}
                />
                <NumberInput
                  id="custom-table-size-height"
                  label="高度倍数"
                  value={command.options?.size[1] ?? 1}
                  onChange={(height) => {
                    const currentSize = command.options?.size ?? [1, 1];
                    patch({
                      options: {
                        ...command.options,
                        encoding: command.options?.encoding ?? document.encoding,
                        size: [currentSize[0], height],
                      },
                    });
                  }}
                />
              </div>
              {command.data.map((column, index) => (
                // ESC/POS custom table columns do not carry stable ids.
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      第
                      {index + 1}
                      {' '}
                      列
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`删除第 ${index + 1} 列`}
                      onClick={() => patch({ data: command.data.filter((_, columnIndex) => columnIndex !== index) })}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <VariableTextEditor
                    contentKey={`${selected.id}-custom-table-${index}`}
                    ariaLabel={`第 ${index + 1} 列文本`}
                    id={`custom-table-text-${index}`}
                    value={column.text}
                    scopePath={command.each}
                    onChange={(content) => {
                      const data = command.data.map((item, columnIndex) =>
                        columnIndex === index ? { ...item, text: content } : item,
                      );
                      patch({ data });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field>
                      <FieldLabel htmlFor={`custom-table-width-${index}`}>列宽</FieldLabel>
                      <Input
                        id={`custom-table-width-${index}`}
                        type="number"
                        min={1}
                        value={'cols' in column ? column.cols : column.width}
                        onChange={(event) => {
                          const data = command.data.map((item, columnIndex) =>
                            columnIndex === index ? { ...item, cols: Math.max(1, Number(event.target.value) || 1) } : item,
                          );
                          patch({ data });
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>对齐方式</FieldLabel>
                      <Select
                        value={(column.align ?? 'LEFT').toUpperCase()}
                        onValueChange={(align) => {
                          const data = command.data.map((item, columnIndex) =>
                            columnIndex === index ? { ...item, align } : item,
                          );
                          patch({ data });
                        }}
                      >
                        <SelectTrigger className="w-full" aria-label={`第 ${index + 1} 列对齐方式`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEFT">左对齐</SelectItem>
                          <SelectItem value="CENTER">居中对齐</SelectItem>
                          <SelectItem value="RIGHT">右对齐</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>字形</FieldLabel>
                    <Select
                      value={styleSelectValue(column.style)}
                      onValueChange={(style) => {
                        if (style === 'CUSTOM') {
                          return;
                        }
                        const data = command.data.map((item, columnIndex) =>
                          columnIndex === index
                            ? { ...item, style: style === 'INHERIT' ? undefined : style }
                            : item,
                        );
                        patch({ data });
                      }}
                    >
                      <SelectTrigger className="w-full" aria-label={`第 ${index + 1} 列字形`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INHERIT">继承整体字形</SelectItem>
                        {STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                        <SelectItem value="CUSTOM" disabled>导入的自定义样式</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => patch({ data: [...command.data, {
                  text: '新列',
                  cols: 8,
                  align: 'LEFT',
                  style: 'NORMAL',
                }] })}
              >
                <Plus aria-hidden="true" />
                添加列
              </Button>
            </FieldGroup>
          )
        : null}

      {command.type === 'feed'
        ? <NumberInput id="feed-lines" label="行数" value={command.lines ?? 1} min={1} max={20} onChange={lines => patch({ lines })} />
        : null}

      {!commandLabels[command.type]
        ? <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">此高级命令可保留并排序，但首版不提供属性表单。</p>
        : null}
    </div>
  );
}

function DataProperties() {
  const document = useEditorStore(state => state.document);
  const updateDocument = useEditorStore(state => state.updateDocument);
  const variables = extractVariables(document);
  const definedPaths = extractDefinedPaths(document.inputSchema);
  const usablePaths = new Set(definedPaths);
  for (const path of definedPaths) {
    const itemSeparator = path.indexOf('.*.');
    if (itemSeparator >= 0) {
      usablePaths.add(path.slice(itemSeparator + 3));
    }
  }
  const unusedPaths = [...definedPaths]
    .filter(path => !path.includes('*') && !variables.includes(path))
    .toSorted();

  return (
    <div className="h-full min-h-0 space-y-6 overflow-y-auto p-4">
      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold">示例数据</h3>
          <p className="mt-1 text-xs text-muted-foreground">表单由顶部「输入 Schema」生成，只用于变量替换和实时预览。</p>
        </div>
        <SampleDataForm
          schema={document.inputSchema}
          value={document.sampleDataText}
          onChange={sampleDataText => updateDocument({ sampleDataText })}
        />
      </section>

      <section className="border-t pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold">模板变量</h3>
          <span className="text-[10px] text-muted-foreground">蓝色已定义 · 红色未定义</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {variables.length > 0
            ? variables.map(variable => (
                <button
                  key={variable}
                  type="button"
                  className={isPathDefined(variable, usablePaths)
                    ? 'rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[10px] text-blue-700 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                    : 'rounded-md border border-red-200 bg-red-50 px-2 py-1 font-mono text-[10px] text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'}
                  title="点击复制变量"
                  onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                >
                  {`{{${variable}}}`}
                </button>
              ))
            : <p className="text-xs text-muted-foreground">模板中还没有变量。</p>}
        </div>
        {unusedPaths.length > 0
          ? (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-medium text-muted-foreground">已定义但未使用</p>
                <div className="flex flex-wrap gap-2">
                  {unusedPaths.map(path => (
                    <button
                      key={path}
                      type="button"
                      className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      title="点击复制变量"
                      onClick={() => navigator.clipboard.writeText(`{{${path}}}`)}
                    >
                      {`{{${path}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )
          : null}
      </section>
    </div>
  );
}

export function PropertyPanel() {
  const [panelTab, setPanelTab] = useState('element');
  const isReadOnly = useEditorStore(state => state.viewMode === 'printPreview');

  useEffect(() => useEditorStore.subscribe((state, previousState) => {
    if (state.selectedIds !== previousState.selectedIds && state.selectedIds.length > 0) {
      setPanelTab('element');
    }
  }), []);

  if (isReadOnly) {
    return (
      <aside className="flex h-full flex-col bg-background" aria-label="属性面板">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">属性与数据</h2>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center p-4">
          <div className="max-w-64 rounded-lg border border-dashed bg-muted/30 p-4 text-center">
            <SlidersHorizontal className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">预览模式只读</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              切换回模版编辑后可调整组件属性和预览数据。
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col bg-background" aria-label="属性面板">
      <Tabs value={panelTab} onValueChange={setPanelTab} className="min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b px-3 py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="element"
              className={panelTab === 'element'
                ? 'bg-primary! font-semibold text-primary-foreground! shadow-sm hover:text-primary-foreground!'
                : 'hover:bg-background/70'}
            >
              <SlidersHorizontal aria-hidden="true" />
              组件
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className={panelTab === 'data'
                ? 'bg-primary! font-semibold text-primary-foreground! shadow-sm hover:text-primary-foreground!'
                : 'hover:bg-background/70'}
            >
              <Braces aria-hidden="true" />
              数据
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="element" className="min-h-0 flex-1 overflow-y-auto">
          <ElementProperties />
        </TabsContent>
        <TabsContent value="data" className="min-h-0 flex-1 overflow-hidden">
          <DataProperties />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
