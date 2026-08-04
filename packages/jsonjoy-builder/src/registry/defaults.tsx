import type {
  FieldFrameSlotProps,
  FieldHeaderSlotProps,
  InputProps,
  SchemaBuilderComponents,
  SchemaBuilderRegistry,
  SchemaBuilderSlots,
  SchemaDialogProps,
} from './types';
import { Badge as DefaultBadge } from '@workspace/ui/components/ui/badge';
import { Button as DefaultButton } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Input as RawInput } from '@workspace/ui/components/ui/input';
import { Label as DefaultLabel } from '@workspace/ui/components/ui/label';
import { Switch as DefaultSwitch } from '@workspace/ui/components/ui/switch';
import { ButtonToggle as DefaultButtonToggle } from '../components/ui/button-toggle';
import { cn } from '../lib/utils';

/**
 * Default registry — built-in UI primitives, layout slots, and empty maps.
 *
 * IMPORTANT: This file does NOT import any type editor or validator component.
 * Built-in editors remain lazy imports in TypeEditor.tsx; built-in validators
 * live locally in each editor module.
 */

// ── Default components ───────────────────────

const DefaultSchemaDialog: React.FC<SchemaDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  children,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={className}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogContent>
  </Dialog>
);

/**
 * Default Input adapter. When `label` is provided it renders its own `<Label>`
 * as a sibling (a fragment, so the editor's existing layout is preserved). A
 * design-system adapter (e.g. MUI) can instead fold the label into the control.
 */
function DefaultInput({
  label,
  id,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  return (
    <>
      {label != null && (
        <DefaultLabel
          htmlFor={id}
          className={cn(ariaInvalid === true && 'text-destructive')}
        >
          {label}
        </DefaultLabel>
      )}
      <RawInput id={id} aria-invalid={ariaInvalid} {...props} />
    </>
  );
}

export const defaultComponents: SchemaBuilderComponents = {
  Button: DefaultButton,
  Input: DefaultInput,
  Switch: DefaultSwitch,
  Label: DefaultLabel,
  Badge: DefaultBadge,
  ButtonToggle: DefaultButtonToggle,
  SchemaDialog: DefaultSchemaDialog,
};

// ── Default slots ────────────────────────────

/**
 * Default FieldFrame adapter. Owns its own card styling and depth-based
 * indentation derived from the `depth` prop — callers must NOT inject
 * layout via `className`. Custom adapters receive the same `depth`,
 * `expanded`, and `hasErrors` props to apply their own visual treatment.
 */
function DefaultFieldFrame({ children, depth = 0 }: FieldFrameSlotProps) {
  return (
    <div
      className={cn(
        'mb-2 animate-in rounded-lg border transition-all duration-200',
        depth > 0 && 'ml-0 sm:ml-4 border-l border-l-border/40',
      )}
    >
      {children}
    </div>
  );
}

function DefaultFieldHeader({ children }: FieldHeaderSlotProps) {
  return <div className="flex items-center gap-2 grow min-w-0">{children}</div>;
}

function DefaultSlot({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export const defaultSlots: SchemaBuilderSlots = {
  Root: DefaultSlot,
  MobileModeSwitch: DefaultSlot,
  FullscreenToggle: DefaultSlot,
  FieldFrame: DefaultFieldFrame,
  FieldHeader: DefaultFieldHeader,
  FieldMain: DefaultSlot,
  FieldActions: DefaultSlot,
  FieldBody: DefaultSlot,
};

// ── Default root registry ────────────────────

export const defaultRegistry: SchemaBuilderRegistry = {
  components: defaultComponents,
  slots: defaultSlots,
  slotProps: {},
};
