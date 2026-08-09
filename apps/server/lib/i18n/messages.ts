/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ConsoleLocale } from './locales';

export interface ConsoleMessages {
  brand: string
  nav: {
    overview: string
    printerAgents: string
    billing: string
    printers: string
    printerGroups: string
    templates: string
    jobs: string
    createOrganization: string
    ariaLabel: string
  }
  shell: {
    organization: string
    role: string
    noOrganization: string
    signOut: string
    signingOut: string
    language: string
    english: string
    chinese: string
  }
  home: {
    title: string
    signedInAs: string
    asRole: string
    rbacBlurb: string
    managePrinterAgents: string
    billing: string
    managePrinters: string
    jobHistory: string
  }
  createOrg: {
    title: string
    blurb: string
    nameLabel: string
    slugLabel: string
    namePlaceholder: string
    slugPlaceholder: string
    submit: string
    creating: string
    failed: string
  }
  auth: {
    signUpTitle: string
    signInTitle: string
    name: string
    email: string
    password: string
    signUp: string
    creatingAccount: string
    signIn: string
    signingIn: string
    signUpFailed: string
    signInFailed: string
    haveAccount: string
    needAccount: string
  }
  jobs: {
    title: string
    blurb: string
    targetPrinter: string
    noActivePrinters: string
    rawTextLabel: string
    idempotencyLabel: string
    idempotencyPlaceholder: string
    enqueue: string
    enqueueing: string
    enqueueFailed: string
    enqueued: string
    idempotentReplay: string
    historyTitle: string
    refresh: string
    empty: string
    bytes: string
    jobId: string
    printerId: string
    created: string
    completed: string
    idempotency: string
    error: string
    kindRaw: string
    kindConfirmation: string
    relationStandalone: string
    relationParent: string
    relationChild: string
    parentJob: string
    childCount: string
    statusQueued: string
    statusLeased: string
    statusPrinting: string
    statusSucceeded: string
    statusFailed: string
  }
  printerAgents: {
    title: string
    blurb: string
    nameLabel: string
    create: string
    creating: string
    refresh: string
    empty: string
    revoke: string
    rotate: string
    statusActive: string
    statusRevoked: string
    tokenPrefix: string
    presence: string
    lastSeen: string
    never: string
    created: string
    revoked: string
    membersReadOnly: string
    createFailed: string
    tokenCreated: string
    tokenRotated: string
    copyHint: string
  }
  printers: {
    title: string
    blurb: string
    agentLabel: string
    nameLabel: string
    transportLabel: string
    addressLabel: string
    portLabel: string
    pathLabel: string
    create: string
    creating: string
    refresh: string
    empty: string
    noAgents: string
    membersReadOnly: string
    createFailed: string
    statusActive: string
    statusDisabled: string
  }
}

