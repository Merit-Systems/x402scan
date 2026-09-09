import type { LucideIcon } from "lucide-react";

import type { NextErrorProps } from "@/types/next-error";

export interface ErrorComponentProps {
  errorProps?: NextErrorProps;
  title?: string;
  description?: string;
  Icon?: LucideIcon;
  actions?: React.ReactNode;
}
