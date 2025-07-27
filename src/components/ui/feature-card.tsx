'use client'

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, Braces, Cpu, Users } from 'lucide-react';

type IconType = typeof Brain | typeof Braces | typeof Cpu | typeof Users;

interface FeatureCardProps {
  title: string;
  description: string;
  icon: IconType;
  gradientFrom: string;
  gradientTo: string;
}

export function FeatureCard({ title, description, icon: Icon, gradientFrom, gradientTo }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="group relative"
    >
      <div 
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-${gradientFrom} to-${gradientTo} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20`}
      />
      <div className="relative h-full rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm transition-colors hover:border-white/20">
        <div 
          className={`inline-flex rounded-xl bg-gradient-to-br from-${gradientFrom} to-${gradientTo} p-3`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-white/60">{description}</p>
      </div>
    </motion.div>
  );
}

export const features = [
  {
    title: "AI Code Understanding",
    description: "Ask questions about your code and get instant, context-aware answers from our AI assistant.",
    icon: Brain,
    gradientFrom: "blue-500",
    gradientTo: "indigo-500"
  },
  {
    title: "Smart Analysis",
    description: "Get comprehensive insights into your codebase structure, dependencies, and complexity metrics.",
    icon: Cpu,
    gradientFrom: "purple-500",
    gradientTo: "pink-500"
  },
  {
    title: "Team Collaboration",
    description: "Share insights, create meeting summaries, and collaborate seamlessly with your development team.",
    icon: Users,
    gradientFrom: "green-500",
    gradientTo: "emerald-500"
  },
  {
    title: "Code Context",
    description: "Save and continue conversations with full code context, never lose track of important discussions.",
    icon: Braces,
    gradientFrom: "orange-500",
    gradientTo: "red-500"
  }
] as const; 