import type { TypeEditorProps } from '../TypeEditor';
import CombinatorEditor from './CombinatorEditor';

const AnyOfEditor: React.FC<TypeEditorProps> = props => (
  <CombinatorEditor {...props} combinator="anyOf" />
);

export default AnyOfEditor;
