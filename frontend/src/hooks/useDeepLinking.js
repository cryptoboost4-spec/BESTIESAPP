import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logAnalyticsEvent } from '../services/firebase';

/**
 * Deep Link Handler - Processes deep link URLs and navigates appropriately
 * Supports:
 * - besties://messages?senderId={userId}&messageId={id}
 * - besties://activity?checkinId={id}
 * - besties://challenges/invite?challengeId={id}
 * - besties://challenges/complete?challengeId={id}
 * - besties://circle/pact?pactId={id}
 */
export const useDeepLinking = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // Message deep link
        if (params.has('messageId') && params.has('senderId')) {
            const messageId = params.get('messageId');
            const senderId = params.get('senderId');

            logAnalyticsEvent('deep_link_opened', {
                type: 'message',
                message_id: messageId
            });

            // Navigate to messages page or profile
            navigate(`/profile/${senderId}`, {
                state: { highlightMessage: messageId },
                replace: true
            });

            // Clear params
            window.history.replaceState({}, '', location.pathname);
            return;
        }

        // Circle check-in deep link
        if (params.has('checkinId')) {
            const checkinId = params.get('checkinId');

            logAnalyticsEvent('deep_link_opened', {
                type: 'circle_checkin',
                checkin_id: checkinId
            });

            // Navigate to activity feed
            navigate('/', {
                state: { highlightCheckIn: checkinId },
                replace: true
            });

            window.history.replaceState({}, '', location.pathname);
            return;
        }

        // Challenge invitation deep link
        if (location.pathname.includes('/challenges/invite') && params.has('challengeId')) {
            const challengeId = params.get('challengeId');

            logAnalyticsEvent('deep_link_opened', {
                type: 'challenge_invite',
                challenge_id: challengeId
            });

            // Navigate to challenges page
            navigate('/', {
                state: { openChallengeInvite: challengeId },
                replace: true
            });

            window.history.replaceState({}, '', location.pathname);
            return;
        }

        // Challenge completion deep link
        if (location.pathname.includes('/challenges/complete') && params.has('challengeId')) {
            const challengeId = params.get('challengeId');

            logAnalyticsEvent('deep_link_opened', {
                type: 'challenge_complete',
                challenge_id: challengeId
            });

            // Show celebration
            navigate('/', {
                state: { showChallengeCelebration: challengeId },
                replace: true
            });

            window.history.replaceState({}, '', location.pathname);
            return;
        }

        // Safety pact deep link
        if (location.pathname.includes('/circle/pact') && params.has('pactId')) {
            const pactId = params.get('pactId');

            logAnalyticsEvent('deep_link_opened', {
                type: 'safety_pact',
                pact_id: pactId
            });

            // Navigate to bestie circle page
            navigate('/', {
                state: { openPactModal: pactId },
                replace: true
            });

            window.history.replaceState({}, '', location.pathname);
            return;
        }
    }, [location, navigate]);
};

export default useDeepLinking;
