/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { TypeEditorProps } from '../TypeEditor';
import CombinatorEditor from './CombinatorEditor';

const AnyOfEditor: React.FC<TypeEditorProps> = props => (
  <CombinatorEditor {...props} combinator="anyOf" />
);

export default AnyOfEditor;
