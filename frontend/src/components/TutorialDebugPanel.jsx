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
        <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-1 rounded shadow-lg border border-purple-300 dark:border-purple-700 z-[10000] max-w-[80px] opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-[8px] text-center text-purple-600 dark:text-purple-400 font-bold mb-1">
                {currentCheckInTutorialStep || 'null'}
            </div>
        </div>
    );
};

export default TutorialDebugPanel;
