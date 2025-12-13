# Task: Complete Notification System Audit & Redesign

## Your Mission

Perform a comprehensive audit of the entire notification system in the Besties app, then redesign it to work correctly and efficiently.

## Phase 1: Deep Audit (Map Everything)

Search the codebase and document:

### 1. All Notification Channels
Find and document every notification channel:
- **In-App Notifications** (where/how created, what they look like)
- **Push Notifications** (FCM/APNS implementation)
- **SMS** (via Twilio)
- **Email** (via SendGrid)
- **Telegram** (bot integration)
- **Facebook Messenger** (integration)
- **WhatsApp** (via Twilio)

For each channel, answer:
- Where is it implemented? (file paths, function names)
- What triggers it?
- What does the message say? (exact text)
- When does it send?
- Are there user preferences for it?
- Does it work correctly?

### 2. All Notification Types
Find every type of notification sent:
- Check-in created notifications
- Check-in expiring/expired alerts
- Emergency SOS alerts
- Duress code alerts
- Bestie request notifications
- Check-in completion notifications
- App updates/announcements
- Payment/subscription notifications
- Low credit warnings
- Any others?

For each type:
- What channels does it use?
- What's the exact message content?
- What's the priority/urgency?
- Are there any issues with it?

### 3. Current Message Content
Document the exact message text for each notification type on each channel. Create a table like:

| Notification Type | Channel | Message Content | Issues |
|-------------------|---------|----------------|--------|
| Check-in expired | SMS | "🚨 {name} needs help..." | Too long (>160 chars) |
| Check-in expired | Push | "..." | ... |
| Emergency SOS | Telegram | "..." | ... |

### 4. Current Fallback/Priority Logic
- What's the current priority order? (e.g., Push → Telegram → SMS)
- Are there fallbacks when one channel fails?
- How does it decide which channel to use?

### 5. Issues & Gaps
Document everything broken, missing, or inefficient:
- Messages that don't send
- Wrong message content
- Missing channels
- Duplicate notifications
- No response tracking
- Wasteful SMS usage
- Poor UX
- Anything else wrong

## Phase 2: Propose Redesign

Based on your audit, create a redesigned notification system that:

### Core Principles:
1. **Reliability:** Every critical alert must reach someone
2. **Cost-Efficiency:** Minimize SMS usage (it costs money)
3. **User Control:** Users choose their preferred channels
4. **Response Tracking:** Know when someone saw/responded to alerts
5. **Smart Escalation:** Only escalate when needed
6. **Consistent Messaging:** Same notification = same message across channels
7. **Priority-Based:** Critical alerts get special handling

### Your Redesign Should Include:

1. **Channel Priority System**
   - Free channels first (Push, Telegram, Email, Messenger)
   - SMS as last resort or escalation
   - User-configurable preferences

2. **Notification Templates**
   - Standardized message templates for each notification type
   - Different versions for different channels (short for SMS, rich for in-app)
   - Consistent tone and branding

3. **Response Tracking**
   - Track when notifications viewed
   - Track when users respond/take action
   - Stop escalation when responded

4. **Smart Escalation** (for alerts only)
   - Send free channels to everyone immediately
   - SMS escalates one-at-a-time if no response
   - Configurable intervals and priority

5. **Error Handling**
   - Retry logic for failed sends
   - Fallback channels
   - Admin alerts for critical failures

## Phase 3: Implementation Plan

Create a step-by-step plan to implement the redesign:

1. Files to create
2. Files to modify
3. Database schema changes
4. Testing requirements
5. Migration plan
6. Rollback strategy

## Deliverables

Provide:

1. **Audit Report** - Complete documentation of current state
2. **Redesign Specification** - New notification system architecture
3. **Implementation Plan** - How to build it
4. **Message Templates** - Every notification type, every channel
5. **Migration Guide** - How to transition from old to new

## Important Notes

- This app is a **safety app** - notifications failing = people in danger
- SMS costs money - be smart about usage
- Users in different timezones - handle that
- Some users only have one channel enabled - handle that
- Emergency situations require immediate delivery
- Don't break anything that currently works

## Context

This is the Besties app - a safety check-in app where:
- Users create timed check-ins with besties
- If timer expires without check-in, besties get alerted
- Emergency SOS button triggers immediate alerts to all besties
- Multiple notification channels for redundancy

Start by exploring the codebase to understand what exists, then proceed with the audit.
