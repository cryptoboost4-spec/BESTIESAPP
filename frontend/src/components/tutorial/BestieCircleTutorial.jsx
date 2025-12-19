import React, { useState, useEffect, useRef } from 'react';
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
    [TUTORIAL_STEPS.MOMENT_0]: 1800,
    [TUTORIAL_STEPS.STEP_1]: 500,
    [TUTORIAL_STEPS.STEP_2]: 1500,
    [TUTORIAL_STEPS.STEP_3]: 1000,
    [TUTORIAL_STEPS.STEP_4]: 1000,
    [TUTORIAL_STEPS.STEP_5]: 1500
};

const BestieCircleTutorial = ({ isActive, onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState(TUTORIAL_STEPS.MOMENT_0);
    const [showTooltip, setShowTooltip] = useState(false);
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

    const handleComplete = () => {
        // Final Exit Animation
        triggerFinalExit();
        setTimeout(() => {
            onComplete && onComplete();
            onClose && onClose();
        }, 2000);
    };

    const triggerFinalExit = () => {
        const defaults = { origin: { y: 0.8 }, zIndex: 11000, colors: ['#ec4899', '#f472b6'] };
        confetti({ ...defaults, particleCount: 40, scalar: 2, shape: 'circle' });
    };

    const triggerButterflies = (rect) => {
        const newButterflies = Array.from({ length: 25 }).map((_, i) => ({
            id: Date.now() + i,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            angle: Math.random() * 360,
            delay: Math.random() * 0.2,
            color: Math.random() > 0.5 ? '#F472B6' : '#A855F7'
        }));

        setButterflies(prev => [...prev, ...newButterflies]);

        setTimeout(() => {
            setButterflies(prev => prev.filter(b => !newButterflies.includes(b)));
        }, 2000);
    };

    if (!isActive) return null;

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center font-sans overflow-hidden rounded-[inherit] pointer-events-none"
            style={{ borderRadius: 'inherit' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Global Background Layer */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 z-0">
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
        </motion.div>
    );
};

// --- VISUAL COMPONENTS ---

const DreamscapeBackground = () => (
    <div className="absolute inset-0 pointer-events-none">
        {/* Aurora Borealis Effect */}
        <motion.div
            className="absolute inset-0 opacity-60"
            style={{
                background: 'radial-gradient(circle at 50% 120%, #4c1d95 0%, #831843 40%, transparent 80%)'
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Moving Aurora Waves */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-pink-900/30 animate-aurora mix-blend-screen" />
        <div className="absolute inset-0 texture-overlay" />
        <FallingStars />
    </div>
);

const FallingStars = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
                    initial={{ x: Math.random() * 100 + "%", y: -10, opacity: 0 }}
                    animate={{ x: Math.random() * 100 + "%", y: "100%", opacity: [0, 1, 0] }}
                    transition={{ duration: Math.random() * 2 + 3, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                />
            ))}
        </div>
    )
}

const ButterflySystem = ({ butterflies }) => (
    <div className="absolute inset-0 pointer-events-none z-[10000]">
        <AnimatePresence>
            {butterflies.map(b => (
                <Butterfly key={b.id} data={b} />
            ))}
        </AnimatePresence>
    </div>
);

const Butterfly = ({ data }) => {
    return (
        <motion.div
            initial={{ x: data.x, y: data.y, scale: 0, opacity: 1 }}
            animate={{
                x: data.x + (Math.random() - 0.5) * 400,
                y: data.y - Math.random() * 400 - 100,
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
}

// --- MAIN STAGE COORDINATOR ---

const LivingCircleStage = ({ currentStep }) => {
    return (
        <div className="relative w-full h-full preserve-3d">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <YouBubbleCore currentStep={currentStep} />
            </div>
            <SlotRing currentStep={currentStep} />
        </div>
    );
};

// --- COMPONENT: YOU BUBBLE ---

const YouBubbleCore = ({ currentStep }) => {
    const isStep4 = currentStep === TUTORIAL_STEPS.STEP_4; // Vibe Score
    const isStepFinal = currentStep === TUTORIAL_STEPS.STEP_5;

    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    useEffect(() => {
        if (isStep4) {
            setShowScore(true);
            let val = 0;
            const interval = setInterval(() => {
                val += 2;
                if (val > 80) {
                    val = 80;
                    clearInterval(interval);
                }
                setScore(val);
            }, 30);
            return () => clearInterval(interval);
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
            <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.5)] animate-liquid bg-gradient-to-br from-purple-500 to-pink-500" />

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
}

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

// --- COMPONENT: SLOT RING ---

const SlotRing = ({ currentStep }) => {
    return (
        <div className="absolute inset-0">
            {Array.from({ length: 5 }).map((_, i) => (
                <SingleSlot key={i} index={i} currentStep={currentStep} />
            ))}
        </div>
    )
}

const SingleSlot = ({ index, currentStep }) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const radius = 140;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const slotStyles = [
        { border: 'border-pink-500', text: 'text-pink-500' },
        { border: 'border-purple-500', text: 'text-purple-500' },
        { border: 'border-blue-500', text: 'text-blue-500' },
        { border: 'border-green-500', text: 'text-green-500' },
        { border: 'border-orange-500', text: 'text-orange-500' },
    ];
    const style = slotStyles[index] || slotStyles[0];
    const borderColor = style.border;
    const textColor = style.text;

    const isTopSlot = index === 0;

    const isAwakening = isTopSlot && currentStep === TUTORIAL_STEPS.STEP_2;
    const isExhaling = !isTopSlot && currentStep === TUTORIAL_STEPS.STEP_2;
    const isBlooming = isTopSlot && currentStep === TUTORIAL_STEPS.STEP_3;

    const variants = {
        dim: { opacity: 0.3, scale: 0.9, filter: 'blur(2px)' },
        awake: { opacity: 1, scale: 1.1, filter: 'blur(0px)' },
        normal: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        hidden: { opacity: 0, scale: 0 }
    };

    let state = 'normal';
    if (currentStep === TUTORIAL_STEPS.STEP_1) state = 'normal';
    else if (currentStep === TUTORIAL_STEPS.STEP_2) state = isTopSlot ? 'awake' : 'dim';
    else if (currentStep === TUTORIAL_STEPS.STEP_3) state = isTopSlot ? 'awake' : 'dim';
    else if (currentStep === TUTORIAL_STEPS.STEP_4) state = 'dim';
    else if (currentStep === TUTORIAL_STEPS.STEP_5) state = 'awake'; // All awake at end

    return (
        <>
            <LiquidConnectionLine
                x={x} y={y}
                isActive={isTopSlot && (currentStep === TUTORIAL_STEPS.STEP_2 || currentStep === TUTORIAL_STEPS.STEP_3)}
                isElectric={isTopSlot && currentStep === TUTORIAL_STEPS.STEP_3 && !isBlooming}
            />

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
                </div>
            </motion.div>
        </>
    );
}

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
                    className="w-full h-full rounded-full overflow-hidden border-[3px] bg-gray-100 relative z-10"
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{
                        clipPath: 'circle(100% at 50% 50%)',
                        borderColor: status === 'safe' ? '#4ade80' : status === 'checkin' ? '#facc15' : '#c084fc'
                    }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                >
                    <img src="/assets/watercolor-avatar.png" className="w-full h-full object-cover" alt="Avatar" />

                    <motion.div
                        className="absolute inset-0"
                        animate={{ backgroundColor: status === 'safe' ? 'rgba(74, 222, 128, 0.2)' : status === 'checkin' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(192, 132, 252, 0.3)' }}
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

const LiquidConnectionLine = ({ x, y, isActive, isElectric }) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const length = 140 - 32 - 48;

    return (
        <div
            className="absolute top-1/2 left-1/2 h-[2px] origin-left bg-white/5"
            style={{
                width: length,
                transform: `rotate(${angle}deg) translate(48px, 0)`
            }}
        >
            {isActive && !isElectric && (
                <FishSchool />
            )}

            {isElectric && (
                <div className="absolute inset-0 bg-pink-400 blur-[2px] animate-pulse" />
            )}

            {isActive && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            )}
        </div>
    )
}

const FishSchool = () => {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute top-0 h-[2px] w-4 bg-gradient-to-r from-transparent to-pink-300"
                    initial={{ left: '-20%' }}
                    animate={{ left: '120%' }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "linear"
                    }}
                    style={{ borderRadius: '100%' }}
                />
            ))}
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
