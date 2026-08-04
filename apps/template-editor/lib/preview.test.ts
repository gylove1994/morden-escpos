import { describe, expect, it } from 'vitest';

import { createDefaultDocument } from './default-template';
import { buildPreview, extractVariables, groupPreviewItems } from './preview';

describe('jira card preview', () => {
  it('renders template variables from sample data', () => {
    const preview = buildPreview(createDefaultDocument());
    const text = preview.items.map(item => item.content).join('\n');

    expect(text).toContain('BUG PROJ-123');
    expect(preview.items.some(item => item.columns?.some(column => column.text === '张三'))).toBe(true);
    expect(preview.dataError).toBeUndefined();
  });

  it('applies state commands to following text', () => {
    const preview = buildPreview(createDefaultDocument());
    const issueKey = preview.items.find(item =>
      item.richValue?.some(paragraph =>
        paragraph.children.some(leaf => leaf.text === 'BUG PROJ-123'),
      ),
    );
    const issueKeyLeaf = issueKey?.richValue
      ?.flatMap(paragraph => paragraph.children)
      .find(leaf => leaf.text === 'BUG PROJ-123');

    expect(issueKey?.style.align).toBe('center');
    expect(issueKeyLeaf).toMatchObject({
      bold: true,
      width: 2,
      height: 2,
    });
  });

  it('renders related Jira issues from the default array data', () => {
    const preview = buildPreview(createDefaultDocument());
    const relatedIssueRows = preview.items
      .filter(item => item.kind === 'table')
      .map(item => item.columns?.map(column => column.text));

    expect(relatedIssueRows).toContainEqual(['PROJ-118', '阻塞', '登录服务接口改造']);
    expect(relatedIssueRows).toContainEqual(['PROJ-97', '关联', '验证码组件升级']);
  });

  it('renders one custom table row for each array item', () => {
    const document = createDefaultDocument();
    document.commands = [
      {
        id: 'item-row',
        format: {
          align: 'LT',
          style: 'NORMAL',
          width: 1,
          height: 1,
        },
        command: {
          type: 'tableCustom',
          each: 'items',
          data: [
            { text: '{{name}}', cols: 16, align: 'LEFT', style: 'B' },
            { text: '{{quantity}}', cols: 8, align: 'RIGHT' },
          ],
          options: { size: [2, 3], encoding: 'GB18030' },
        },
      },
    ];
    document.sampleDataText = JSON.stringify({
      items: [
        { name: 'Apple', quantity: 2 },
        { name: 'Banana', quantity: 3 },
      ],
    });

    const preview = buildPreview(document);

    expect(preview.items).toHaveLength(2);
    expect(preview.items.map(item => item.columns?.map(column => column.text))).toEqual([
      ['Apple', '2'],
      ['Banana', '3'],
    ]);
    expect(preview.items.map(item => item.id)).toEqual(['item-row', 'item-row']);
    expect(new Set(preview.items.map(item => item.instanceId)).size).toBe(2);
    expect(preview.items.every(item => item.style.width === 2 && item.style.height === 3)).toBe(true);
    expect(preview.items[0]?.columns?.[0]?.font).toEqual({
      bold: true,
      italic: false,
      underline: false,
    });
    expect(groupPreviewItems(preview.items)).toEqual([
      {
        id: 'item-row',
        items: preview.items,
      },
    ]);
  });

  it('keeps placeholders and returns a recoverable sample data error', () => {
    const document = createDefaultDocument();
    document.sampleDataText = '{';
    const preview = buildPreview(document);
    const issueKey = preview.items.find(item =>
      item.richValue?.some(paragraph =>
        paragraph.children.some(leaf => leaf.text.includes('{{key}}')),
      ),
    );
    const issueKeyLeaf = issueKey?.richValue
      ?.flatMap(paragraph => paragraph.children)
      .find(leaf => leaf.text.includes('{{key}}'));

    expect(preview.dataError).toBeTruthy();
    expect(issueKey?.style.align).toBe('center');
    expect(issueKeyLeaf).toMatchObject({
      bold: true,
      width: 2,
      height: 2,
    });
  });

  it('extracts unique variable paths', () => {
    const variables = extractVariables(createDefaultDocument());

    expect(variables).toContain('key');
    expect(variables.filter(variable => variable === 'key')).toHaveLength(1);
  });
});
