"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { NAVBAR_HEIGHT } from "./container";

interface Props {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const NavbarLinkButton: React.FC<Props> = ({ id, children, className }) => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px",
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div
      className={cn(
        "cursor-pointer rounded-full border border-transparent px-4 py-1 opacity-60 transition-all",
        "hover:opacity-100",
        activeSection === id && "border-border opacity-100",
        className
      )}
      onClick={() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = NAVBAR_HEIGHT + 64;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: elementPosition, behavior: "smooth" });
        }
      }}
    >
      {children}
    </div>
  );
};
