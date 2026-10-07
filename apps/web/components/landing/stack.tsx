"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Children, type ReactNode, useRef } from "react";

function StackCard({
  children,
  index,
  total,
  progress,
}: {
  children: ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - index - 1) * 0.045]);
  const dim = useTransform(progress, [start, 1], [0, (total - index - 1) * 0.18]);

  return (
    <div className="lx-stack__slot" style={{ ["--i" as string]: index }}>
      <motion.div className="lx-stack__card" style={{ scale }}>
        {children}
        <motion.div className="lx-stack__dim" style={{ opacity: dim }} aria-hidden="true" />
      </motion.div>
    </div>
  );
}

/** Sticky cards that settle on top of each other while the previous ones recede. */
export function Stack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const items = Children.toArray(children);

  return (
    <div ref={ref} className="lx-stack" data-reduced={reduced ? "true" : undefined}>
      {items.map((child, index) => (
        <StackCard key={index} index={index} total={items.length} progress={scrollYProgress}>
          {child}
        </StackCard>
      ))}
    </div>
  );
}
