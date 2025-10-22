'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActionCard, { ActionCardType } from './ActionCard';
import { useRouter } from 'next/navigation';

interface ActionCardData {
  id: string;
  type: ActionCardType;
  title: string;
  description: string;
  impact?: string;
  progress?: number;
  details?: string[];
  actionLabel?: string;
  uploadEnabled?: boolean;
  onComplete?: (data: any) => void;
}

interface ActionCardsCarouselProps {
  cards: ActionCardData[];
  onCardComplete?: (cardId: string, data: any) => void;
}

export default function ActionCardsCarousel({ cards, onCardComplete }: ActionCardsCarouselProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardsPerView = isMobile ? 1 : 2;
  const totalPages = Math.ceil(cards.length / cardsPerView);
  const canGoNext = currentIndex < totalPages - 1;
  const canGoPrev = currentIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const visibleCards = cards.slice(
    currentIndex * cardsPerView,
    (currentIndex + 1) * cardsPerView
  );

  const handleCardComplete = (cardId: string, data: any) => {
    onCardComplete?.(cardId, data);
    
    // Trigger analysis update
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (sessionId) {
      // Update analysis with new data
      fetch('/api/deep-analysis/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          cardId,
          data
        })
      });
    }
  };

  return (
    <div className="relative">
      {/* Navigation buttons - Desktop only */}
      {!isMobile && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all ${
              canGoPrev 
                ? 'opacity-100 hover:shadow-xl cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all ${
              canGoNext 
                ? 'opacity-100 hover:shadow-xl cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            disabled={!canGoNext}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </motion.button>
        </>
      )}

      {/* Cards container */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {visibleCards.map((card) => (
              <div key={card.id} className="h-[420px]">
                <ActionCard
                  type={card.type}
                  title={card.title}
                  description={card.description}
                  impact={card.impact}
                  progress={card.progress}
                  details={card.details}
                  actionLabel={card.actionLabel}
                  uploadEnabled={card.uploadEnabled}
                  onComplete={(data) => handleCardComplete(card.id, data)}
                  onAction={() => {
                    // Handle specific card actions
                    if (card.id.includes('chat')) {
                      router.push('/chat');
                    } else if (card.id.includes('analysis')) {
                      router.push('/analysis');
                    }
                  }}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-gray-900 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Mobile swipe hint */}
      {isMobile && cards.length > 1 && (
        <p className="text-center text-xs text-gray-500 mt-4">
          Swipe or tap dots to see more actions
        </p>
      )}
    </div>
  );
}
