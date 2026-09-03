import type { ComponentPropsWithoutRef } from "react";

export function DocumentationPage({
  className,
  ...props
}: ComponentPropsWithoutRef<"main">) {
  return (
    <main
      {...props}
      className={["mx-auto w-full max-w-6xl px-2 py-8", className]
        .filter(Boolean)
        .join(" ")}
      data-slot="documentation"
    />
  );
}
