"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  body: string;
}

export function FeatureCard({ icon, title, body }: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <h3 className="font-display text-fluid-h3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </motion.article>
  );
}
