/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const stylesDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(stylesDir, '../../../..');

/** Known-good literals from the pre-promotion landing brand (#40). */
const CANONICAL_LIGHT_PRIMARY = 'oklch(0.32 0.04 250)';
const CANONICAL_LIGHT_ACCENT = 'oklch(0.55 0.14 155)';
const CANONICAL_LIGHT_BACKGROUND = 'oklch(0.97 0.012 165)';

describe('shared light brand tokens', () => {
  it('exposes the canonical light token set from the UI package', () => {
    const brandTokens = readFileSync(path.join(stylesDir, 'brand-tokens.css'), 'utf8');
    const globals = readFileSync(path.join(stylesDir, 'globals.css'), 'utf8');

    expect(globals).toMatch(/@import\s+["']\.\/brand-tokens\.css["']/);
    expect(brandTokens).toContain(`--primary: ${CANONICAL_LIGHT_PRIMARY}`);
    expect(brandTokens).toContain(`--accent: ${CANONICAL_LIGHT_ACCENT}`);
    expect(brandTokens).toContain(`--background: ${CANONICAL_LIGHT_BACKGROUND}`);
    expect(brandTokens).toContain('@theme inline');
  });

  it('keeps landing free of a divergent brand token source of truth', () => {
    const landingGlobals = readFileSync(
      path.join(repoRoot, 'apps/landing/app/globals.css'),
      'utf8',
    );

    expect(landingGlobals).toContain('@import "@workspace/ui/globals.css"');
    expect(landingGlobals).not.toMatch(/--primary\s*:/);
    expect(landingGlobals).not.toMatch(/--background\s*:/);
    expect(landingGlobals).not.toMatch(/@theme\s+inline/);
  });
});