const en: ConsoleMessages = {
  brand: 'morden-escpos',
  nav: {
    overview: 'Overview',
    printerAgents: 'Printer Agents',
    billing: 'Billing',
    printers: 'Printers',
    printerGroups: 'Printer Groups',
    templates: 'Templates',
    jobs: 'Jobs',
    createOrganization: 'Create Organization',
    ariaLabel: 'Console',
  },
  shell: {
    organization: 'Organization',
    role: 'Role',
    noOrganization: 'No active Organization',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    language: 'Language',
    english: 'English',
    chinese: '中文',
  },
  home: {
    title: 'Organization console',
    signedInAs: 'Signed in to',
    asRole: 'as',
    rbacBlurb:
      'RBAC roles are owner, admin, and member. Updating Organization settings, managing Printer Agent device tokens, and confirming Printers require owner or admin. Members may enqueue raw jobs and view job status. Cloud billing (Stripe Checkout + plan limits) is under Billing.',
    managePrinterAgents: 'Manage Printer Agents',
    billing: 'Billing',
    managePrinters: 'Manage Printers',
    jobHistory: 'Job history',
  },
  createOrg: {
    title: 'Create Organization',
    blurb: 'Creating an Organization makes you the owner.',
    nameLabel: 'Organization name',
    slugLabel: 'Slug',
    namePlaceholder: 'Acme Prints',
    slugPlaceholder: 'acme-prints',
    submit: 'Create Organization',
    creating: 'Creating…',
    failed: 'Could not create Organization',
  },
  auth: {
    signUpTitle: 'Sign up',
    signInTitle: 'Sign in',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    signUp: 'Sign up',
    creatingAccount: 'Creating account…',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    signUpFailed: 'Sign up failed',
    signInFailed: 'Sign in failed',
    haveAccount: 'Already have an account? Sign in',
    needAccount: 'Need an account? Sign up',
  },
  jobs: {
    title: 'Print jobs',
    blurb:
      'Enqueue raw ESC/POS work to a Printer and audit queued → leased → printing → succeeded | failed. Template confirmation jobs and parent/child fan-out links appear when present.',
    targetPrinter: 'Target Printer',
    noActivePrinters: 'No active Printers',
    rawTextLabel: 'Raw text (encoded to ESC/POS-ish base64 for demo)',
    idempotencyLabel: 'Idempotency key (optional)',
    idempotencyPlaceholder: 'order-42-retry',
    enqueue: 'Enqueue raw job',
    enqueueing: 'Enqueueing…',
    enqueueFailed: 'Could not enqueue job',
    enqueued: 'Enqueued job {id}',
    idempotentReplay: 'Idempotent replay — existing job {id} ({status})',
    historyTitle: 'Job history',
    refresh: 'Refresh',
    empty: 'No jobs yet.',
    bytes: 'bytes',
    jobId: 'jobId',
    printerId: 'printerId',
    created: 'Created',
    completed: 'Completed',
    idempotency: 'Idempotency',
    error: 'Error',
    kindRaw: 'Raw',
    kindConfirmation: 'Template confirmation',
    relationStandalone: 'Standalone',
    relationParent: 'Parent ({count} children)',
    relationChild: 'Child of {parentId}',
    parentJob: 'Parent',
    childCount: 'Children',
    statusQueued: 'queued',
    statusLeased: 'leased',
    statusPrinting: 'printing',
    statusSucceeded: 'succeeded',
    statusFailed: 'failed',
  },
  printerAgents: {
    title: 'Printer Agents',
    blurb:
      'Register an on-site Printer Agent and receive a device token. Tokens are shown once on create or rotate. Online/offline reflects the last heartbeat or poll.',
    nameLabel: 'Name',
    create: 'Create Printer Agent',
    creating: 'Creating…',
    refresh: 'Refresh',
    empty: 'No Printer Agents yet.',
    revoke: 'Revoke',
    rotate: 'Rotate token',
    statusActive: 'active',
    statusRevoked: 'revoked',
    tokenPrefix: 'Token prefix',
    presence: 'Presence',
    lastSeen: 'Last seen',
    never: 'never',
    created: 'Created',
    revoked: 'Revoked',
    membersReadOnly: 'Members may list Printer Agents but cannot manage tokens.',
    createFailed: 'Could not create Printer Agent',
    tokenCreated: 'Device token created — copy it now. It will not be shown again.',
    tokenRotated: 'Device token rotated — copy it now. It will not be shown again.',
    copyHint: 'Store this token on the Printer Agent host.',
  },
  printers: {
    title: 'Printers',
    blurb:
      'Confirm and name Printers under a Printer Agent. Connection hints travel with leased jobs.',
    agentLabel: 'Printer Agent',
    nameLabel: 'Printer name',
    transportLabel: 'Transport',
    addressLabel: 'Address',
    portLabel: 'Port',
    pathLabel: 'Path',
    create: 'Create Printer',
    creating: 'Creating…',
    refresh: 'Refresh',
    empty: 'No Printers yet.',
    noAgents: 'No active Printer Agents',
    membersReadOnly: 'Members may list Printers but cannot create them.',
    createFailed: 'Could not create Printer',
    statusActive: 'active',
    statusDisabled: 'disabled',
  },
};

