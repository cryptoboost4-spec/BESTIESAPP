# 📁 Besties App - Complete Codebase Structure

Last Updated: 2025-11-28

## 🎯 Overview

This document maps the entire codebase structure with detailed descriptions of every directory and file. The codebase is organized into **Backend (Firebase Functions)** and **Frontend (React)** sections.

---

## 🔧 Backend - Firebase Functions

### **functions/** - Cloud Functions for Firebase
Root directory for all serverless backend logic running on Google Cloud Functions.

#### **functions/core/** - Domain-Organized Cloud Functions
All cloud functions organized by business domain for better maintainability.

##### **core/analytics/** - Analytics & Metrics
- `dailyAnalyticsAggregation.js` - Scheduled function (daily) to aggregate platform metrics
- `updateDailyStreaks.js` - Updates user activity streaks daily
- `rebuildAnalyticsCache.js` - Admin function to rebuild analytics cache
- `generateMilestones.js` - Creates user milestone achievements

##### **core/auth/** - Authentication & User Management
- `onUserCreated.js` - Trigger when new user signs up (creates profile, welcome data)

##### **core/besties/** - Bestie Relationship Management
- `sendBestieInvite.js` - HTTP function to send SMS/WhatsApp invite
- `sendBestieRequest.js` - HTTP function to send bestie connection request
- `acceptBestieRequest.js` - HTTP function to accept a bestie request
- `declineBestieRequest.js` - HTTP function to decline a bestie request
- `onBestieCountUpdate.js` - Firestore trigger to update stats when besties change
- `onBestieCreated.js` - Firestore trigger when new bestie relationship created
- `onBestieDeleted.js` - Firestore trigger when bestie relationship ended

##### **core/checkins/** - Check-In Safety System
- `checkExpiredCheckIns.js` - Scheduled function (every minute) to find expired check-ins
- `checkCascadingAlertEscalation.js` - Scheduled function (every minute) for alert escalation
- `acknowledgeAlert.js` - HTTP function for besties to acknowledge alerts
- `extendCheckIn.js` - HTTP function to extend check-in duration
- `completeCheckIn.js` - HTTP function to mark check-in as safe/complete
- `onCheckInCreated.js` - Firestore trigger when new check-in created
- `onCheckInCountUpdate.js` - Firestore trigger to update stats when check-in status changes
- `sendCheckInReminders.js` - Scheduled function to send reminder notifications
- `trackCheckInReaction.js` - Firestore trigger to track reactions for connection strength
- `trackCheckInComment.js` - Firestore trigger to track comments for connection strength

##### **core/emergency/** - Emergency & SOS Features
- `onDuressCodeUsed.js` - Firestore trigger when user uses duress/panic code
- `triggerEmergencySOS.js` - HTTP function to trigger immediate emergency alert

##### **core/maintenance/** - Admin & Utility Functions
- `cleanupOldData.js` - Scheduled function to cleanup old data based on retention policies
- `sendTestAlert.js` - HTTP function for testing notification system
- `migratePhoneNumbers.js` - Admin function to migrate phone number formats
- `fixDoubleCountedStats.js` - Admin function to fix stats counting bugs
- `backfillBestieUserIds.js` - Admin function to backfill missing data

##### **core/monitoring/** - Error Tracking & Monitoring
- `monitorCriticalErrors.js` - Firestore trigger to alert admins of critical errors

##### **core/notifications/** - Scheduled Notifications
- `checkBirthdays.js` - Scheduled function (daily) to send birthday notifications

##### **core/payments/** - Stripe Payment Integration
- `createCheckoutSession.js` - HTTP function to create Stripe checkout session
- `createPortalSession.js` - HTTP function to create Stripe customer portal
- `stripeWebhook.js` - HTTP endpoint to handle Stripe webhook events

##### **core/social/** - Social Features
- `trackReaction.js` - Firestore trigger to track post reactions
- `trackPostComment.js` - Firestore trigger to track post comments
- `generateShareCard.js` - HTTP function to generate social share cards

