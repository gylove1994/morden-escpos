/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Hero } from '../components/hero';
import { LicenseSection } from '../components/license-section';
import { PricingSection } from '../components/pricing-section';
import { SiteFooter } from '../components/site-footer';

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <PricingSection />
      <LicenseSection />
      <SiteFooter />
    </main>
  );
}
