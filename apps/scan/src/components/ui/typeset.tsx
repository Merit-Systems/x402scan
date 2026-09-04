import { cloneElement, isValidElement } from "react";
import type { ComponentPropsWithoutRef } from "react";

const typesetPresetClasses = {
  docs: "typeset-docs",
} as const;

type TypesetPreset = keyof typeof typesetPresetClasses;

interface TypesetProps extends ComponentPropsWithoutRef<"div"> {
  preset?: TypesetPreset;
}

type TypesetMdxWrapperProps = Pick<TypesetProps, "children" | "preset">;
type TypesetTableProps = ComponentPropsWithoutRef<"table">;
type TypesetLeadProps = ComponentPropsWithoutRef<"p">;

function Typeset({ className, preset = "docs", ...props }: TypesetProps) {
  return (
    <div
      {...props}
      className={["typeset", typesetPresetClasses[preset], className]
        .filter(Boolean)
        .join(" ")}
      data-preset={preset}
      data-slot="typeset"
    />
  );
}

function TypesetMdxWrapper({ children, preset }: TypesetMdxWrapperProps) {
  return <Typeset preset={preset}>{children}</Typeset>;
}

function TypesetTable(props: TypesetTableProps) {
  return (
    <div data-slot="typeset-table-scroll">
      <table {...props} />
    </div>
  );
}

function TypesetLead({ children, ...props }: TypesetLeadProps) {
  const leadProps: ComponentPropsWithoutRef<"p"> & { "data-slot": string } = {
    ...props,
    "data-slot": "typeset-lead",
  };

  if (
    isValidElement<ComponentPropsWithoutRef<"p">>(children) &&
    children.type === "p"
  ) {
    return cloneElement(children, leadProps);
  }

  return <p {...leadProps}>{children}</p>;
}

export { Typeset, TypesetLead, TypesetMdxWrapper, TypesetTable };
export type {
  TypesetLeadProps,
  TypesetMdxWrapperProps,
  TypesetPreset,
  TypesetProps,
  TypesetTableProps,
};
