"use client";

import { useTheme } from "next-themes";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const toasterStyle: React.CSSProperties &
  Record<
    "--border-radius" | "--normal-bg" | "--normal-border" | "--normal-text",
    string
  > = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius)",
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const sonnerTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  return (
    <Sonner
      theme={sonnerTheme}
      // Sonner uses `toaster` as a library hook rather than a Tailwind utility.
      // oxlint-disable-next-line tailwindcss/no-unknown-classes
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={toasterStyle}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "type-label",
          description: "type-supporting-body",
          actionButton: "type-label",
          cancelButton: "type-label",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
