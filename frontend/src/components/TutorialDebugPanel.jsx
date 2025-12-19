import React from 'react';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';

/**
 * Tutorial Debug Panel - For testing tutorial flows
 * Only visible in development
 */
const TutorialDebugPanel = () => {
    const {
        currentCheckInTutorialStep,
        setCheckInTutorialStep,
        resetCheckInTutorial,
        markCheckInTutorialComplete,
        validSteps
    } = useCheckInTutorialState();

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl border-2 border-purple-500 z-[10000] max-w-xs">
            <h3 className="text-sm font-bold mb-2 text-purple-600 dark:text-purple-400">
                🔧 Tutorial Debug
            </h3>

            <div className="text-xs mb-2 text-gray-600 dark:text-gray-400">
                Current: <span className="font-mono font-bold">{currentCheckInTutorialStep || 'null'}</span>
            </div>

            <div className="space-y-1 mb-3">
                <button
                    onClick={() => setCheckInTutorialStep('afterSafe')}
                    className="w-full text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold"
                >
                    🎉 Test AfterSafe Tooltip
                </button>
                <button
                    onClick={() => resetCheckInTutorial()}
                    className="w-full text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Reset Tutorial
                </button>
                <button
                    onClick={() => markCheckInTutorialComplete()}
                    className="w-full text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Mark Complete
                </button>
            </div>

            <div className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Set Step:
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {validSteps.map(step => (
                    <button
                        key={step}
                        onClick={() => setCheckInTutorialStep(step)}
                        className={`text-xs px-2 py-1 rounded ${currentCheckInTutorialStep === step
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {step}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TutorialDebugPanel;
