import type { ComponentProps, Ref } from "react";
import { cn } from "../../lib/utils";

function ButtonToggle({
  className,
  onClick,
  children,
  ref,
  ...props
}: ComponentProps<"button"> & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className={cn(
        "min-w-20 cursor-pointer rounded-md px-2 py-1 text-center text-xs font-medium whitespace-nowrap transition-all hover:ring-2 hover:ring-ring/30 hover:shadow-xs active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { ButtonToggle };
