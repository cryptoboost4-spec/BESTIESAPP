import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import './BestieCircleTutorial.css';

/**
 * BestieCircleTutorial - Optimized Edition
 *
 * Performance optimizations:
 * - Reduced particle count
 * - Simplified animations
 * - Optimized re-renders with useMemo
 * - GPU acceleration hints
 */

const TUTORIAL_STEPS = {
    MOMENT_0: 0,
    STEP_1: 1, // Single Slot Focus
    STEP_2: 2, // Avatar Appearance
    STEP_3: 3, // Status Demo
    STEP_4: 4, // Vibe Score (Burning Ring)
    STEP_5: 5, // Final / Ready State
};

const STEP_DELAYS = {
    [TUTORIAL_STEPS.MOMENT_0]: 1200, // Reduced from 1800
    [TUTORIAL_STEPS.STEP_1]: 300,    // Reduced from 500
    [TUTORIAL_STEPS.STEP_2]: 1000,   // Reduced from 1500
    [TUTORIAL_STEPS.STEP_3]: 700,    // Reduced from 1000
    [TUTORIAL_STEPS.STEP_4]: 700,    // Reduced from 1000
    [TUTORIAL_STEPS.STEP_5]: 1000    // Reduced from 1500
};

const BestieCircleTutorial = ({ isActive, onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState(TUTORIAL_STEPS.MOMENT_0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showCongratulation, setShowCongratulation] = useState(false);
    const [butterflies, setButterflies] = useState([]); // Array of butterfly objects

    // Initial Confetti ("The Sacred Transition")
    useEffect(() => {
        if (isActive && currentStep === TUTORIAL_STEPS.MOMENT_0) {
            const timer = setTimeout(() => {
                const count = 200;
                const defaults = { origin: { y: 0.7 }, zIndex: 11000 };
                const fire = (ratio, opts) => confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });

                fire(0.25, { spread: 26, startVelocity: 55, colors: ['#fce7f3', '#fbcfe8'], scalar: 0.8 });
                fire(0.2, { spread: 60, colors: ['#a855f7'], scalar: 1.2 });
                fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });

                setTimeout(() => setCurrentStep(TUTORIAL_STEPS.STEP_1), 1500);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isActive, currentStep]);

    // Sequencing: Tooltip logic with delay
    useEffect(() => {
        setShowTooltip(false);
        const delay = STEP_DELAYS[currentStep] || 1000;
        const timer = setTimeout(() => setShowTooltip(true), delay);
        return () => clearTimeout(timer);
    }, [currentStep]);

    const handleNext = (e) => {
        // "Dissolve into butterflies" effect
        let rect = null;
        if (e && e.target) {
            rect = e.target.closest('.tutorial-tooltip')?.getBoundingClientRect();
        }

        if (rect) {
            triggerButterflies(rect);
        }

        setShowTooltip(false);

        setTimeout(() => {
            if (currentStep < TUTORIAL_STEPS.STEP_5) {
                setCurrentStep(c => c + 1);
            } else {
                handleComplete();
            }
        }, 300);
    };

    const triggerFinalExit = useCallback(() => {
        const defaults = { origin: { y: 0.8 }, zIndex: 11000, colors: ['#ec4899', '#f472b6'] };
        confetti({ ...defaults, particleCount: 40, scalar: 2, shape: 'circle' });
    }, []);

    const handleComplete = useCallback(() => {
        // Final Exit Animation
        triggerFinalExit();
        setTimeout(() => {
            // Show congratulation message
            setShowCongratulation(true);
            onComplete && onComplete();
        }, 2000);
    }, [onComplete, triggerFinalExit]);
    
    const handleCongratulationClose = useCallback(() => {
        setShowCongratulation(false);
        onClose && onClose();
    }, [onClose]);

    const triggerButterflies = useCallback((rect) => {
        // Reduced butterfly count from 12 to 6 for better performance
        const newButterflies = Array.from({ length: 6 }).map((_, i) => {
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            return {
                id: Date.now() + i,
                x,
                y,
                targetX: x + (Math.random() - 0.5) * 400, // Pre-calculate target
                targetY: y - Math.random() * 400 - 100, // Pre-calculate target
                angle: Math.random() * 360,
                delay: Math.random() * 0.2,
                color: Math.random() > 0.5 ? '#F472B6' : '#A855F7'
            };
        });

        setButterflies(prev => [...prev, ...newButterflies]);

        setTimeout(() => {
            setButterflies(prev => prev.filter(b => !newButterflies.includes(b)));
        }, 2000);
    }, []);

    if (!isActive) return null;

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center font-sans overflow-hidden rounded-[inherit] pointer-events-none"
            style={{
                borderRadius: 'inherit',
                willChange: 'opacity', // GPU acceleration hint
                transform: 'translateZ(0)' // Force GPU layer
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Global Background Layer - Dream Circle Style */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-br from-green-50 via-emerald-50 via-teal-50 via-pink-50 to-purple-50 border-4 border-green-300 z-0" style={{ willChange: 'transform' }}>
                <DreamscapeBackground />
                <ButterflySystem butterflies={butterflies} />
            </div>

            {/* Main Stage */}
            <div className="relative w-full h-full flex items-center justify-center transition-transform duration-1000 z-10 pointer-events-none">
                <div className="relative transition-transform duration-1000 w-full h-full flex items-center justify-center scale-100">
                    <LivingCircleStage currentStep={currentStep} />
                </div>
            </div>

            {/* Tooltip Layer */}
            <AnimatePresence>
                {showTooltip && currentStep !== TUTORIAL_STEPS.MOMENT_0 && (
                    <div className="absolute inset-0 flex items-end justify-center pb-8 z-30 pointer-events-auto">
                        <TutorialTooltip
                            key={currentStep}
                            step={currentStep}
                            onNext={handleNext}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Congratulation Message - shown after tutorial completes */}
            <AnimatePresence>
                {showCongratulation && (
                    <div className="absolute inset-0 flex items-end justify-center pb-8 z-30 pointer-events-auto">
                        <motion.div
                            className="tutorial-tooltip w-11/12 max-w-sm bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center border border-white/50"
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                            transition={{ type: "spring", bounce: 0.4 }}
                        >
                            <div className="text-4xl mb-4 animate-bounce-gentle">🎉</div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                                Amazing Work!
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                You've learned about your Bestie Circle! Want to continue the tutorial? Click on the Besties menu option (it just appeared!)
                            </p>

                            <button
                                onClick={handleCongratulationClose}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Got it!
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- VISUAL COMPONENTS ---

const DreamscapeBackground = memo(() => (
    <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
        {/* Dream Circle style gradient - Simplified for performance */}
        <motion.div
            className="absolute inset-0 opacity-30"
            style={{
                background: 'radial-gradient(circle at 50% 50%, #10b981 0%, #34d399 30%, #ec4899 60%, #f472b6 80%, transparent 100%)',
                willChange: 'transform, opacity'
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle overlay for depth - removed for performance */}
        {/* <FallingStars /> - Disabled for better performance */}
    </div>
));

const FallingStars = () => {
    // Reduced from 5 to 3 stars for better performance
    const stars = useMemo(() =>
        Array.from({ length: 3 }).map((_, i) => ({
            initialX: Math.random() * 100,
            animateX: Math.random() * 100,
            duration: Math.random() * 2 + 3,
            delay: Math.random() * 10
        }))
    , []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
                    initial={{ x: `${star.initialX}%`, y: -10, opacity: 0 }}
                    animate={{ x: `${star.animateX}%`, y: "100%", opacity: [0, 1, 0] }}
                    transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "linear" }}
                />
            ))}
        </div>
    )
}

const ButterflySystem = memo(({ butterflies }) => (
    <div className="absolute inset-0 pointer-events-none z-[10000]">
        <AnimatePresence>
            {butterflies.map(b => (
                <Butterfly key={b.id} data={b} />
            ))}
        </AnimatePresence>
    </div>
));

const Butterfly = memo(({ data }) => {
    // Pre-calculate random values when butterfly is created (in triggerButterflies)
    const targetX = data.targetX ?? (data.x + (Math.random() - 0.5) * 400);
    const targetY = data.targetY ?? (data.y - Math.random() * 400 - 100);

    return (
        <motion.div
            initial={{ x: data.x, y: data.y, scale: 0, opacity: 1 }}
            animate={{
                x: targetX,
                y: targetY,
                scale: [0, 1, 0],
                opacity: 0
            }}
            transition={{ duration: 1, ease: "easeOut" }} // Reduced from 1.2
            className="absolute"
            style={{ willChange: 'transform, opacity' }} // GPU hint
        >
            <div className="w-3 h-3" style={{  // Reduced from w-4 h-4
                background: `radial-gradient(circle, ${data.color}, transparent)`,
                filter: 'blur(1px)',
                willChange: 'transform'
            }}>
                <motion.div
                    animate={{ scaleX: [1, 0.2, 1] }}
                    transition={{ duration: 0.12, repeat: Infinity }} // Slightly faster
                    className="w-full h-full rounded-full bg-white/80"
                    style={{ willChange: 'transform' }}
                />
            </div>
        </motion.div>
    );
});

// --- MAIN STAGE COORDINATOR ---

const LivingCircleStage = memo(({ currentStep }) => {
    return (
        <div className="relative w-full h-full preserve-3d">
            {/* SVG Connection Lines Overlay - Dream Circle Style */}
            <ConnectionLinesOverlay currentStep={currentStep} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <YouBubbleCore currentStep={currentStep} />
            </div>
            <SlotRing currentStep={currentStep} />
        </div>
    );
});

// --- COMPONENT: YOU BUBBLE ---

const YouBubbleCore = memo(({ currentStep }) => {
    const isStep4 = currentStep === TUTORIAL_STEPS.STEP_4; // Vibe Score
    const isStepFinal = currentStep === TUTORIAL_STEPS.STEP_5;

    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    useEffect(() => {
        if (isStep4) {
            setShowScore(true);
            let startTime = null;
            const animate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / 1500, 1); // 1.5 seconds total
                const newScore = Math.floor(progress * 80);
                setScore(newScore);
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else {
            setShowScore(false);
            setScore(0);
        }
    }, [isStep4]);

    return (
        <motion.div
            className="w-24 h-24 relative flex items-center justify-center"
            animate={{
                scale: isStep4 ? 1.3 : isStepFinal ? 1 : 1
            }}
            transition={{ duration: 0.8 }}
        >
            {/* Dream Circle style center - Green gradient like perfect circle */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-breathe-perfect bg-gradient-to-br from-green-500 to-emerald-500 border-4 border-white ring-4 ring-green-300" style={{ willChange: 'transform' }} />

            {(isStep4) && (
                <div className="absolute inset-0 rounded-full overflow-hidden mix-blend-overlay opacity-60">
                    {/* Simplified plasma effect */}
                </div>
            )}

            <div className="relative z-10 text-white font-bold text-xl drop-shadow-md">
                <AnimatePresence mode="wait">
                    {showScore ? (
                        <motion.div
                            key="score"
                            initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            className="text-3xl"
                        >
                            {score}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="you"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            YOU
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isStep4 && <BurningProgressRing />}

            {isStep4 && (
                <>
                    <div className="absolute inset-[-20px] rounded-full border border-purple-400/30 animate-orbit-reverse" />
                    <div className="absolute inset-[-40px] rounded-full border border-pink-400/20 animate-orbit" />
                </>
            )}
        </motion.div>
    )
});

const BurningProgressRing = () => {
    return (
        <svg className="absolute -inset-3 w-[120px] h-[120px] rotate-[-90deg] overflow-visible" style={{ willChange: 'transform' }}>
            <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
            <motion.circle
                cx="60" cy="60" r="56"
                stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 0.8 }}
                transition={{ duration: 1.2, ease: "easeOut" }} // Slightly faster
                style={{
                    filter: 'drop-shadow(0 0 4px #fbcfe8)', // Simplified shadow
                    willChange: 'stroke-dashoffset'
                }}
            />
        </svg>
    )
}

// --- COMPONENT: CONNECTION LINES OVERLAY (Dream Circle Style) ---

const ConnectionLinesOverlay = memo(({ currentStep }) => {
    // Memoize slot positions calculation - only calculate once
    const slots = useMemo(() => 
        Array.from({ length: 5 }).map((_, index) => {
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const radius = 45; // Percentage radius (matching Dream Circle exactly)
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return { index, x, y, angle };
        })
    , []);

    // Memoize computed values
    const isTopSlotActive = useMemo(() => 
        currentStep === TUTORIAL_STEPS.STEP_2 || currentStep === TUTORIAL_STEPS.STEP_3,
        [currentStep]
    );
    const isTopSlotElectric = useMemo(() => 
        currentStep === TUTORIAL_STEPS.STEP_3,
        [currentStep]
    );

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <defs>
                {/* Gradients for each line - horizontal gradient matching Dream Circle exactly */}
                {slots.map((slot) => (
                    <linearGradient 
                        key={`gradient-${slot.index}`} 
                        id={`tutorial-line-gradient-${slot.index}`} 
                        x1="0%" 
                        y1="0%" 
                        x2="100%" 
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                        <stop offset="25%" stopColor="#14b8a6" stopOpacity="1" />
                        <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                        <stop offset="75%" stopColor="#a855f7" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                    </linearGradient>
                ))}
                {/* Glow filter for active lines - simplified for better performance */}
                <filter id="tutorial-line-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            {/* Render connection lines for each slot */}
            {slots.map((slot) => {
                const isActive = slot.index === 0 && isTopSlotActive;
                const isElectric = slot.index === 0 && isTopSlotElectric;
                // Show lines from STEP_1 onwards, but only the top slot gets the energy ray effect
                const isVisible = currentStep >= TUTORIAL_STEPS.STEP_1;

                return (
                    <g key={`line-group-${slot.index}`}>
                        {/* Connection line - visible ray of energy (matches Dream Circle exactly) */}
                        {isVisible && (
                            <line
                                x1="50%"
                                y1="50%"
                                x2={`${slot.x}%`}
                                y2={`${slot.y}%`}
                                stroke={isActive ? `url(#tutorial-line-gradient-${slot.index})` : "rgba(16, 185, 129, 0.3)"}
                                strokeWidth={isActive ? "5" : "3"}
                                filter={isActive ? "url(#tutorial-line-glow)" : "none"}
                                strokeLinecap="round"
                            >
                                {/* Use SVG animate instead of CSS class for better performance */}
                                {isActive && (
                                    <animate
                                        attributeName="opacity"
                                        values="0.6;1;0.6"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                )}
                            </line>
                        )}

                        {/* Particles flowing along active lines - reduced from 4 to 2 for performance */}
                        {isActive && !isElectric && (
                            <>
                                {/* Green particle */}
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="5"
                                    fill="#10b981"
                                    opacity="0.9"
                                >
                                    <animate
                                        attributeName="cx"
                                        values={`50%;${slot.x}%;50%`}
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2}s`}
                                    />
                                    <animate
                                        attributeName="cy"
                                        values={`50%;${slot.y}%;50%`}
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2}s`}
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0;0.9;0.5;0;0"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2}s`}
                                    />
                                </circle>
                                {/* Pink particle */}
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="4"
                                    fill="#ec4899"
                                    opacity="0.85"
                                >
                                    <animate
                                        attributeName="cx"
                                        values={`50%;${slot.x}%;50%`}
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2 + 0.5}s`}
                                    />
                                    <animate
                                        attributeName="cy"
                                        values={`50%;${slot.y}%;50%`}
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2 + 0.5}s`}
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0;0.85;0.5;0;0"
                                        dur="2s"
                                        repeatCount="indefinite"
                                        begin={`${slot.index * 0.2 + 0.5}s`}
                                    />
                                </circle>
                            </>
                        )}
                    </g>
                );
            })}
        </svg>
    );
});

