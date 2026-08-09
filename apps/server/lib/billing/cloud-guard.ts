/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { isCloudEdition } from '../edition';
import { BillingEditionError } from './errors';

/** Billing routes and plan-limit stubs are cloud-edition surfaces. */
export function assertCloudBilling(): void {
  if (!isCloudEdition()) {
    throw new BillingEditionError();
  }
}

export function cloudOnlyJsonResponse(): Response {
  return Response.json(
    {
      error: 'billing_cloud_only',
      message: 'Billing is available only on the cloud edition',
    },
    { status: 404 },
  );
}
