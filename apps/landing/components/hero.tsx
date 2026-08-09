/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';

import { HeroVisual } from './hero-visual';
import { SiteHeader } from './site-header';

export function Hero() {
  return (
    <section
      id="top"
      className="hero-plane relative min-h-[100svh] overflow-hidden text-paper"
    >
      <HeroVisual />
      <SiteHeader />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
        <div className="hero-copy max-w-xl space-y-6">
          <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            morden-escpos
          </p>
          <h1 className="max-w-lg text-balance text-2xl font-medium leading-snug text-paper/95 sm:text-3xl">
            Print-queue control plane for ESC/POS fleets
          </h1>
          <p className="max-w-md text-base leading-relaxed text-paper/80 sm:text-lg">
            Enqueue jobs from your systems. On-site Printer Agents lease work and print over TCP, USB, or Serial—without exposing printers to the public internet.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#pricing">Compare paths</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-paper/35 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
            >
              <a href="#license">License honesty</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
