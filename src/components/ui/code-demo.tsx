'use client'

import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export function CodeDemo() {
  return (
    <div className="relative rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="text-white/40">terminal</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/60">
          <Terminal className="h-4 w-4" />
          <span>npx create-codesaarthi-app my-project</span>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-emerald-400"
        >
          ✓ Project created successfully
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-white/60"
        >
          Get started with:
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="pl-2 text-white/40"
        >
          cd my-project<br />
          npm install<br />
          npm run dev
        </motion.div>
      </div>
    </div>
  );
} 