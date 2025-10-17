import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Add a new interface for the Tabs component to include the disableKeyboardNavigation prop
interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  disableKeyboardNavigation?: boolean;
}

// Modify the Tabs component to be a forwardRef component that accepts the new prop
const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ disableKeyboardNavigation, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    dir={disableKeyboardNavigation ? 'ltr' : undefined}
    orientation={disableKeyboardNavigation ? undefined : 'horizontal'}
    activationMode={disableKeyboardNavigation ? 'manual' : undefined}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-transparent',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap gap-2 px-3 py-1.5 text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 group cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'rounded-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:ring-offset-background dark:focus-visible:ring-ring',
        underline: [
          'relative text-muted-foreground',
          "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent after:content-['']",
        ],
        github: [
          'relative text-muted-foreground border border-transparent border-b-border rounded-none font-bold',
          'hover:text-foreground rounded-t-md rounded-b-none',
          'data-[state=active]:border-border data-[state=active]:border-b-transparent',
        ],
        ghost: [
          'relative text-muted-foreground',
          'hover:text-secondary',
          'data-[state=active]:text-secondary',
        ],
      },
      color: {
        primary: '',
        secondary: '',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        color: 'primary',
        className:
          'data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground',
      },
      {
        variant: 'default',
        color: 'secondary',
        className:
          'data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-secondary-foreground',
      },
      {
        variant: 'underline',
        color: 'primary',
        className:
          'data-[state=active]:text-primary data-[state=active]:after:bg-primary',
      },
      {
        variant: 'underline',
        color: 'secondary',
        className:
          'data-[state=active]:text-secondary data-[state=active]:after:bg-secondary',
      },
      {
        variant: 'github',
        color: 'secondary',
        className: 'data-[state=active]:text-secondary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      color: 'primary',
    },
  }
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  color?: 'primary' | 'secondary';
}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, color, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, color, className }))}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
