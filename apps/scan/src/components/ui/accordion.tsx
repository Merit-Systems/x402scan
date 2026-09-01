"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { createContext, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const accordionVariants = cva("flex w-full flex-col", {
  variants: {
    variant: {
      list: "",
      sections: "gap-4",
      selector: "gap-4",
    },
  },
  defaultVariants: {
    variant: "list",
  },
});

const accordionItemVariants = cva("", {
  variants: {
    variant: {
      list: "not-last:border-b",
      sections: "",
      selector: "overflow-hidden rounded-xl border-none bg-muted",
    },
  },
});

const accordionTriggerVariants = cva(
  "relative flex flex-1 text-left transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground [&[aria-expanded=true]>[data-slot=accordion-trigger-icon]]:rotate-180",
  {
    variants: {
      variant: {
        list: "type-label items-start justify-between rounded-lg border border-transparent py-2.5 **:data-[slot=accordion-trigger-icon]:ml-auto",
        sections:
          "type-section-title w-fit flex-none items-center justify-start gap-2 rounded-b-none border border-transparent p-0 **:data-[slot=accordion-trigger-icon]:ml-0",
        selector:
          "type-label items-center justify-between border border-transparent px-4 py-2.5 **:data-[slot=accordion-trigger-icon]:ml-auto",
      },
    },
  }
);

const accordionContentVariants = cva(
  "pt-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
  {
    variants: {
      variant: {
        list: "pb-2.5",
        sections: "pb-0",
        selector: "w-full border-t p-0",
      },
    },
  }
);

type AccordionVariant = NonNullable<
  VariantProps<typeof accordionVariants>["variant"]
>;

const AccordionVariantContext = createContext<AccordionVariant>("list");

function Accordion({
  className,
  variant = "list",
  ...props
}: AccordionPrimitive.Root.Props & VariantProps<typeof accordionVariants>) {
  const resolvedVariant = variant ?? "list";

  return (
    <AccordionVariantContext.Provider value={resolvedVariant}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        data-variant={resolvedVariant}
        className={cn(
          accordionVariants({ variant: resolvedVariant }),
          className
        )}
        {...props}
      />
    </AccordionVariantContext.Provider>
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  const variant = useContext(AccordionVariantContext);

  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      data-variant={variant}
      className={cn(accordionItemVariants({ variant }), className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  hideChevron = false,
  ...props
}: AccordionPrimitive.Trigger.Props & { hideChevron?: boolean }) {
  const variant = useContext(AccordionVariantContext);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        data-variant={variant}
        className={cn(accordionTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
        {hideChevron ? null : (
          <ChevronDownIcon
            data-slot="accordion-trigger-icon"
            className="pointer-events-none shrink-0 transition-transform duration-200 motion-reduce:duration-0"
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  const variant = useContext(AccordionVariantContext);

  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      data-variant={variant}
      className="type-supporting-body h-(--accordion-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:duration-0"
      {...props}
    >
      <div className={cn(accordionContentVariants({ variant }), className)}>
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
