"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";

export const LogoContainer = ({ children }: { children: React.ReactNode }) => {
  const { scrollY } = useScroll();

  const size = useTransform(scrollY, [0, 56], [32, 24]);
  const top = useTransform(scrollY, [0, 56], [20, 14]);

  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => {
      setIsFixed(v > 0);
    });
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <motion.div
      className="left-2 z-50 shrink-0 rounded-md bg-card p-1 md:left-6"
      style={{
        height: size,
        width: size,
        position: isFixed ? "fixed" : "absolute",
        top: top,
      }}
    >
      {children}
    </motion.div>
  );
};