const zh: ConsoleMessages = {
  brand: 'morden-escpos',
  nav: {
    overview: '概览',
    printerAgents: '打印机代理',
    billing: '计费',
    printers: '打印机',
    printerGroups: '打印机组',
    templates: '模板',
    jobs: '任务',
    createOrganization: '创建组织',
    ariaLabel: '控制台',
  },
  shell: {
    organization: '组织',
    role: '角色',
    noOrganization: '无活跃组织',
    signOut: '退出登录',
    signingOut: '正在退出…',
    language: '语言',
    english: 'English',
    chinese: '中文',
  },
  home: {
    title: '组织控制台',
    signedInAs: '已登录到',
    asRole: '角色为',
    rbacBlurb:
      'RBAC 角色为 owner、admin、member。更新组织设置、管理打印机代理设备令牌以及确认打印机需要 owner 或 admin。成员可以入队原始任务并查看任务状态。云计费（Stripe Checkout + 套餐限额）见「计费」。',
    managePrinterAgents: '管理打印机代理',
    billing: '计费',
    managePrinters: '管理打印机',
    jobHistory: '任务历史',
  },
  createOrg: {
    title: '创建组织',
    blurb: '创建组织后，你将成为 owner。',
    nameLabel: '组织名称',
    slugLabel: 'Slug',
    namePlaceholder: 'Acme Prints',
    slugPlaceholder: 'acme-prints',
    submit: '创建组织',
    creating: '正在创建…',
    failed: '无法创建组织',
  },
  auth: {
    signUpTitle: '注册',
    signInTitle: '登录',
    name: '名称',
    email: '邮箱',
    password: '密码',
    signUp: '注册',
    creatingAccount: '正在创建账户…',
    signIn: '登录',
    signingIn: '正在登录…',
    signUpFailed: '注册失败',
    signInFailed: '登录失败',
    haveAccount: '已有账户？去登录',
    needAccount: '还没有账户？去注册',
  },
  jobs: {
    title: '打印任务',
    blurb:
      '向打印机入队原始 ESC/POS 任务，并审计 queued → leased → printing → succeeded | failed。模板确认任务与父子扇出关系在存在时会显示。',
    targetPrinter: '目标打印机',
    noActivePrinters: '没有可用打印机',
    rawTextLabel: '原始文本（演示用，编码为接近 ESC/POS 的 base64）',
    idempotencyLabel: '幂等键（可选）',
    idempotencyPlaceholder: 'order-42-retry',
    enqueue: '入队原始任务',
    enqueueing: '正在入队…',
    enqueueFailed: '无法入队任务',
    enqueued: '已入队任务 {id}',
    idempotentReplay: '幂等重放 — 已有任务 {id}（{status}）',
    historyTitle: '任务历史',
    refresh: '刷新',
    empty: '暂无任务。',
    bytes: '字节',
    jobId: '任务 ID',
    printerId: '打印机 ID',
    created: '创建时间',
    completed: '完成时间',
    idempotency: '幂等键',
    error: '错误',
    kindRaw: '原始任务',
    kindConfirmation: '模板确认打印',
    relationStandalone: '独立任务',
    relationParent: '父任务（{count} 个子任务）',
    relationChild: '子任务，父任务 {parentId}',
    parentJob: '父任务',
    childCount: '子任务数',
    statusQueued: '排队中',
    statusLeased: '已租约',
    statusPrinting: '打印中',
    statusSucceeded: '成功',
    statusFailed: '失败',
  },
  printerAgents: {
    title: '打印机代理',
    blurb: '注册现场打印机代理并获取设备令牌。令牌仅在创建或轮换时显示一次。',
    nameLabel: '名称',
    create: '创建打印机代理',
    creating: '正在创建…',
    refresh: '刷新',
    empty: '暂无打印机代理。',
    revoke: '吊销',
    rotate: '轮换令牌',
    statusActive: '活跃',
    statusRevoked: '已吊销',
    tokenPrefix: '令牌前缀',
    presence: '在线状态',
    lastSeen: '最后活跃',
    never: '从未',
    created: '创建时间',
    revoked: '吊销时间',
    membersReadOnly: '成员可以查看打印机代理，但不能管理令牌。',
    createFailed: '无法创建打印机代理',
    tokenCreated: '设备令牌已创建 — 请立即复制，之后不会再显示。',
    tokenRotated: '设备令牌已轮换 — 请立即复制，之后不会再显示。',
    copyHint: '请将此令牌保存在打印机代理主机上。',
  },
  printers: {
    title: '打印机',
    blurb: '在打印机代理下确认并命名打印机。连接提示会随租约任务一起下发。',
    agentLabel: '打印机代理',
    nameLabel: '打印机名称',
    transportLabel: '传输方式',
    addressLabel: '地址',
    portLabel: '端口',
    pathLabel: '路径',
    create: '创建打印机',
    creating: '正在创建…',
    refresh: '刷新',
    empty: '暂无打印机。',
    noAgents: '没有可用打印机代理',
    membersReadOnly: '成员可以查看打印机，但不能创建。',
    createFailed: '无法创建打印机',
    statusActive: '活跃',
    statusDisabled: '已禁用',
  },
};

const catalogs: Record<ConsoleLocale, ConsoleMessages> = { en, zh };

export function getMessages(locale: ConsoleLocale): ConsoleMessages {
  return catalogs[locale];
}

/** Replace `{name}` placeholders in a message template. */
export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}
