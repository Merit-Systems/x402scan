"use client";

import { Plus } from "lucide-react";

import { Suspense } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";

export function RegisterButton() {
  return (
    <Suspense fallback={<RegisterLink />}>
      <RouteRegisterButton />
    </Suspense>
  );
}

function RouteRegisterButton() {
  const pathname = usePathname();

  if (pathname === "/resources/register") {
    return null;
  }

  return <RegisterLink />;
}

function RegisterLink() {
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