// --- COMPONENT: SLOT RING ---

const SlotRing = memo(({ currentStep }) => {
    return (
        <div className="absolute inset-0">
            {Array.from({ length: 5 }).map((_, i) => (
                <SingleSlot key={i} index={i} currentStep={currentStep} />
            ))}
        </div>
    )
});

const SingleSlot = memo(({ index, currentStep }) => {
    // Memoize position calculations
    const { x, y } = useMemo(() => {
        const angle = (index * 72 - 90) * (Math.PI / 180);
        const radius = 140;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }, [index]);

    // Memoize slot styles
    const { borderColor, textColor } = useMemo(() => {
        const slotStyles = [
            { border: 'border-pink-500', text: 'text-pink-500' },
            { border: 'border-purple-500', text: 'text-purple-500' },
            { border: 'border-blue-500', text: 'text-blue-500' },
            { border: 'border-green-500', text: 'text-green-500' },
            { border: 'border-orange-500', text: 'text-orange-500' },
        ];
        const style = slotStyles[index] || slotStyles[0];
        return { borderColor: style.border, textColor: style.text };
    }, [index]);

    // Memoize computed values
    const isTopSlot = index === 0;
    const isAwakening = useMemo(() => isTopSlot && currentStep === TUTORIAL_STEPS.STEP_2, [isTopSlot, currentStep]);
    const isExhaling = useMemo(() => !isTopSlot && currentStep === TUTORIAL_STEPS.STEP_2, [isTopSlot, currentStep]);
    const isBlooming = useMemo(() => isTopSlot && currentStep === TUTORIAL_STEPS.STEP_3, [isTopSlot, currentStep]);

    // Memoize variants object
    const variants = useMemo(() => ({
        dim: { opacity: 0.3, scale: 0.9, filter: 'blur(2px)' },
        awake: { opacity: 1, scale: 1.1, filter: 'blur(0px)' },
        normal: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        hidden: { opacity: 0, scale: 0 }
    }), []);

    // Memoize state calculation
    const state = useMemo(() => {
        if (currentStep === TUTORIAL_STEPS.STEP_1) return 'normal';
        else if (currentStep === TUTORIAL_STEPS.STEP_2) return isTopSlot ? 'awake' : 'dim';
        else if (currentStep === TUTORIAL_STEPS.STEP_3) return isTopSlot ? 'awake' : 'dim';
        else if (currentStep === TUTORIAL_STEPS.STEP_4) return 'dim';
        else if (currentStep === TUTORIAL_STEPS.STEP_5) return 'awake';
        return 'normal';
    }, [currentStep, isTopSlot]);

    return (
        <>
            <motion.div
                className="absolute w-16 h-16 rounded-full flex items-center justify-center top-1/2 left-1/2 -ml-8 -mt-8"
                style={{ x, y }}
                animate={state}
                variants={variants}
                transition={{ duration: 0.6 }}
            >
                {isAwakening && <SunriseEffect />}
                {isExhaling && <MistEffect delay={index * 0.1} />}

                <div className="relative w-full h-full">
                    {!isBlooming && (
                        <DashedBorder
                            fastSpin={isTopSlot && currentStep === TUTORIAL_STEPS.STEP_3}
                            colorClass={borderColor}
                        />
                    )}

                    <AnimatePresence>
                        {!isBlooming && (
                            <motion.div
                                className={`absolute inset-0 flex items-center justify-center ${textColor}`}
                                exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                            >
                                <span className="text-2xl font-bold">+</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isBlooming && <MockAvatarSequence />}
                    
                    {/* Dream Circle style - Perfect Status Badge when active */}
                    {isBlooming && (
                        <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-lg animate-pulse-fast"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            🔥
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </>
    );
});

const SunriseEffect = () => (
    <div className="absolute inset-[-40px] pointer-events-none -z-10">
        <motion.div
            className="w-full h-full bg-gradient-radial from-orange-400/40 to-transparent opacity-0"
            animate={{ opacity: [0, 1, 0.5], scale: [0.5, 1.2, 1] }}
            transition={{ duration: 1 }}
        />
        <motion.div
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,white_10deg,transparent_20deg,white_30deg,transparent_40deg)] opacity-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ maskImage: 'radial-gradient(circle, transparent 30%, black 70%)' }}
        />
    </div>
)

