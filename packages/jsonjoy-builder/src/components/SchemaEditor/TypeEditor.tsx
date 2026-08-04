import type { JsonSchema, ObjectJsonSchema } from '../../types/jsonSchema';
import type { ValidationTreeNode } from '../../types/validation';
import { lazy, Suspense } from 'react';
import { useTranslation } from '../../hooks/use-translation';
import { getEditorType } from '../../types/jsonSchema';

// Lazy load specific type editors to avoid circular dependencies
const StringEditor = lazy(() => import('./types/StringEditor'));
const NumberEditor = lazy(() => import('./types/NumberEditor'));
const BooleanEditor = lazy(() => import('./types/BooleanEditor'));
const ObjectEditor = lazy(() => import('./types/ObjectEditor'));
const ArrayEditor = lazy(() => import('./types/ArrayEditor'));
const CombinatorEditor = lazy(() => import('./types/CombinatorEditor'));

export interface EnumChangeContext {
  value: string | number | boolean
  index: number
  schemaKey?: string
}

export interface TypeEditorProps {
  schema: JsonSchema
  readOnly: boolean
  validationNode: ValidationTreeNode | undefined
  onChange: (schema: ObjectJsonSchema) => void
  schemaKey?: string
  onAddEnum?: (ctx: EnumChangeContext) => void
  onDeleteEnum?: (ctx: EnumChangeContext) => void
  depth?: number
}

const TypeEditor: React.FC<TypeEditorProps> = ({
  schema,
  validationNode,
  onChange,
  schemaKey,
  onAddEnum,
  onDeleteEnum,
  depth = 0,
  readOnly = false,
}) => {
  const t = useTranslation();
  const type = getEditorType(schema);

  return (
    <Suspense fallback={<div>{t.schemaEditorLoading}</div>}>
      {type === 'string' && (
        <StringEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
        />
      )}
      {type === 'number' && (
        <NumberEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
        />
      )}
      {type === 'integer' && (
        <NumberEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
          integer
        />
      )}
      {type === 'boolean' && (
        <BooleanEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
        />
      )}
      {type === 'object' && (
        <ObjectEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
        />
      )}
      {type === 'array' && (
        <ArrayEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
        />
      )}
      {(type === 'anyOf' || type === 'oneOf' || type === 'allOf') && (
        <CombinatorEditor
          readOnly={readOnly}
          schema={schema}
          onChange={onChange}
          schemaKey={schemaKey}
          onAddEnum={onAddEnum}
          onDeleteEnum={onDeleteEnum}
          depth={depth}
          validationNode={validationNode}
          combinator={type}
        />
      )}
    </Suspense>
  );
};

export default TypeEditor;
