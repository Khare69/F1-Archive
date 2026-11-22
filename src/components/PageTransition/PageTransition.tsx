import React from 'react';
import { motion } from 'framer-motion';

import type { Transition } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const pageTransition: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1], // matches --transition-fast cubic-bezier
  duration: 0.35
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);
