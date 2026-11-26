import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E10600] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#181E2A] text-[#F4F6FA] border border-white/10 hover:bg-[#222B3D] hover:border-white/20',
        primary: 'bg-[#E10600] text-white hover:bg-[#FF1801] shadow-[0_0_14px_rgba(225,6,0,0.35)]',
        ghost: 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F4F6FA]',
        outline: 'border border-white/10 bg-transparent text-[#F4F6FA] hover:bg-white/5 hover:border-white/20',
        destructive: 'bg-[#E10600]/20 text-[#FF4D4D] border border-[#E10600]/30 hover:bg-[#E10600]/30',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-[11px]',
        lg: 'h-10 px-6 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
