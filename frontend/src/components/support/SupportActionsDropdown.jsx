import React, { useState, useRef, useEffect } from 'react';
import MessageDrawer from '../messages/MessageDrawer';
import MeetupProposalForm from './MeetupProposalForm';
import OffAppContactForm from './OffAppContactForm';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

const SupportActionsDropdown = ({ 
  recipientId, 
  recipientName, 
  recipientPhone,
  contextType = 'needs_attention',
  contextId = null,
  onActionComplete
}) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [showOffAppForm, setShowOffAppForm] = useState(false);
  const [showMessageDrawer, setShowMessageDrawer] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleOptionClick = (option) => {
    haptic.light();
    setIsOpen(false);

    switch (option) {
      case 'message':
        setShowMessageDrawer(true);
        break;
      case 'call':
        handleCall();
        break;
      case 'meetup':
        setShowMeetupForm(true);
        break;
      case 'off_app':
        setShowOffAppForm(true);
        break;
      default:
        break;
    }
  };

  const handleCall = async () => {
    try {
      // Log support action
      await addDoc(collection(db, 'support_actions'), {
        actorId: currentUser.uid,
        recipientId: recipientId,
        actionType: 'call',
        contextType: contextType,
        contextId: contextId || null,
        timestamp: Timestamp.now(),
        metadata: {}
      });

      // Open phone dialer
      if (recipientPhone) {
        window.location.href = `tel:${recipientPhone}`;
      } else {
        toast.error('Phone number not available');
      }

      if (onActionComplete) {
        onActionComplete('call');
      }
    } catch (error) {
      console.error('Error logging call action:', error);
      toast.error('Failed to log action');
    }
  };

  const handleMeetupComplete = async (meetupData) => {
    setShowMeetupForm(false);
    
    try {
      // Log support action
      await addDoc(collection(db, 'support_actions'), {
        actorId: currentUser.uid,
        recipientId: recipientId,
        actionType: 'meetup_proposed',
        contextType: contextType,
        contextId: contextId || null,
        timestamp: Timestamp.now(),
        metadata: {
          when: meetupData.when,
          what: meetupData.what,
          note: meetupData.note || null
        }
      });

      // Send in-app message with meetup proposal
      const messageText = `📅 ${currentUser.displayName || 'A bestie'} wants to meet up!\nWhen: ${meetupData.when}\nWhat: ${meetupData.what}${meetupData.note ? `\nNote: ${meetupData.note}` : ''}`;

      await addDoc(collection(db, 'bestie_messages'), {
        senderId: currentUser.uid,
        recipientId: recipientId,
        messageType: 'custom',
        messageText: messageText,
        sentAt: Timestamp.now(),
        readAt: null,
        contextType: 'meetup_proposal',
        contextId: contextId || null,
      });

      toast.success('Meetup proposal sent!');
      
      if (onActionComplete) {
        onActionComplete('meetup');
      }
    } catch (error) {
      console.error('Error sending meetup proposal:', error);
      toast.error('Failed to send meetup proposal');
    }
  };

  const handleOffAppComplete = async (offAppData) => {
    setShowOffAppForm(false);
    
    try {
      // Log support action
      await addDoc(collection(db, 'support_actions'), {
        actorId: currentUser.uid,
        recipientId: recipientId,
        actionType: 'off_app_contact',
        contextType: contextType,
        contextId: contextId || null,
        timestamp: Timestamp.now(),
        metadata: {
          method: offAppData.method,
          outcome: offAppData.outcome
        }
      });

      toast.success('Outreach logged! Thanks for supporting 💜');
      
      if (onActionComplete) {
        onActionComplete('off_app');
      }
    } catch (error) {
      console.error('Error logging off-app contact:', error);
      toast.error('Failed to log outreach');
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            haptic.light();
            setIsOpen(!isOpen);
          }}
          className="btn btn-sm btn-primary flex items-center gap-1"
        >
          <span>💜</span>
          <span>Support</span>
          <span className="text-xs">▼</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleOptionClick('message')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">💬</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Send quick message
                </span>
              </button>

              <button
                onClick={() => handleOptionClick('call')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">📞</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  I'm calling them now
                </span>
              </button>

              <button
                onClick={() => handleOptionClick('meetup')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">📅</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Let's meet up
                </span>
              </button>

              <button
                onClick={() => handleOptionClick('off_app')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  I reached out off-app
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Drawer */}
      <MessageDrawer
        isOpen={showMessageDrawer}
        onClose={() => setShowMessageDrawer(false)}
        recipientId={recipientId}
        recipientName={recipientName}
        recipientPhotoURL={null}
        contextType={contextType}
        contextId={contextId}
        preselectedMessage={{ emoji: '💜', text: 'Thinking of you - here if you need me' }}
      />

      {/* Meetup Form */}
      {showMeetupForm && (
        <MeetupProposalForm
          isOpen={showMeetupForm}
          onClose={() => setShowMeetupForm(false)}
          onComplete={handleMeetupComplete}
          recipientName={recipientName}
        />
      )}

      {/* Off-App Contact Form */}
      {showOffAppForm && (
        <OffAppContactForm
          isOpen={showOffAppForm}
          onClose={() => setShowOffAppForm(false)}
          onComplete={handleOffAppComplete}
          recipientName={recipientName}
        />
      )}
    </>
  );
};

export default SupportActionsDropdown;