##### **core/users/** - User Profile Management
- `onUserCreated.js` - Auth trigger when new user account created

#### **functions/utils/** - Shared Utilities
Reusable helper functions used across multiple cloud functions.

- `badges.js` - Badge system logic (award badges, check achievements)
- `messaging.js` - Messaging utilities (send WhatsApp, SMS, etc.)
- `notifications.js` - **NEW** Notification orchestration (cascading alerts, push, email)

#### **functions/migrations/** - Database Migration Scripts
One-time scripts for database schema changes and data migrations.

#### **functions/** - Root Files
- `index.js` - **Main entry point** - Imports and exports all cloud functions (140 lines, down from 2,763!)
- `index_old.js` - Backup of original monolithic index.js file
- `package.json` - Dependencies (Firebase SDK, Twilio, SendGrid, Stripe)
- `shareCard.js` - Share card generation logic (legacy, being moved to core/social/)
- `backfillBestieUserIds.js` - Backfill script (being moved to core/maintenance/)

---

## 💜 Frontend - React Application

### **frontend/src/** - React Application Source

#### **src/config/** - Configuration Files
- `firebase.js` - Firebase SDK initialization & configuration
- `features.js` - Feature flags for A/B testing and gradual rollouts

#### **src/contexts/** - React Context Providers
Global state management using React Context API.

- `AuthContext.jsx` - Authentication state (current user, login/logout, user data)
- `DarkModeContext.jsx` - Dark mode theme state and toggle

#### **src/services/** - Business Logic & API Clients
Reusable services for external integrations and complex logic.

- `firebase.js` - Firebase client SDK initialization
- `api.js` - HTTP API client wrapper (axios/fetch)
- `errorTracking.js` - Error logging service (Sentry/custom)
- `connectionStrength.js` - Algorithm for calculating bestie connection strength
- `interactionTracking.js` - Tracks user interactions for connection strength
- `notificationService.js` - Browser push notification service
- `notifications.js` - Notification helper functions
- `profileCompletionService.js` - Calculates profile completion percentage

#### **src/hooks/** - Custom React Hooks
Reusable React hooks for common functionality.

- `useFormValidation.js` - Form validation logic
- `useOptimisticUpdate.js` - Optimistic UI updates for better UX
- `usePullToRefresh.js` - Pull-to-refresh gesture for mobile

#### **src/utils/** - Utility Functions
Pure utility functions with no dependencies.

- `hapticFeedback.js` - Vibration feedback for mobile devices
- `phoneUtils.js` - Phone number formatting and validation

---

### **src/components/** - React Components

#### **components/ (Root)** - Shared/Global Components
Components used across multiple pages.

