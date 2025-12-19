import React, { useState } from 'react';
import { PRESET_MESSAGES, sendMessage } from '../../services/messageService';
import { useMessageRateLimit } from '../../hooks/useMessageRateLimit';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

/**
 * PresetMessageSelector - Component for selecting and sending preset or custom messages
 * Features:
 * - Grid of preset message buttons
 * - Custom message input
 * - Rate limit checking
 * - Optimistic UI updates
 */
const PresetMessageSelector = ({
    recipientId,
    recipientName,
    contextType = 'spontaneous',
    contextId = null,
    onMessageSent,
    onClose
}) => {
    const { currentUser } = useAuth();
    const { canSend, checking, checkRateLimit } = useMessageRateLimit(currentUser?.uid, recipientId);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handlePresetMessageClick = async (preset) => {
        if (!canSend) {
            toast.error(`You can only send one message per day to ${recipientName}`);
            return;
        }

        haptic.light();
        setSending(true);

        try {
            await sendMessage({
                senderId: currentUser.uid,
                recipientId,
                messageText: preset.text,
                messageType: 'preset',
                contextType,
                contextId
            });

            toast.success(`Message sent to ${recipientName}! 💜`, {
                icon: preset.emoji,
                duration: 3000
            });

            if (onMessageSent) onMessageSent();
            if (onClose) onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleCustomMessageSend = async () => {
        if (!customMessage.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (customMessage.length > 100) {
            toast.error('Message must be 100 characters or less');
            return;
        }

        if (!canSend) {
            toast.error(`You can only send one message per day to ${recipientName}`);
            return;
        }

        haptic.light();
        setSending(true);

        try {
            await sendMessage({
                senderId: currentUser.uid,
                recipientId,
                messageText: customMessage.trim(),
                messageType: 'custom',
                contextType,
                contextId
            });

            toast.success(`Message sent to ${recipientName}! 💜`, {
                duration: 3000
            });

            if (onMessageSent) onMessageSent();
            if (onClose) onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (checking) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-xl font-display font-bold text-text-primary">
                    Send Message to {recipientName}
                </h3>
                {!canSend && (
                    <p className="text-sm text-danger mt-2">
                        ⏰ You already sent {recipientName} a message today. You can send another tomorrow! 💜
                    </p>
                )}
            </div>

            {!showCustomInput ? (
                <>
                    {/* Preset Messages Grid */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-text-secondary">Quick Messages:</p>
                        <div className="grid gap-2">
                            {PRESET_MESSAGES.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetMessageClick(preset)}
                                    disabled={!canSend || sending}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-primary/30"
                                >
                                    <span className="text-2xl">{preset.emoji}</span>
                                    <span className="text-left font-medium text-text-primary flex-1">
                                        {preset.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <span className="text-sm text-text-secondary font-semibold">OR</span>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                    </div>

                    {/* Custom Message Button */}
                    <button
                        onClick={() => setShowCustomInput(true)}
                        disabled={!canSend || sending}
                        className="w-full btn btn-secondary"
                    >
                        ✍️ Write Custom Message
                    </button>
                </>
            ) : (
                <>
                    {/* Custom Message Input */}
                    <div className="space-y-3">
                        <div>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Write your message..."
                                maxLength={100}
                                rows={3}
                                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none resize-none"
                                disabled={!canSend || sending}
                            />
                            <p className="text-xs text-text-secondary mt-1 text-right">
                                {customMessage.length}/100 characters
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCustomInput(false)}
                                className="flex-1 btn btn-secondary"
                                disabled={sending}
                            >
                                ← Back to Presets
                            </button>
                            <button
                                onClick={handleCustomMessageSend}
                                disabled={!canSend || sending || !customMessage.trim()}
                                className="flex-1 btn btn-primary"
                            >
                                {sending ? 'Sending...' : 'Send Message 💜'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Cancel Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full btn btn-ghost text-text-secondary"
                    disabled={sending}
                >
                    Cancel
                </button>
            )}
        </div>
    );
};

export default PresetMessageSelector;
