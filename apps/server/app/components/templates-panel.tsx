/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export type TemplateListItem = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
};

type Props = {
  initialTemplates: TemplateListItem[]
  canManage: boolean
};

const DEFAULT_DEFINITION = {
  name: 'untitled',
  commands: [
    { type: 'text', content: 'Hello from morden-escpos' },
    { type: 'newLine' },
  ],
};

export function TemplatesPanel({ initialTemplates, canManage }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState('New receipt');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refreshList() {
    const response = await fetch('/api/console/templates');
    if (!response.ok) return;
    const body = await response.json() as { templates: TemplateListItem[] };
    setTemplates(body.templates);
    router.refresh();
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setPending(true);
    setError(null);
    const response = await fetch('/api/console/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        definition: {
          ...DEFAULT_DEFINITION,
          name,
        },
      }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not create template');
      return;
    }
    const body = await response.json() as { template: TemplateListItem };
    router.push(`/console/templates/${body.template.id}`);
  }

  async function onDelete(templateId: string) {
    if (!canManage) return;
    setError(null);
    const response = await fetch(`/api/console/templates/${templateId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not delete template');
      return;
    }
    await refreshList();
  }

  return (
    <div className="stack">
      {canManage
        ? (
            <form className="org-form" onSubmit={onCreate}>
              <label>
                Template name
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button type="submit" disabled={pending || name.trim().length === 0}>
                {pending ? 'Creating…' : 'Create template'}
              </button>
            </form>
          )
        : (
            <p className="muted">
              Members can open templates for confirmation print; only owner/admin may create or delete.
            </p>
          )}

      <div className="stack">
        <div className="agent-actions">
          <h2>Organization templates</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            Refresh
          </button>
        </div>
        {templates.length === 0
          ? <p className="muted">No templates yet.</p>
          : (
              <ul className="agent-list">
                {templates.map(template => (
                  <li key={template.id} className="agent-row">
                    <div>
                      <div className="agent-name">{template.name}</div>
                      <div className="muted agent-meta">
                        <span className="agent-id">
                          templateId:
                          {' '}
                          {template.id}
                        </span>
                        <span>
                          Updated:
                          {' '}
                          {new Date(template.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="agent-actions">
                      <a className="secondary" href={`/console/templates/${template.id}`}>
                        Open editor
                      </a>
                      {canManage
                        ? (
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => void onDelete(template.id)}
                            >
                              Delete
                            </button>
                          )
                        : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
}
