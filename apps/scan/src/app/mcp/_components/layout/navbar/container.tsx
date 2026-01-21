'use client';

import React, { useEffect, useState } from 'react';

import { motion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface Props {
  children: React.ReactNode;
}

export const NAVBAR_HEIGHT = 64;

export const NavbarContainer: React.FC<Props> = ({ children }) => {
  const isMobile = useIsMobile();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <motion.nav
      initial={false}
      animate={scrolled ? 'scrolled' : 'top'}
      variants={{
        top: {
          width: '100vw',
          left: 0,
          right: 0,
          borderRadius: '0px',
          borderBottomWidth: '0px',
          borderLeftWidth: '0px',
          borderRightWidth: '0px',
          margin: 0,
          boxShadow: 'none',
        },
        scrolled: {
          width: isMobile ? '100vw' : '80vw',
          left: isMobile ? 0 : '10vw',
          right: isMobile ? 0 : '10vw',
          borderBottomLeftRadius: isMobile ? 0 : '24px',
          borderBottomRightRadius: isMobile ? 0 : '24px',
          borderBottomWidth: '1px',
          borderLeftWidth: isMobile ? 0 : '1px',
          borderRightWidth: isMobile ? 0 : '1px',
          margin: isMobile ? 0 : 'auto',
          boxShadow: isMobile ? 'none' : '0 4px 24px 0 rgba(0,0,0,0.04)',
        },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 z-50 flex items-center justify-between px-4 py-2 backdrop-blur-sm border-t-0 border-border`}
      style={{
        borderStyle: 'solid',
        borderColor: 'rgba(0,0,0,0.08)',
        height: NAVBAR_HEIGHT,
      }}
    >
      {children}
    </motion.nav>
  );
};