const MistEffect = ({ delay }) => (
    <motion.div
        className="absolute -top-4 left-0 w-full h-12 bg-purple-300/30 blur-xl rounded-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 0.6, 0], y: -20, scale: 1.5 }}
        transition={{ duration: 2, delay, ease: "easeOut" }}
    />
)

const DashedBorder = ({ fastSpin, colorClass }) => (
    <motion.div
        className={`absolute inset-0 rounded-full border-[6px] border-dashed ${colorClass}`}
        animate={{ rotate: 360 }}
        transition={{
            duration: fastSpin ? 2 : 20,
            repeat: Infinity,
            ease: "linear"
        }}
    />
)

const MockAvatarSequence = () => {
    const [stage, setStage] = useState('seed');

    useEffect(() => {
        const t1 = setTimeout(() => setStage('bloom'), 400);
        const t2 = setTimeout(() => setStage('done'), 1400);
        return () => { clearTimeout(t1); clearTimeout(t2); }
    }, []);

    const [status, setStatus] = useState('safe');
    useEffect(() => {
        if (stage === 'done') {
            const t1 = setTimeout(() => setStatus('checkin'), 2000);
            const t2 = setTimeout(() => setStatus('support'), 4500);
            const t3 = setTimeout(() => setStatus('safe'), 7000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }
        }
    }, [stage]);

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {stage === 'seed' && (
                <motion.div
                    className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: 2, duration: 0.2 }}
                />
            )}

                    {(stage === 'bloom' || stage === 'done') && (
                        <motion.div
                            className="w-full h-full rounded-full overflow-hidden border-[3px] bg-gray-100 relative z-10 shadow-xl border-4 border-white ring-6 ring-green-300"
                            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                            animate={{
                                clipPath: 'circle(100% at 50% 50%)',
                                borderColor: status === 'safe' ? '#10b981' : status === 'checkin' ? '#facc15' : '#c084fc'
                            }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            style={{
                                background: status === 'safe' 
                                    ? 'linear-gradient(to bottom right, #10b981, #34d399)' 
                                    : 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)'
                            }}
                        >
                            <img src="/assets/watercolor-avatar.png" className="w-full h-full object-cover" alt="Avatar" />

                            <motion.div
                                className="absolute inset-0"
                                animate={{ backgroundColor: status === 'safe' ? 'rgba(16, 185, 129, 0.2)' : status === 'checkin' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(192, 132, 252, 0.3)' }}
                            />
                        </motion.div>
                    )}

            {stage === 'done' && (
                <motion.div
                    className="absolute -top-8 whitespace-nowrap bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-lg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={status}
                >
                    {status === 'safe' && <span className="text-green-600">Safe ✓</span>}
                    {status === 'checkin' && <span className="text-yellow-600">Active Check-in ⏰</span>}
                    {status === 'support' && <span className="text-purple-600">Needs Support 💜</span>}
                </motion.div>
            )}
        </div>
    )
}

