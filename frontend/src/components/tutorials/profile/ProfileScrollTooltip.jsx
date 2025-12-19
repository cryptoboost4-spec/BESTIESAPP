import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ProfileScrollTooltip - Tooltip shown after user dismisses customize background tooltip
 * Instructs user to scroll through profile and click settings
 */
const ProfileScrollTooltip = ({ onContinue, onSkip }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <motion.div
          className="pointer-events-auto w-11/12 max-w-sm bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center border border-white/50"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <div className="text-4xl mb-4 animate-bounce-gentle">✨</div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Explore Your Profile
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Scroll through your profile to see everything - your badges, stats, and more! When you're done exploring, click on Settings below to continue learning about the app.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onContinue}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Got it
            </button>
            <button
              onClick={onSkip}
              className="text-gray-600 dark:text-gray-400 text-sm underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileScrollTooltip;



