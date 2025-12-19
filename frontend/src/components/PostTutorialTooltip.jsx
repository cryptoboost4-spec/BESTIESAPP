import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PostTutorialTooltip = ({ step, onOkay, onLater, onContinue, onSkip }) => {

  if (step === 'add-bestie') {
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
            <div className="text-4xl mb-4 animate-bounce-gentle">💜</div>
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Ready to Add a Bestie?
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Click one of the add buttons (+) in the circle to invite your first bestie!
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onOkay}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Okay
              </button>
              <button
                onClick={onLater}
                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Do it later
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (step === 'click-besties-tab') {
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
              Ready to Learn More?
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Click on the Besties menu tab above to continue learning about the app!
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
  }

  return null;
};

export default PostTutorialTooltip;

