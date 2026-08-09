/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';

import { Reveal } from './reveal';

const RESELLER_MAILTO
  = 'mailto:gylove1994@acgsteps.com?subject=morden-escpos%20reseller%20inquiry';

export function SiteFooter() {
  return (
    <footer className="px-5 pb-16 sm:px-8 sm:pb-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div
            id="cta"
            className="rounded-2xl border border-border bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12"
          >
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Pick a path, keep the license clear
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
              Start with self-hosted under BSL internal use, subscribe to Personal or Business when hosted limits matter, or contact us for reseller terms. Drivers remain MIT either way.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#pricing">Back to pricing</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <a href={RESELLER_MAILTO}>Reseller contact</a>
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/80 pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display font-medium text-ink">morden-escpos</p>
          <p>
            Landing app · BUSL-1.1 ·
            {' '}
            <a
              className="underline-offset-4 hover:underline"
              href="https://github.com/gylove1994/morden-escpos"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
