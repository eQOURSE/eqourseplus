"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { type ReactNode, useRef } from "react";

/**
 * Product preview that starts tilted back in perspective and settles flat
 * as it scrolls into view. Static under reduced motion.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <div ref={ref} className="q-stage">
      <motion.div
        className="q-stage__inner"
        style={reduced ? undefined : { rotateX, scale, y, transformPerspective: 1600 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
