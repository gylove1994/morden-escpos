import type { FC } from 'react';
import type { Translation } from '../../i18n/translation-keys';
import type { SchemaEditorType } from '../../types/jsonSchema';
import { useTranslation } from '../../hooks/use-translation';
import { cn } from '../../lib/utils';

interface SchemaTypeSelectorProps {
  id?: string
  value: SchemaEditorType
  onChange: (value: SchemaEditorType) => void
}

interface TypeOption {
  id: SchemaEditorType
  label: keyof Translation
  description: keyof Translation
  group: 'basic' | 'composition'
}

const typeOptions: TypeOption[] = [
  {
    id: 'string',
    label: 'fieldTypeTextLabel',
    description: 'fieldTypeTextDescription',
    group: 'basic',
  },
  {
    id: 'number',
    label: 'fieldTypeNumberLabel',
    description: 'fieldTypeNumberDescription',
    group: 'basic',
  },
  {
    id: 'boolean',
    label: 'fieldTypeBooleanLabel',
    description: 'fieldTypeBooleanDescription',
    group: 'basic',
  },
  {
    id: 'object',
    label: 'fieldTypeObjectLabel',
    description: 'fieldTypeObjectDescription',
    group: 'basic',
  },
  {
    id: 'array',
    label: 'fieldTypeArrayLabel',
    description: 'fieldTypeArrayDescription',
    group: 'basic',
  },
  {
    id: 'anyOf',
    label: 'schemaTypeAnyOf',
    description: 'anyOfDescription',
    group: 'composition',
  },
  {
    id: 'oneOf',
    label: 'schemaTypeOneOf',
    description: 'oneOfDescription',
    group: 'composition',
  },
  {
    id: 'allOf',
    label: 'schemaTypeAllOf',
    description: 'allOfDescription',
    group: 'composition',
  },
];

const SchemaTypeSelector: FC<SchemaTypeSelectorProps> = ({
  id,
  value,
  onChange,
}) => {
  const t = useTranslation();
  return (
    <div
      id={id}
      className="@container/type-selector grid grid-cols-1 gap-2 @xs/type-selector:grid-cols-2 @2xl/type-selector:grid-cols-3"
    >
      {typeOptions.map(type => (
        <button
          type="button"
          key={type.id}
          title={t[type.description]}
          className={cn(
            'p-2.5 rounded-lg border-2 text-left transition-all duration-200',
            value === type.id
              ? 'border-primary bg-primary/5 shadow-xs'
              : type.group === 'composition'
                ? 'border-dashed border-border hover:border-primary/40 hover:bg-secondary'
                : 'border-border hover:border-primary/30 hover:bg-secondary',
          )}
          onClick={() => onChange(type.id)}
        >
          <div className="font-medium text-sm">{t[type.label]}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {t[type.description]}
          </div>
        </button>
      ))}
    </div>
  );
};

export default SchemaTypeSelector;
