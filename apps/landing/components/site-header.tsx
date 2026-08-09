/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight text-paper">
          morden-escpos
        </a>
        <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-3">
          <a
            href="#pricing"
            className="hidden text-sm font-medium text-paper/85 transition-colors hover:text-paper sm:inline"
          >
            Pricing
          </a>
          <a
            href="#license"
            className="hidden text-sm font-medium text-paper/85 transition-colors hover:text-paper sm:inline"
          >
            License
          </a>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="#pricing">See plans</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
