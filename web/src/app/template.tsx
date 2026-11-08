'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Each page fades and rises in as you navigate to it. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.main initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.main>
  );
}