- `AddBestieModal.jsx` - Modal to add new bestie by phone/invite
- `AddToHomeScreenPrompt.jsx` - PWA install prompt
- `AdminRoute.jsx` - Protected route component for admin pages
- `AnimatedProfilePicture.jsx` - Animated profile picture with effects
- `BadgeSystem.jsx` - Badge display and achievement notifications
- `BestieCard.jsx` - Card component showing bestie info
- `BestieCelebrationModal.jsx` - Celebration modal when adding new bestie
- `BestieCircle.jsx` - Visual circle showing your 5 besties
- `BestieCircleShareModal.jsx` - Modal to share your bestie circle
- `BestieCircleStatus.jsx` - Status indicator for circle completion
- `BestieRequestCard.jsx` - Card for incoming bestie requests
- `BestieRequestModal.jsx` - Modal to accept/decline bestie request
- `CelebrationScreen.jsx` - Full-screen celebration animations
- `CheckInCard.jsx` - Card showing check-in details (refactored, 565 lines from 994)
- `CheckInCard_OLD.jsx` - Backup of original CheckInCard
- `ConfettiCelebration.jsx` - Confetti animation for celebrations
- `CountUp.jsx` - Animated number counter
- `CreatePostModal.jsx` - Modal to create social posts
- `DarkModeToggle.jsx` - Toggle switch for dark mode
- `DesktopNav.jsx` - Desktop navigation bar
- `DonationCard.jsx` - Donation/tip jar component
- `EmergencySOSButton.jsx` - Big red SOS button
- `ErrorBoundary.jsx` - React error boundary for crash recovery
- `FloatingNotificationBell.jsx` - Floating notification icon
- `FunLoadingScreen.jsx` - Loading screen with animations
- `GetMeOutButton.jsx` - Quick exit button (duress feature)
- `Header.jsx` - Page header component
- `InfoButton.jsx` - Information tooltip button
- `InviteFriendsModal.jsx` - Modal to invite friends to app
- `LivingCircle.jsx` - **Refactored** Interactive living circle visualization (388 lines from 841)
- `LoadingSkeleton.jsx` - Skeleton loading placeholders
- `MilestoneCelebration.jsx` - Milestone achievement celebration
- `MobileBottomNav.jsx` - Mobile bottom navigation bar
- `NotificationBell.jsx` - Notification bell with badge count
- `OfflineBanner.jsx` - Banner shown when app is offline
- `OnboardingFlow.jsx` - Multi-step onboarding wizard
- `ProfileCompletionModal.jsx` - Modal prompting profile completion
- `ProfileWithBubble.jsx` - Profile picture with speech bubble
- `PullToRefresh.jsx` - Pull-to-refresh component
- `QuickButtons.jsx` - Quick action buttons
- `QuickCheckInButtons.jsx` - Quick check-in shortcut buttons
- `RequestSupportSection.jsx` - Section to request help from besties
- `ScrollToTop.jsx` - Scroll to top button
- `ShareProfileModal.jsx` - Modal to share user profile
- `SocialShareCardsModal.jsx` - Modal with shareable card designs
- `TemplateSelector.jsx` - Template picker for customization

#### **components/analytics/** - Analytics Dashboard Components
Components for the admin analytics dashboard (refactored from DevAnalyticsPage).

- `StatsCard.jsx` - Reusable metric card component
- `TimeRangeFilter.jsx` - Time range filter buttons (today/week/month/year)
- `UserStats.jsx` - User growth and registration metrics
- `CheckInStats.jsx` - Check-in volume and safety metrics
- `BestiesStats.jsx` - Bestie network statistics
- `RevenueStats.jsx` - Revenue and subscription metrics
- `EngagementStats.jsx` - User engagement metrics
- `CostTracking.jsx` - Operational cost tracking (SMS, WhatsApp)
- `GrowthMetrics.jsx` - Growth rate calculations
- `FunnelAnalytics.jsx` - User funnel visualization
- `UserBehavior.jsx` - Peak usage times and patterns
- `TopLocations.jsx` - Most popular check-in locations
- `RecentAlerts.jsx` - Recent safety alert list

#### **components/besties/** - Besties Page Components
Components for the Besties social feed page (refactored from BestiesPage).

- `ActivityFeed.jsx` - Activity feed showing posts, check-ins, badges
- `ActivityFeedSkeleton.jsx` - Loading skeleton for activity feed
- `ActivityFilters.jsx` - Filter controls for activity feed
- `BestiesGrid.jsx` - Grid layout of all besties
- `BestiesLeaderboard.jsx` - Weekly/monthly/yearly leaderboard
- `CommentsModal.jsx` - Modal for viewing/adding comments
- `EmptyState.jsx` - Empty state when no besties exist
- `NeedsAttentionSection.jsx` - Alerts for missed check-ins
- `PendingRequestsList.jsx` - List of pending bestie requests
- `PostComments.jsx` - Comments section for posts
- `PostReactions.jsx` - Reaction buttons for posts

#### **components/checkin/** - Check-In Creation Components
Components for creating and managing check-ins (refactored from CreateCheckInPage & CheckInCard).

