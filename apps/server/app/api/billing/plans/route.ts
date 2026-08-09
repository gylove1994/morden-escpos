/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { SERVER_CONFIG } from '../../../../lib/config';
import { cloudOnlyJsonResponse } from '../../../../lib/billing/cloud-guard';
import { listPublicPlans } from '../../../../lib/billing/plans';
import { isCloudEdition } from '../../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public cloud plan catalog.
 * Reseller is contact CTA only (`checkoutEligible: false`).
 */
export async function GET() {
  if (!isCloudEdition()) {
    return cloudOnlyJsonResponse();
  }

  return Response.json({
    plans: listPublicPlans(SERVER_CONFIG.BILLING_RESELLER_CONTACT_URL),
  });
}
