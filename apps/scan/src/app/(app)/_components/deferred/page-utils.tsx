import React from "react";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

import { isValidElement } from "react";

import type { ReactElement, ReactNode } from "react";
import type { Route } from "next";

interface HeadingProps {
  title: string | ReactElement;
  icon?: ReactNode;
  description?: string | ReactElement;
  actions?: ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  icon,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <HeadingContainer
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
        className
      )}
    >
      <div className="flex flex-1 shrink-0 items-center gap-4">
        {icon}
        <div className="flex flex-col gap-1 text-left md:gap-3">
          {isValidElement(title) ? (
            title
          ) : (
            <h1 className="type-page-title">{title}</h1>
          )}
          {description &&
            (isValidElement(description) ? (
              description
            ) : (
              <p className="type-supporting-body text-muted-foreground/80">
                {description}
              </p>
            ))}
        </div>
      </div>
      {actions}
    </HeadingContainer>
  );
};

const HeadingContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "max-w-full md:max-w-6xl w-full px-2 pb-6 md:pb-8 mx-auto",
          className
        )}
      >
        {children}
      </div>
      <Separator />
    </>
  );
};

interface BodyProps {
  children: ReactNode;
  className?: string;
}

export const Body: React.FC<BodyProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 max-w-6xl w-full mx-auto py-8 px-2",
        className
      )}
    >
      {children}
    </div>
  );
};

interface SectionProps<T extends string> {
  title: string | ReactElement;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  href?: Route<T>;
}

const SectionHeader = ({
  title,
  href,
}: {
  title: string | ReactElement;
  href?: string;
}) => {
  return (
    <div
      className={cn("flex items-center gap-1", href && "group cursor-pointer")}
    >
      {isValidElement(title) ? (
        title
      ) : (
        <h1 className="type-page-title">{title}</h1>
      )}
      {href && (
        <div className="flex items-center gap-2 rounded-md bg-muted/0 p-0.5 transition-all group-hover:translate-x-1 hover:scale-105 hover:bg-muted">
          <ChevronRight className="size-4 text-foreground/60 group-hover:text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export const Section = <T extends string>({
  children,
  title,
  actions,
  description,
  className,
  href,
}: SectionProps<T>) => {
  return (
    <div className={cn("flex flex-col gap-4 md:gap-6", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          {href ? (
            <Link href={href}>
              <SectionHeader title={title} href={href} />
            </Link>
          ) : (
            <SectionHeader title={title} href={href} />
          )}
          {actions}
        </div>
        {description && (
          <p className="type-supporting-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};