- `BestieSelector.jsx` - Component to select which besties to notify
- `CheckInLoader.jsx` - Loading animation during check-in creation
- `CheckInMap.jsx` - Google Maps integration for location selection
- `CheckInNotes.jsx` - Notes editing section
- `CheckInPhotos.jsx` - Photo grid and upload
- `CheckInTimer.jsx` - Timer display and extend buttons
- `DurationSelector.jsx` - Duration selection UI (15min, 30min, 1hr, etc.)
- `MeetingInfoSection.jsx` - Meeting details and social media input
- `NotesPhotosSection.jsx` - Combined notes and photos section
- `PasscodeModal.jsx` - Passcode verification modal
- `QuickMeetModal.jsx` - Quick meeting check-in modal
- `RideshareModal.jsx` - Rideshare check-in modal
- `SafeLoader.jsx` - "I'm Safe" celebration animation
- `SharePromptButtons.jsx` - Social media share buttons
- `WalkingModal.jsx` - Walking check-in modal

#### **components/circle/** - Living Circle Components
Components for the interactive bestie circle visualization (refactored from LivingCircle).

- `BestieSlot.jsx` - Individual bestie slot with badges and actions
- `CircleAnimations.jsx` - All CSS animations in one file
- `CircleCenterScore.jsx` - Center health score display with tooltip
- `CircleStats.jsx` - Bottom info section with circle progress
- `CircleVisualization.jsx` - SVG connection lines and particle animations
- `EmptySlot.jsx` - Empty slot with add functionality
- `ReplaceModal.jsx` - Modal for replacing besties in circle

#### **components/health/** - Circle Health Components
Components for circle health metrics and recommendations (refactored from CircleHealthPage).

- `ConnectionBreakdown.jsx` - Connection metrics breakdown
- `ConnectionsList.jsx` - List of individual connections with scores
- `HealthScoreCard.jsx` - Overall health score display
- `LevelUpTips.jsx` - Actionable improvement tips
- `PerfectCircleDemo.jsx` - Perfect circle demo visualization
- `ProgressToNextLevel.jsx` - Progress to next level milestone

#### **components/profile/** - Profile Customization Components
Components for user profile display and customization.

- `BadgesSection.jsx` - Display earned badges
- `DonationStatus.jsx` - Donor status and perks
- `LoginStreak.jsx` - Login streak display
- `ProfileAuraStyles.jsx` - Profile aura/glow effects
- `ProfileCard.jsx` - Main profile card component
- `ProfileCompletion.jsx` - Profile completion progress
- `ProfileCustomizer.jsx` - Profile customization interface
- `StatsSection.jsx` - User statistics section
- `WeeklySummary.jsx` - Weekly activity summary

##### **profile/layouts/** - Profile Layout Themes
Different visual layouts for profile pages.

- `index.js` - Exports all layout components
- `BentoLayout.jsx` - Bento box grid layout
- `ClassicLayout.jsx` - Classic traditional layout
- `MagazineLayout.jsx` - Magazine-style layout
- `MinimalLayout.jsx` - Minimal clean layout
- `PolaroidLayout.jsx` - Polaroid photo style
- `ScrapbookLayout.jsx` - Scrapbook collage style
- `SplitScreenLayout.jsx` - Split screen layout
- `StoryLayout.jsx` - Story/timeline layout

##### **profile/themes/** - Profile Theme Customization
Visual theme options for profiles.

- `backgrounds.js` - Background color/pattern presets
- `decorativeElements.js` - Decorative SVG elements
- `illustratedBackgrounds.js` - Illustrated background patterns
- `specialEffects.js` - Special visual effects (particles, glows)
- `typography.js` - Typography presets
- `vibePresets.js` - Complete vibe/aesthetic presets

#### **components/settings/** - Settings Page Components
Components for the settings page.

- `LegalSection.jsx` - Legal links (terms, privacy, etc.)
- `NotificationSettings.jsx` - Notification preferences
- `PreferencesAndQuickAccess.jsx` - General preferences
- `PremiumSMSSection.jsx` - SMS subscription management
- `PrivacySettings.jsx` - Privacy controls
- `SecurityPasscodes.jsx` - Security passcode setup

