/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Reveal } from './reveal';

export function LicenseSection() {
  return (
    <section id="license" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-license-bsl">
              License honesty
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              BSL SaaS paths. MIT drivers.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We keep the boundary explicit so buyers and contributors know what they can redistribute, host, and fork.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal delayMs={60}>
            <div className="rounded-xl border border-license-bsl/35 bg-card/90 p-6 sm:p-8">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-license-bsl">
                BUSL-1.1 · bsl-saas
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
                SaaS is not MIT
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                The control plane, Printer Agent clients, and this landing app live under
                {' '}
                <strong className="font-semibold text-foreground">BUSL-1.1</strong>
                .
                The Additional Use Grant allows internal production use, but
                {' '}
                <strong className="font-semibold text-foreground">not competing hosted offerings</strong>
                .
                After the Change Date (four years from publication), the Change License is AGPL-3.0-or-later.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Self-hosted operators still run BSL software—they gain an internal-use path without Stripe or tenant-ops surfaces, not an MIT relicensing of the SaaS tree.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={140}>
            <div className="rounded-xl border border-license-mit/35 bg-card/90 p-6 sm:p-8">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-license-mit">
                MIT · mit-drivers
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
                Drivers stay open
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                ESC/POS driver libraries, Receipt Studio, and shared MIT packages remain
                {' '}
                <strong className="font-semibold text-foreground">MIT</strong>
                .
                You can keep using and redistributing those paths under MIT terms even if you never subscribe to the hosted queue.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                SaaS logic must not be pulled into MIT packages. SPDX headers follow the path’s context in
                {' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">CONTEXT-MAP.md</code>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
