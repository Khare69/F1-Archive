import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono tabular-nums transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-[#F4F6FA] border border-white/10',
        primary: 'bg-[#E10600] text-white',
        outline: 'border border-white/20 text-[#94A3B8]',
        sectorPurple: 'bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/40',
        sectorGreen: 'bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40',
        sectorYellow: 'bg-[#EAB308]/20 text-[#FDE047] border border-[#EAB308]/40',
        tyreSoft: 'bg-[#E10600] text-white',
        tyreMedium: 'bg-[#FFD300] text-black font-extrabold',
        tyreHard: 'bg-[#F0F0F0] text-black font-extrabold',
        tyreInter: 'bg-[#39B54A] text-white',
        tyreWet: 'bg-[#0090FF] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
