/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';
import { Building2, Handshake, Server, User } from 'lucide-react';

import { Reveal } from './reveal';

const RESELLER_MAILTO
  = 'mailto:gylove1994@acgsteps.com?subject=morden-escpos%20reseller%20inquiry';

const paths = [
  {
    id: 'self-hosted',
    name: 'Self-hosted',
    price: 'No cloud fee',
    summary: 'Run the queue inside your network under the BSL internal-use grant.',
    points: [
      'Single-edition build without Stripe or platform tenant-ops',
      'Your org, Printer Agents, printers, jobs, and templates',
      'You operate Postgres and the Next.js server',
    ],
    cta: { label: 'Read self-hosted notes', href: '#license', variant: 'outline' as const },
    icon: Server,
    highlight: false,
  },
  {
    id: 'personal',
    name: 'Personal',
    price: 'About $1 / month',
    summary: 'Hosted cloud for hobby and light use with tight plan limits.',
    points: [
      'Managed control plane and billing via Stripe (later)',
      'Limits on printers, Printer Agents, and monthly jobs',
      'Sensible default for solo operators',
    ],
    cta: { label: 'Choose Personal', href: '#cta', variant: 'default' as const },
    icon: User,
    highlight: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 'From about $5 / month',
    summary: 'Hosted cloud for small teams that need higher limits and integrations.',
    points: [
      'Higher quotas for printers, Printer Agents, and jobs',
      'Webhook enqueue and org RBAC features',
      'Predictable subscription for production shops',
    ],
    cta: { label: 'Choose Business', href: '#cta', variant: 'default' as const },
    icon: Building2,
    highlight: true,
  },
  {
    id: 'reseller',
    name: 'Reseller',
    price: 'Contact us',
    summary: 'Negotiated platform or reseller pricing—not self-serve checkout.',
    points: [
      'Partner and multi-tenant commercial discussions',
      'Custom limits and commercial terms',
      'Human follow-up instead of a public price card',
    ],
    cta: { label: 'Contact for reseller', href: RESELLER_MAILTO, variant: 'outline' as const },
    icon: Handshake,
    highlight: false,
  },
] as const;

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-queue">
              Paths
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Self-hosted, Personal, Business, or reseller contact
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Dollar amounts and numeric quotas are directional MVP defaults from the product spec—they may adjust before launch without changing the architecture. Checkout enforcement is a separate ticket.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <Reveal key={path.id} delayMs={index * 80}>
                <article
                  id={path.id}
                  className={[
                    'flex h-full flex-col rounded-xl border bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-colors sm:p-7',
                    path.highlight
                      ? 'border-accent/55 ring-1 ring-accent/25'
                      : 'border-border',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {path.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-accent">
                        {path.price}
                      </p>
                    </div>
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-queue">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {path.summary}
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-foreground/90">
                    {path.points.map(point => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <Button asChild variant={path.cta.variant} className="w-full sm:w-auto">
                      <a href={path.cta.href}>{path.cta.label}</a>
                    </Button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
