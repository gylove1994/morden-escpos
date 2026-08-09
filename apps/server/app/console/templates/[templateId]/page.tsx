/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { notFound, redirect } from 'next/navigation';
import { SERVER_CONFIG } from '../../../../lib/config';
import { canManageTemplates, getConsoleSession } from '../../../../lib/console-auth';
import { listPrinterGroups } from '../../../../lib/printer-groups';
import { listPrinters } from '../../../../lib/printers';
import { getTemplate } from '../../../../lib/templates';
import { EmbeddedTemplateEditor } from '../../../components/embedded-template-editor';

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const { templateId } = await params;
  const template = await getTemplate({
    organizationId: session.organization.id,
    templateId,
  });
  if (!template) {
    notFound();
  }

  const [printers, printerGroups] = await Promise.all([
    listPrinters(session.organization.id),
    listPrinterGroups(session.organization.id),
  ]);

  return (
    <section className="stack">
      <div>
        <p className="muted">
          <a href="/console/templates">← Templates</a>
        </p>
        <h1>{template.name}</h1>
        <p className="muted">
          Embedded MIT Receipt Studio. Preview stays local; confirmation print
          enqueues via the SaaS queue to a selected Printer or Printer Group.
        </p>
      </div>
      <EmbeddedTemplateEditor
        template={{
          id: template.id,
          name: template.name,
          definition: template.definition,
        }}
        editorOrigin={SERVER_CONFIG.TEMPLATE_EDITOR_ORIGIN}
        printers={printers}
        printerGroups={printerGroups}
        canManage={canManageTemplates(session.role)}
      />
    </section>
  );
}
