"use client";

import { ErrorCard } from "./_components/error/card";

import type { Metadata } from "next";
import type { NextErrorProps } from "@/types/next-error";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Error",
  description: "An error has occurred.",
};

export default function GlobalError(props: NextErrorProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex h-screen w-screen flex-col items-center justify-center bg-card antialiased">
        <ErrorCard errorProps={props} />
      </body>
    </html>
  );
}
