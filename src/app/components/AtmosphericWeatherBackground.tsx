import { motion, AnimatePresence } from 'motion/react';
import React, { useMemo } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface WeatherBackgroundProps {
  timeOfDay: TimeOfDay;
  weatherCondition?: 'sunny' | 'cloudy' | 'rainy' | 'clear';
  temperature?: string;
  cityName?: string;
}

export default function AtmosphericWeatherBackground({
  timeOfDay = 'morning',
  weatherCondition = 'clear',
  temperature = '24°C',
  cityName,
}: WeatherBackgroundProps) {
  // Generate stable random stars for night
  const stars = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      x: (i * 37) % 100,
      y: (i * 53) % 85,
      size: (i % 3) + 1.2,
      opacity: 0.25 + ((i % 5) * 0.15),
      duration: 2.5 + (i % 4),
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {timeOfDay === 'morning' && (
          <motion.div
            key="morning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 25% 15%, rgba(245, 158, 11, 0.38) 0%, rgba(13, 94, 60, 0.65) 45%, #012819 100%)',
            }}
          >
            {/* Morning Rising Sun */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.75, 0.95, 0.75] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[8%] left-[18%] w-56 h-56 rounded-full blur-[70px]"
              style={{ background: 'radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 80%)' }}
            />
            {/* Soft morning rays */}
            <div
              className="absolute top-0 left-0 w-full h-[60%] opacity-25"
              style={{
                background: 'linear-gradient(135deg, rgba(253, 230, 138, 0.4) 0%, transparent 60%)',
              }}
            />
            {/* Drifting morning clouds */}
            <motion.div
              animate={{ x: ['-20vw', '110vw'] }}
              transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
              className="absolute top-[16%] opacity-20"
            >
              <svg width="220" height="70" viewBox="0 0 220 70" fill="none">
                <path d="M20 50 C20 35 35 25 50 25 C60 10 85 10 100 20 C115 15 140 20 145 35 C160 35 175 45 170 55 C165 65 30 65 20 50 Z" fill="#D1F2EB" />
              </svg>
            </motion.div>
            {/* Silhouette morning birds */}
            <motion.div
              animate={{ x: ['110vw', '-20vw'], y: [0, -15, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              className="absolute top-[12%] opacity-35"
            >
              <svg width="48" height="18" viewBox="0 0 48 18" fill="none">
                <path d="M0 10 Q 12 0 24 10 Q 36 0 48 10 Q 36 6 24 12 Q 12 6 0 10 Z" fill="#50C878" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        {timeOfDay === 'afternoon' && (
          <motion.div
            key="afternoon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 12%, rgba(56, 189, 248, 0.28) 0%, rgba(11, 110, 79, 0.7) 48%, #012b1c 100%)',
            }}
          >
            {/* High Day Sun */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[4%] left-[45%] w-64 h-64 rounded-full blur-[65px]"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 45%, transparent 75%)' }}
            />
            {/* Solar brilliance gradient */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at 50% 20%, rgba(80, 200, 120, 0.35) 0%, transparent 60%)',
              }}
            />
            {/* Fast summer cloud */}
            <motion.div
              animate={{ x: ['-25vw', '115vw'] }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              className="absolute top-[22%] opacity-15"
            >
              <svg width="260" height="80" viewBox="0 0 260 80" fill="none">
                <path d="M30 60 C30 40 50 30 70 30 C85 10 120 10 140 25 C160 15 190 25 195 40 C215 42 230 55 220 68 C210 75 40 75 30 60 Z" fill="#ffffff" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        {timeOfDay === 'evening' && (
          <motion.div
            key="evening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 70% 30%, rgba(244, 63, 94, 0.42) 0%, rgba(147, 51, 234, 0.38) 35%, rgba(11, 75, 54, 0.75) 68%, #011d13 100%)',
            }}
          >
            {/* Setting Crimson/Amber Sun */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.75, 0.95, 0.75] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[18%] right-[16%] w-60 h-60 rounded-full blur-[75px]"
              style={{ background: 'radial-gradient(circle, #fb923c 0%, #f43f5e 50%, #9333ea 80%, transparent 95%)' }}
            />
            {/* Dusk horizon glow */}
            <div
              className="absolute bottom-0 inset-x-0 h-[45%] opacity-35"
              style={{
                background: 'linear-gradient(to top, rgba(245, 158, 11, 0.3) 0%, rgba(244, 63, 94, 0.15) 50%, transparent 100%)',
              }}
            />
            {/* Dusk clouds silhouette */}
            <motion.div
              animate={{ x: ['110vw', '-25vw'] }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              className="absolute top-[28%] opacity-25"
            >
              <svg width="320" height="90" viewBox="0 0 320 90" fill="none">
                <path d="M40 70 C40 45 70 35 95 35 C115 15 155 15 180 30 C205 20 245 30 250 50 C275 52 290 65 280 80 C270 88 50 88 40 70 Z" fill="#fda4af" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        {timeOfDay === 'night' && (
          <motion.div
            key="night"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 75% 15%, rgba(99, 102, 241, 0.28) 0%, rgba(15, 34, 38, 0.92) 45%, #01140e 100%)',
            }}
          >
            {/* Starfield */}
            {stars.map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  boxShadow: s.size > 2 ? '0 0 6px rgba(209,242,235,0.8)' : 'none',
                }}
                animate={{ opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
                transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {/* Glowing Moon */}
            <motion.div
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[8%] right-[14%] w-32 h-32 rounded-full blur-[45px]"
              style={{ background: 'radial-gradient(circle, #e0e7ff 0%, #818cf8 40%, transparent 70%)' }}
            />
            <div
              className="absolute top-[10%] right-[16%] w-14 h-14 rounded-full border border-indigo-200/40"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
                boxShadow: '0 0 25px rgba(224, 231, 255, 0.6)',
              }}
            />

            {/* Nebula emerald aura */}
            <div
              className="absolute top-[35%] left-[10%] w-[500px] h-[300px] rounded-full blur-[110px] opacity-25"
              style={{ background: 'radial-gradient(circle, #50C878 0%, #0B6E4F 50%, transparent 80%)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle vignettes and grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'linear-gradient(to right, rgba(1, 50, 32, 0.95) 0%, rgba(1, 50, 32, 0.65) 42%, rgba(1, 50, 32, 0.15) 75%, transparent 100%)',
        }}
      />
    </div>
  );
}
