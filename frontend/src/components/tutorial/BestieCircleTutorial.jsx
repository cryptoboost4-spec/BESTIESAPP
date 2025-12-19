import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import './BestieCircleTutorial.css';

/**
 * BestieCircleTutorial - Bespoke Edition
 * 
 * Focuses on high-quality, organic transitions for:
 * - Connection Line ("River of Light / Fish")
 * - Avatar Reveal ("Bloom")
 * - Slot Breathing ("Living Mist")
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
    [TUTORIAL_STEPS.MOMENT_0]: 800,   // Reduced by 1 second
    [TUTORIAL_STEPS.STEP_1]: 1000,    // Reduced by 1 second
    [TUTORIAL_STEPS.STEP_2]: 2000,    // Reduced by 1 second
    [TUTORIAL_STEPS.STEP_3]: 3000,    // Reduced by 1 second
    [TUTORIAL_STEPS.STEP_4]: 2000,    // Reduced by 1 second
    [TUTORIAL_STEPS.STEP_5]: 1500     // Reduced by 1 second
};

const BestieCircleTutorial = ({ isActive, onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState(TUTORIAL_STEPS.MOMENT_0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
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

        // Increased delay to allow tooltip exit animation and step animations to complete
        setTimeout(() => {
            if (currentStep < TUTORIAL_STEPS.STEP_5) {
                setCurrentStep(c => c + 1);
            } else {
                handleComplete();
            }
        }, 600);
    };

    const triggerFinalExit = useCallback(() => {
        const defaults = { origin: { y: 0.8 }, zIndex: 11000, colors: ['#ec4899', '#f472b6'] };
        confetti({ ...defaults, particleCount: 40, scalar: 2, shape: 'circle' });
    }, []);

    const handleComplete = useCallback(() => {
        // Hide tooltip and mark as completing
        setShowTooltip(false);
        setIsCompleting(true);
        // Final Exit Animation
        triggerFinalExit();
        // Call onComplete after confetti animation
        setTimeout(() => {
            onComplete && onComplete();
        }, 800); // Increased delay to allow confetti to be visible
    }, [triggerFinalExit, onComplete]);

    const triggerButterflies = useCallback((rect) => {
        // Reduce butterfly count from 25 to 12 for better performance
        const newButterflies = Array.from({ length: 12 }).map((_, i) => {
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

    // Note: With AnimatePresence in parent, component stays mounted during exit animation
    // isActive will be true when component is rendered by AnimatePresence
    if (!isActive) return null;

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center font-sans overflow-hidden rounded-[inherit] pointer-events-none"
            style={{ borderRadius: 'inherit' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
            {/* Global Background Layer - Dream Circle Style */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-br from-green-50 via-emerald-50 via-teal-50 via-pink-50 to-purple-50 border-4 border-green-300 z-0"
                animate={{ opacity: isCompleting ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                <DreamscapeBackground />
                <ButterflySystem butterflies={butterflies} />
            </motion.div>

            {/* Main Stage */}
            {!isCompleting && (
                <div className="relative w-full h-full flex items-center justify-center transition-transform duration-1000 z-10 pointer-events-none">
                    <div className="relative transition-transform duration-1000 w-full h-full flex items-center justify-center scale-100">
                        <LivingCircleStage currentStep={currentStep} />
                    </div>
                </div>
            )}

            {/* Tooltip Layer */}
            <AnimatePresence>
                {showTooltip && currentStep !== TUTORIAL_STEPS.MOMENT_0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
                        <TutorialTooltip
                            key={currentStep}
                            step={currentStep}
                            onNext={handleNext}
                        />
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- VISUAL COMPONENTS ---

const DreamscapeBackground = memo(() => (
    <div className="absolute inset-0 pointer-events-none">
        {/* Dream Circle style gradient - Green and Pink mixing */}
        <motion.div
            className="absolute inset-0 opacity-40"
            style={{
                background: 'radial-gradient(circle at 50% 50%, #10b981 0%, #34d399 30%, #ec4899 60%, #f472b6 80%, transparent 100%)'
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-green-900/20 via-transparent to-pink-900/20 mix-blend-screen" />
        <FallingStars />
    </div>
));

const FallingStars = () => {
    // Pre-calculate random values to prevent recalculation on every render
    const stars = useMemo(() =>
        Array.from({ length: 5 }).map((_, i) => ({
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
    // data should already have targetX and targetY calculated
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
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute"
        >
            <div className="w-4 h-4" style={{
                background: `radial-gradient(circle, ${data.color}, transparent)`,
                filter: 'blur(1px)'
            }}>
                <motion.div
                    animate={{ scaleX: [1, 0.2, 1] }}
                    transition={{ duration: 0.15, repeat: Infinity }}
                    className="w-full h-full rounded-full bg-white/80"
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
            <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-breathe-perfect bg-gradient-to-br from-green-500 to-emerald-500 border-4 border-white ring-4 ring-green-300" />

            {(isStep4) && (
                <div className="absolute inset-0 rounded-full overflow-hidden mix-blend-overlay opacity-70">
                    <div className="absolute inset-0 bg-white/20 animate-plasma" />
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
        <svg className="absolute -inset-3 w-[120px] h-[120px] rotate-[-90deg] overflow-visible">
            <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
            <motion.circle
                cx="60" cy="60" r="56"
                stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 0.8 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                    filter: 'drop-shadow(0 0 6px #fbcfe8) drop-shadow(0 0 10px #ec4899)'
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

    // Memoize computed values (currently unused but kept for future use)
    // const isTopSlotActive = useMemo(() =>
    //     currentStep === TUTORIAL_STEPS.STEP_2 || currentStep === TUTORIAL_STEPS.STEP_3,
    //     [currentStep]
    // );
    // const isTopSlotElectric = useMemo(() =>
    //     currentStep === TUTORIAL_STEPS.STEP_3,
    //     [currentStep]
    // );

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
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Connection lines removed - no green lines in tutorial */}
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

// FishSchool component - unused, kept for potential future use
// const FishSchool = () => {
//     return (
//         <div className="absolute inset-0 overflow-hidden">
//             {Array.from({ length: 3 }).map((_, i) => (
//                 <motion.div
//                     key={i}
//                     className="absolute top-0 h-[2px] w-4 bg-gradient-to-r from-transparent to-pink-300"
//                     initial={{ left: '-20%' }}
//                     animate={{ left: '120%' }}
//                     transition={{
//                         duration: 1.5,
//                         repeat: Infinity,
//                         delay: i * 0.4,
//                         ease: "linear"
//                     }}
//                     style={{ borderRadius: '100%' }}
//                 />
//             ))}
//         </div>
//     )
// }

const TutorialTooltip = ({ step, onNext }) => {
    const content = {
        [TUTORIAL_STEPS.STEP_1]: {
            icon: "💜",
            title: "Welcome to Your Bestie Circle!",
            text: "This is your inner circle - the 5 people you trust most. They'll see your check-ins and you'll see theirs. Let's learn how it works!",
            btn: "Show Me"
        },
        [TUTORIAL_STEPS.STEP_2]: {
            icon: "✨",
            title: "Your Safety Network",
            text: "Each slot represents one of your closest besties. You can have up to 5 people in your circle - think of them as your 3am emergency contacts!",
            btn: "Next"
        },
        [TUTORIAL_STEPS.STEP_3]: {
            icon: "👀",
            title: "Real-Time Status",
            text: "Your besties' status shows at a glance:\n💚 Green = Safe\n⏰ Yellow = Active check-in\n💜 Purple = Needs support",
            btn: "Got It"
        },
        [TUTORIAL_STEPS.STEP_4]: {
            icon: "⚡",
            title: "Your Circle's Vibe",
            text: "This score shows your circle's overall health! It's based on connection strength and how full your circle is. Keep it high by staying connected!",
            btn: "Cool!"
        },
        [TUTORIAL_STEPS.STEP_5]: {
            icon: "🌟",
            title: "Ready to Start?",
            text: "Tap any empty slot to invite your first Bestie. The magic starts with one connection. Build your safety network!",
            btn: "I'm Ready!"
        },
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
