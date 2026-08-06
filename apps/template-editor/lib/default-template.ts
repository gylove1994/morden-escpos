/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from 'morden-node-escpos/schema';

import type { EditorDocument } from './editor-types';
import { fromPrintJob } from './print-job';

export const defaultPrintJob = {
  name: 'JIRA卡片打印',
  description: '80mm JIRA 任务卡片模板',
  config: {
    encoding: 'GB18030',
    width: 48,
    model: null,
  },
  inputs: {
    type: 'object',
    title: 'JIRA 工单数据',
    required: ['type', 'key', 'title', 'status', 'priority', 'assignee', 'createdDate', 'description', 'labels', 'relatedIssues', 'url'],
    properties: {
      type: { type: 'string', title: '工单类型' },
      key: { type: 'string', title: '工单编号' },
      title: { type: 'string', title: '标题' },
      status: { type: 'string', title: '状态' },
      priority: { type: 'string', title: '优先级' },
      assignee: { type: 'string', title: '负责人' },
      createdDate: { type: 'string', title: '创建日期', format: 'date' },
      dueDate: { type: 'string', title: '到期日期', format: 'date' },
      description: { type: 'string', title: '描述' },
      labels: { type: 'string', title: '标签' },
      relatedIssues: {
        type: 'array',
        title: '关联工单',
        items: {
          type: 'object',
          required: ['key', 'relation', 'title'],
          properties: {
            key: { type: 'string', title: '工单编号' },
            relation: { type: 'string', title: '关系' },
            title: { type: 'string', title: '标题' },
          },
        },
      },
      url: { type: 'string', title: '工单链接', format: 'uri' },
    },
  },
  commands: [
    { type: 'align', value: 'CT' },
    { type: 'style', value: 'B' },
    { type: 'size', width: 2, height: 2 },
    { type: 'text', content: '{{type}} {{key}}' },
    { type: 'size', width: 1, height: 1 },
    { type: 'style', value: 'NORMAL' },
    { type: 'newLine' },
    { type: 'drawLine', character: '-' },
    { type: 'align', value: 'LT' },
    { type: 'style', value: 'B' },
    { type: 'text', content: '标题:' },
    { type: 'style', value: 'NORMAL' },
    { type: 'newLine' },
    { type: 'text', content: '{{title}}' },
    { type: 'newLine' },
    { type: 'drawLine', character: '-' },
    {
      type: 'tableCustom',
      data: [
        { text: '状态', cols: 24, align: 'LEFT' },
        { text: '{{status}}', cols: 24, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    {
      type: 'tableCustom',
      data: [
        { text: '优先级', cols: 24, align: 'LEFT' },
        { text: '{{priority}}', cols: 24, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    {
      type: 'tableCustom',
      data: [
        { text: '负责人', cols: 24, align: 'LEFT' },
        { text: '{{assignee}}', cols: 24, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    {
      type: 'tableCustom',
      data: [
        { text: '创建日期', cols: 24, align: 'LEFT' },
        { text: '{{createdDate}}', cols: 24, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    {
      type: 'tableCustom',
      data: [
        { text: '到期日期', cols: 24, align: 'LEFT' },
        { text: '{{dueDate}}', cols: 24, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    { type: 'drawLine', character: '-' },
    { type: 'text', content: '描述:' },
    { type: 'newLine' },
    { type: 'text', content: '{{description}}' },
    { type: 'newLine' },
    { type: 'drawLine', character: '-' },
    { type: 'text', content: '标签:' },
    { type: 'newLine' },
    { type: 'text', content: '{{labels}}' },
    { type: 'newLine' },
    { type: 'drawLine', character: '-' },
    { type: 'style', value: 'B' },
    { type: 'text', content: '关联工单:' },
    { type: 'style', value: 'NORMAL' },
    { type: 'newLine' },
    {
      type: 'tableCustom',
      data: [
        { text: '工单', cols: 14, align: 'LEFT' },
        { text: '关系', cols: 10, align: 'CENTER' },
        { text: '标题', cols: 24, align: 'LEFT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    {
      type: 'tableCustom',
      each: 'relatedIssues',
      data: [
        { text: '{{key}}', cols: 14, align: 'LEFT' },
        { text: '{{relation}}', cols: 10, align: 'CENTER' },
        { text: '{{title}}', cols: 24, align: 'LEFT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    { type: 'drawLine', character: '-' },
    { type: 'align', value: 'CT' },
    { type: 'qrcode', content: '{{url}}', level: 'M', size: 6 },
    { type: 'feed', lines: 2 },
    { type: 'cut' },
  ],
} satisfies PrintJobJSON;

export const defaultSampleData = {
  type: 'BUG',
  key: 'PROJ-123',
  title: '修复登录页面的验证码显示问题',
  status: '进行中',
  priority: '高',
  assignee: '张三',
  createdDate: '2024-01-15',
  dueDate: '2024-01-20',
  description: '登录页面的验证码图片无法正常显示，用户无法完成登录流程。',
  labels: 'bug, frontend, urgent',
  relatedIssues: [
    { key: 'PROJ-118', relation: '阻塞', title: '登录服务接口改造' },
    { key: 'PROJ-97', relation: '关联', title: '验证码组件升级' },
  ],
  url: 'https://your-jira-instance.atlassian.net/browse/PROJ-123',
};

export function createDefaultDocument(): EditorDocument {
  return fromPrintJob(defaultPrintJob, JSON.stringify(defaultSampleData, null, 2), id => `default-${id + 1}`);
}
