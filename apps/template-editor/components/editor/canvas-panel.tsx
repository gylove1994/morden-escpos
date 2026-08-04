'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';

import { useEditorStore } from '../../lib/editor-store';
import { PrintPreview } from './print-preview';
import { ReceiptCanvas } from './receipt-canvas';

export function CanvasPanel() {
  const viewMode = useEditorStore(state => state.viewMode);
  const setViewMode = useEditorStore(state => state.setViewMode);
  const paperWidth = useEditorStore(state => state.document.paperWidth);
  const commandCount = useEditorStore(state => state.document.commands.length);

  return (
    <Tabs value={viewMode} onValueChange={value => setViewMode(value as typeof viewMode)} className="h-full min-h-0 w-full flex-col gap-0">
      <div className="flex h-10 shrink-0 items-center justify-between border-b bg-background/90 px-3">
        <TabsList className="h-8">
          <TabsTrigger value="edit" className="px-3 text-xs">模版编辑</TabsTrigger>
          <TabsTrigger value="printPreview" className="px-3 text-xs">打印预览</TabsTrigger>
        </TabsList>
        <span className="text-[11px] text-muted-foreground">
          {paperWidth}
          {' '}
          mm ·
          {' '}
          {commandCount}
          {' '}
          个命令
        </span>
      </div>
      <TabsContent value="edit" className="min-h-0 w-full overflow-hidden">
        <ReceiptCanvas />
      </TabsContent>
      <TabsContent value="printPreview" className="min-h-0 w-full overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <p className="shrink-0 border-b bg-muted/35 px-4 py-2 text-center text-xs text-muted-foreground">
            预览模式只读，切换回模版编辑后可修改
          </p>
          <div className="min-h-0 flex-1">
            <PrintPreview />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
