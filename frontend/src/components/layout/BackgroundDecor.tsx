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
    className="fixed text-2xl z-0 pointer-events-none"
  >
    🚀
    <div className="absolute -bottom-2 -left-2 w-12 h-4 bg-gradient-to-r from-orange-500/0 to-orange-500/40 blur-md -rotate-45 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
  </motion.div>
);

const OrbitingSatellite = ({ duration = 20, delay = 0, radius = 200, scale = 1 }) => (
  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      style={{ width: radius * 2, height: radius * 2 }}
      className="relative flex items-center justify-start rounded-full border border-white/5"
    >
      <motion.div 
        style={{ scale }}
        animate={{ rotate: -360 }} // Counter-rotate so the emoji doesn't spin upside down
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
        className="text-lg -ml-3"
      >
        🛰️
      </motion.div>
    </motion.div>
  </div>
);

export default function BackgroundDecor() {
  // Define rocket variations
  const rockets = [
    { delay: 2, duration: 4, startX: "-5vw", startY: "90vh" },
    { delay: 8, duration: 6, startX: "20vw", startY: "110vh" },
    { delay: 15, duration: 3.5, startX: "-10vw", startY: "120vh" },
    { delay: 22, duration: 5, startX: "50vw", startY: "110vh" },
  ];

  // Define satellite variations
  const satellites = [
    { radius: 250, duration: 30, delay: 0, scale: 0.7 },
    { radius: 400, duration: 45, delay: 5, scale: 1 },
    { radius: 550, duration: 70, delay: 12, scale: 0.8 },
    { radius: 700, duration: 90, delay: 20, scale: 1.2 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Background Rockets */}
      {rockets.map((r, i) => (
        <ShootingRocket key={`rock-${i}`} {...r} />
      ))}
      
      {/* Background Satellites */}
      {satellites.map((s, i) => (
        <OrbitingSatellite key={`sat-${i}`} {...s} />
      ))}
      
      {/* Enhanced Ambient Space Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
      <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-blue-500/5 blur-[100px] rounded-full" />
    </div>
  );
}