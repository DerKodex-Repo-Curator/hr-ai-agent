"use client";
import React from 'react';
import { motion } from 'framer-motion';

const ShootingRocket = ({ delay = 0, duration = 4, startX = "-10vw", startY = "100vh" }) => (
  <motion.div
    initial={{ x: startX, y: startY, opacity: 0, rotate: 45 }}
    animate={{ 
      x: "110vw", 
      y: "-10vh", 
      opacity: [0, 1, 1, 0] 
    }}
    transition={{ 
      duration: duration, 
      repeat: Infinity, 
      delay: delay, 
      ease: "linear" 
    }}
    className="fixed text-3xl z-0 pointer-events-none"
  >
    🚀
    <div className="absolute -bottom-2 -left-2 w-16 h-4 bg-gradient-to-r from-orange-500/0 to-orange-500/40 blur-md -rotate-45 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
  </motion.div>
);

const OrbitingSatellite = ({ duration = 20, delay = 0, radius = 200, scale = 1, opacity = 0.5 }) => (
  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      style={{ width: radius * 2, height: radius * 2 }}
      className="relative flex items-center justify-start rounded-full border border-white/[0.015]"
    >
      <motion.div 
        style={{ scale, opacity }}
        animate={{ rotate: -360 }} 
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
        className="text-4xl -ml-6"
      >
        🛰️
      </motion.div>
    </motion.div>
  </div>
);

export default function BackgroundDecor() {
  const rockets = [
    { delay: 12, duration: 6, startX: "-5vw", startY: "95vh" },
    { delay: 35, duration: 8, startX: "30vw", startY: "110vh" },
  ];

  // High-density orbital constellation
  const satellites = [
    // Inner Orbit
    { radius: 200, duration: 25, delay: 0, scale: 0.6, opacity: 0.3 },
    { radius: 300, duration: 35, delay: 5, scale: 0.9, opacity: 0.4 },
    { radius: 450, duration: 50, delay: 12, scale: 1.1, opacity: 0.35 },
    
    // Mid Orbit
    { radius: 600, duration: 70, delay: 20, scale: 1.5, opacity: 0.25 },
    { radius: 750, duration: 85, delay: 3, scale: 1.3, opacity: 0.2 },
    { radius: 900, duration: 110, delay: 15, scale: 2.0, opacity: 0.15 },
    
    // Outer/Deep Orbit (Massive structures)
    { radius: 1100, duration: 140, delay: 8, scale: 2.5, opacity: 0.12 },
    { radius: 1300, duration: 180, delay: 25, scale: 3.2, opacity: 0.1 },
    { radius: 1500, duration: 220, delay: 40, scale: 1.8, opacity: 0.08 },
    { radius: 1750, duration: 280, delay: 10, scale: 2.8, opacity: 0.1 },
    { radius: 2000, duration: 350, delay: 50, scale: 4.0, opacity: 0.05 }, // Titan Class
    { radius: 2300, duration: 450, delay: 5, scale: 1.5, opacity: 0.07 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {rockets.map((r, i) => (
        <ShootingRocket key={`rock-${i}`} {...r} />
      ))}
      
      {satellites.map((s, i) => (
        <OrbitingSatellite key={`sat-${i}`} {...s} />
      ))}
      
      {/* Dynamic Space Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/10 blur-[200px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-900/10 blur-[200px] rounded-full" />
      <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-blue-400/5 blur-[150px] rounded-full" />
    </div>
  );
}