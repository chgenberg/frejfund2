'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ReadinessScoreProps {
  score: number;
  variant?: 'default' | 'compact';
  showMessage?: boolean;
}

export default function ReadinessScore({ score, variant = 'default', showMessage = true }: ReadinessScoreProps) {
  // Ensure score is between 0 and 10
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  if (variant === 'compact') {
    return (
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="6"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#000"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={220}
            initial={{ strokeDashoffset: 220 }}
            animate={{ strokeDashoffset: 220 - (normalizedScore / 10) * 220 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-black">{normalizedScore}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="inline-block minimal-box px-16 py-12 relative overflow-hidden"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />
      
      <p className="text-sm text-gray-600 mb-6 font-light uppercase tracking-wider relative z-10">
        Investment Readiness
      </p>
      
      {/* Segmented Circular Progress */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="absolute inset-0 w-full h-full">
          {/* Background segments */}
          {[...Array(10)].map((_, i) => {
            const angle = (i * 36) - 90; // 36 degrees per segment, starting from top
            const x1 = 80 + 70 * Math.cos((angle * Math.PI) / 180);
            const y1 = 80 + 70 * Math.sin((angle * Math.PI) / 180);
            const x2 = 80 + 70 * Math.cos(((angle + 33) * Math.PI) / 180);
            const y2 = 80 + 70 * Math.sin(((angle + 33) * Math.PI) / 180);
            
            return (
              <motion.path
                key={i}
                d={`M 80 80 L ${x1} ${y1} A 70 70 0 0 1 ${x2} ${y2} Z`}
                fill={i < normalizedScore ? '#000' : '#f5f5f5'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  fill: i < normalizedScore ? '#000' : '#f5f5f5'
                }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.5 + i * 0.05,
                  fill: { duration: 0.3, delay: 0.8 + i * 0.05 }
                }}
              />
            );
          })}
          
          {/* Center circle */}
          <circle cx="80" cy="80" r="55" fill="white" />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-6xl font-bold text-black">{normalizedScore}</span>
            <div className="text-lg text-gray-500 -mt-2">out of 10</div>
          </motion.div>
        </div>
        
        {/* Animated pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-black"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeOut"
          }}
        />
      </div>
      
      {/* Status message */}
      {showMessage && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-gray-600 relative z-10"
        >
          {normalizedScore <= 3 && "Early stage - let's build your foundation"}
          {normalizedScore > 3 && normalizedScore <= 6 && "Making progress - keep pushing forward"}
          {normalizedScore > 6 && normalizedScore <= 8 && "Almost there - fine-tune for investors"}
          {normalizedScore > 8 && "Investment ready - time to connect!"}
        </motion.p>
      )}
      
      {/* Progress indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex justify-center space-x-2 mt-4"
      >
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className={`h-1 w-6 rounded-full ${i < normalizedScore ? 'bg-black' : 'bg-gray-200'}`}
            initial={{ width: 0 }}
            animate={{ width: 24 }}
            transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
