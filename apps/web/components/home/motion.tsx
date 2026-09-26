"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface MotionBoxProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  id?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: MotionBoxProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0], // DESIGN.md ease-standard curve
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({
  children,
  staggerDelay = 0.1,
  className,
  ...props
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
} & HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStaggerItem({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.45,
            ease: [0.25, 0.1, 0.25, 1.0],
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleOnHover({
  children,
  className,
  scale = 1.02,
  ...props
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
} & HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      whileHover={{ scale, y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function TimelineSlideIn({
  children,
  side,
  className,
  ...props
}: {
  children: ReactNode;
  side: "left" | "right";
  className?: string;
} & HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <motion.div className={className} {...props}>{children}</motion.div>;
  }

  const initialX = side === "left" ? -50 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: 15 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.55,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
