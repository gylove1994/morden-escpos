/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { cn } from "#lib/utils";
import { Panel as PanelPrimitive } from "@xyflow/react";
import type { ComponentProps } from "react";

type PanelProps = ComponentProps<typeof PanelPrimitive>;

export const Panel = ({ className, ...props }: PanelProps) => (
  <PanelPrimitive
    className={cn(
      "m-4 overflow-hidden rounded-md border bg-card p-1",
      className
    )}
    {...props}
  />
);
