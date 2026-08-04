'use client';

import { TemplateEngine } from 'morden-node-escpos/template';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { paintReceiptRaster } from '../../lib/escpos-canvas/paint';
import { buildReceiptRaster } from '../../lib/escpos-canvas/rasterize';
import { parseSampleData, toPrintJob } from '../../lib/print-job';

export function PrintPreview() {
  const document = useEditorStore(state => state.document);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const source = useMemo(() => {
    const sample = parseSampleData(document.sampleDataText);

    try {
      const sourceJob = toPrintJob(document);
      const job = sample.data
        ? new TemplateEngine().render(sourceJob, sample.data)
        : sourceJob;
      return {
        job,
        dataError: sample.error,
      };
    }
    catch (error) {
      return {
        job: null,
        dataError: error instanceof Error ? error.message : '无法生成打印预览。',
      };
    }
  }, [document]);
  const [raster, setRaster] = useState<Awaited<ReturnType<typeof buildReceiptRaster>> | null>(null);
  const [rasterError, setRasterError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    if (!source.job) {
      return () => {
        cancelled = true;
      };
    }

    void buildReceiptRaster(source.job)
      .then((nextRaster) => {
        if (!cancelled) {
          setRaster(nextRaster);
          setRasterError(undefined);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRaster(null);
          setRasterError(error instanceof Error ? error.message : '无法生成打印预览。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source.job]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && raster) {
      paintReceiptRaster(canvas, raster);
    }
  }, [raster]);

  const visibleRaster = source.job ? raster : null;
  const dataError = source.dataError ?? rasterError;

  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-muted/55" aria-label="ESC/POS 打印预览">
      {dataError
        ? (
            <div role="alert" className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
              {dataError}
              {' '}
              预览暂时保留变量占位符。
            </div>
          )
        : null}
      <div className="flex-1 overflow-auto p-5 md:p-10">
        {visibleRaster
          ? (
              <div
                className="receipt-shadow mx-auto w-fit max-w-full overflow-hidden bg-white"
                style={{ minHeight: 240 }}
              >
                <canvas
                  ref={canvasRef}
                  className="block h-auto max-w-full"
                  style={{ imageRendering: 'pixelated' }}
                  aria-label={`${document.paperWidth} 毫米 ESC/POS 点阵打印效果`}
                />
              </div>
            )
          : (
              <div className="mx-auto grid min-h-56 max-w-md place-items-center rounded-lg border border-dashed px-6 text-center text-xs text-muted-foreground">
                当前模板无法生成打印预览。
              </div>
            )}
      </div>
    </main>
  );
}