---

### **src/pages/** - Page Components

Full page components representing different routes in the app.

- `AboutBestiesPage.jsx` - About the app page
- `AdminBackfillPage.jsx` - Admin tool for data backfills
- `AlertViewPage.jsx` - View active alerts page
- `BadgesPage.jsx` - View all badges page
- `BestiesPage.jsx` - **Refactored** Main social feed page (726 lines from 1,104)
- `BestiesPage_OLD.jsx` - Backup of original BestiesPage
- `CheckInHistoryPage.jsx` - Check-in history list
- `CircleHealthPage.jsx` - **Refactored** Circle health metrics page (219 lines from 785)
- `CreateCheckInPage.jsx` - **Refactored** Create new check-in page (613 lines from 1,591)
- `CreateCheckInPage_OLD.jsx` - Backup of original CreateCheckInPage
- `DevAnalyticsPage.jsx` - **Refactored** Admin analytics dashboard (521 lines from 789)
- `EditProfilePage.jsx` - Edit profile information page
- `ErrorDashboard.jsx` - Admin error monitoring dashboard
- `ExportDataPage.jsx` - Export user data page
- `HomePage.jsx` - Home dashboard page
- `LocationFavoritesPage.jsx` - Saved favorite locations
- `LoginPage.jsx` - Login/signup page
- `MonitoringDashboard.jsx` - Admin monitoring dashboard
- `OnboardingPage.jsx` - Onboarding flow page
- `PrivacyPolicyPage.jsx` - Privacy policy page
- `ProfilePage.jsx` - User profile display page
- `SettingsPage.jsx` - Settings and preferences page
- `SocialFeedPage.jsx` - Social feed page
- `SubscriptionCancelPage.jsx` - Subscription cancellation page
- `SubscriptionSuccessPage.jsx` - Subscription success page
- `TemplatesPage.jsx` - Template gallery page
- `TermsOfServicePage.jsx` - Terms of service page
- `ViewUserProfilePage.jsx` - View another user's profile

---

### **src/** - Root Files

- `App.jsx` - Main app component with routing
- `index.js` - React DOM entry point

---

## 📊 Refactoring Impact Summary

### Backend Functions
- **Before:** 1 file (2,763 lines)
- **After:** 39 files (avg ~100 lines each)
- **Reduction:** 98% smaller main index file
- **Organization:** 10 domain directories

### Frontend Components
- **Before:** 6 monolithic files (5,599 lines)
- **After:** 47 focused components
- **Reduction:** ~50% average file size reduction
- **Organization:** 5 new component directories

### Total Codebase
- **Modules Created:** 85+ files
- **Average File Size:** ~100-150 lines
- **Maintainability:** ⭐⭐⭐⭐⭐
- **Testability:** ⭐⭐⭐⭐⭐

---

## 🎯 Key Benefits

✅ **Single Responsibility** - Each file has one clear purpose
✅ **Easy Navigation** - Find any feature in seconds
✅ **DRY Code** - Shared utilities eliminate duplication
✅ **Test Coverage** - Smaller units are easier to test
✅ **Collaboration** - Multiple devs can work without conflicts
✅ **Scalability** - Adding features is straightforward
✅ **Code Reviews** - Smaller diffs are easier to review
✅ **Onboarding** - New developers can understand structure quickly

---

## 📝 Naming Conventions

### Backend (Functions)
- **PascalCase** for functions: `onUserCreated.js`
- **camelCase** for utilities: `sendNotification`
- **Domain prefix** for organization: `core/checkins/`

### Frontend (React)
- **PascalCase** for components: `BestieCard.jsx`
- **camelCase** for hooks: `useFormValidation.js`
- **camelCase** for services: `errorTracking.js`
- **lowercase** for utils: `phoneUtils.js`

---

*Last updated after complete refactoring on 2025-11-28*