const TutorialTooltip = ({ step, onNext }) => {
    const content = {
        [TUTORIAL_STEPS.STEP_1]: { icon: "💜", title: "Your Circle Awaits", text: "You've checked in. Now, meet your safety net. This is where your chosen family lives.", btn: "Reveal" },
        [TUTORIAL_STEPS.STEP_2]: { icon: "✨", title: "A Sacred Space", text: "Each slot is a promise. Connect closely with those you trust most.", btn: "Next" },
        [TUTORIAL_STEPS.STEP_3]: { icon: "👀", title: "Real-time Connection", text: "They see your status instantly. You see theirs. Green for safe, purple for support.", btn: "Show Me How" },
        [TUTORIAL_STEPS.STEP_4]: { icon: "⚡", title: "Your Vibe Score", text: "Watch your circle strength grow as you connect. A full circle means maximum protection.", btn: "See Stats" },
        [TUTORIAL_STEPS.STEP_5]: { icon: "🌟", title: "Ready to Start?", text: "Tap any slot to invite your first Bestie. The magic starts with one connection.", btn: "I'm Ready!" },
    }[step];

    if (!content) return null;

    return (
        <motion.div
            className="tutorial-tooltip w-11/12 max-w-sm bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center border border-white/50"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: "spring", bounce: 0.4 }}
        >
            <div className="text-4xl mb-4 animate-bounce-gentle">{content.icon}</div>
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                {content.title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">{content.text}</p>

            <button
                onClick={onNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {content.btn}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>
        </motion.div>
    );
};

export default BestieCircleTutorial;
