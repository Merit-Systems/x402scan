"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function RegisterButton() {
  const pathname = usePathname();

  if (pathname === "/resources/register") {
    return null;
  }

  return (
    <>
      <div className="hidden h-5 border-l sm:block" />
      <Link
        href="/resources/register"
        aria-label="Register API"
        className={buttonVariants({ className: "px-2", size: "default" })}
      >
        <Plus className="size-3.5" />
        <span className="hidden xl:inline">Register API</span>
      </Link>
    </>
  );
}
