# 📊 Complete Analytics Metrics List

This document lists all analytics metrics tracked in the Besties app, their formulas, and where they're displayed.

---

## 👥 User Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Total Users** | `COUNT(users)` | Dev Analytics → User Stats |
| **New (7 days)** | `COUNT(users WHERE createdAt > 7daysAgo)` | Dev Analytics → User Stats |
| **New (30 days)** | `COUNT(users WHERE createdAt > 30daysAgo)` | Dev Analytics → User Stats |
| **Active (7 days)** | `COUNT(users WHERE lastActive > 7daysAgo)` | Dev Analytics → User Stats |
| **Active (30 days)** | `COUNT(users WHERE lastActive > 30daysAgo)` | Dev Analytics → User Stats |
| **Days Active** | `AVG((NOW - firstCheckInDate) / 1 day)` | Dev Analytics → Engagement Stats |

---

## ✅ Check-in Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Total Check-ins** | `COUNT(checkins)` | Dev Analytics → Check-in Stats |
| **Active** | `COUNT(checkins WHERE status='active')` | Dev Analytics → Check-in Stats |
| **Completed** | `COUNT(checkins WHERE status='completed')` | Dev Analytics → Check-in Stats |
| **Alerted** | `COUNT(checkins WHERE status='alerted')` | Dev Analytics → Check-in Stats |
| **Avg Duration** | `SUM(duration) / COUNT(checkins)` | Dev Analytics → Check-in Stats |
| **Completion Rate** | `(completed / total) * 100` | Dev Analytics → Check-in Stats |
| **Weekend Check-ins** | `COUNT(checkins WHERE dayOfWeek IN [0,6])` | Dev Analytics → Engagement Stats |
| **Night Check-ins** | `COUNT(checkins WHERE hour >= 21 OR hour < 6)` | Dev Analytics → Engagement Stats |

---

## 💜 Bestie Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Total Connections** | `COUNT(besties)` | Dev Analytics → Besties Stats |
| **Pending** | `COUNT(besties WHERE status='pending')` | Dev Analytics → Besties Stats |
| **Accepted** | `COUNT(besties WHERE status='accepted')` | Dev Analytics → Besties Stats |
| **Avg Per User** | `(accepted * 2) / totalUsers` | Dev Analytics → Besties Stats |
| **Times Selected as Emergency** | `SUM(COUNT(checkins.bestieIds WHERE userId IN bestieIds))` | Dev Analytics → Engagement Stats |

---

## 💰 Revenue Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **SMS Subscribers** | `COUNT(users WHERE smsSubscription.active=true)` | Dev Analytics → Revenue Stats |
| **Active Donors** | `COUNT(users WHERE donationStats.isActive=true)` | Dev Analytics → Revenue Stats |
| **Total Donations** | `SUM(donationStats.totalDonated)` | Dev Analytics → Revenue Stats |
| **MRR** | `SUM(smsSubscriptions * $1) + SUM(monthlyDonations)` | Dev Analytics → Revenue Stats |

---

## 📈 Engagement Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Avg Check-ins/User** | `totalCheckIns / totalUsers` | Dev Analytics → Engagement Stats |
| **Avg Besties/User** | `(acceptedBesties * 2) / totalUsers` | Dev Analytics → Engagement Stats |
| **Templates Created** | `COUNT(templates)` | Dev Analytics → Engagement Stats |
| **Badges Earned** | `SUM(COUNT(badges.badges))` | Dev Analytics → Engagement Stats |
| **Times Selected as Emergency** | `SUM(COUNT(checkins.bestieIds))` | Dev Analytics → Engagement Stats |
| **Avg Days Active** | `AVG((NOW - firstCheckInDate) / 1 day)` | Dev Analytics → Engagement Stats |
| **Weekend Check-ins** | `COUNT(checkins WHERE dayOfWeek IN [0,6])` | Dev Analytics → Engagement Stats |
| **Night Check-ins** | `COUNT(checkins WHERE hour >= 21 OR hour < 6)` | Dev Analytics → Engagement Stats |

---

## 💸 Cost Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Estimated SMS Cost** | `estimatedSMSSent * $0.0075` | Dev Analytics → Cost Tracking |
| **Estimated WhatsApp Cost** | `estimatedWhatsAppSent * $0.005` | Dev Analytics → Cost Tracking |
| **Estimated Email Cost** | `0` (SendGrid free tier) | Dev Analytics → Cost Tracking |
| **Total Alerts Sent** | `SUM(COUNT(checkins.bestieIds WHERE status='alerted'))` | Dev Analytics → Cost Tracking |

---

## 📊 Growth Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **User Growth Rate** | `((new7days - prevWeekUsers) / prevWeekUsers) * 100` | Dev Analytics → Growth Metrics |
| **Check-in Growth Rate** | `((newCheckIns - prevWeekCheckIns) / prevWeekCheckIns) * 100` | Dev Analytics → Growth Metrics |
| **Retention Rate** | `(active30days / new30days) * 100` | Dev Analytics → Growth Metrics |

---

## 🎯 Funnel Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Signups** | `totalUsers` | Dev Analytics → Funnel Analytics |
| **Completed Onboarding** | `COUNT(users WHERE onboardingCompleted=true)` | Dev Analytics → Funnel Analytics |
| **Added Bestie** | `COUNT(users WHERE hasAddedBestie=true)` | Dev Analytics → Funnel Analytics |
| **First Check-in** | `COUNT(users WHERE stats.firstCheckInDate EXISTS)` | Dev Analytics → Funnel Analytics |
| **Onboarding Rate** | `(completedOnboarding / signups) * 100` | Dev Analytics → Funnel Analytics |
| **Bestie Rate** | `(addedBestie / completedOnboarding) * 100` | Dev Analytics → Funnel Analytics |
| **Check-in Rate** | `(firstCheckIn / addedBestie) * 100` | Dev Analytics → Funnel Analytics |

---

## 🎭 Behavior Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Peak Hour** | `MODE(checkins.createdAt.hour)` | Dev Analytics → User Behavior |
| **Peak Day** | `MODE(checkins.createdAt.dayOfWeek)` | Dev Analytics → User Behavior |
| **Most Common Duration** | `MODE(checkins.duration)` | Dev Analytics → User Behavior |

---

## 📍 Location Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Top Locations** | `GROUP BY location ORDER BY COUNT DESC LIMIT 10` | Dev Analytics → Top Locations |

---

## 🚨 Alert Metrics

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Recent Alerts** | `SELECT * FROM checkins WHERE status='alerted' ORDER BY alertedAt DESC LIMIT 10` | Dev Analytics → Recent Alerts |

---

## 📱 User Profile Metrics (Displayed on Profile Page)

| Metric | Formula | Display Location |
|--------|---------|------------------|
| **Total Check-ins** | `COUNT(checkins WHERE userId=currentUser)` | Profile Page → Stats Section |
| **Safety Streak** | `userData.loginStreak` | Profile Page → Login Streak |
| **Badges Earned** | `COUNT(badges.badges)` | Profile Page → Badges Section |
| **Besties Count** | `COUNT(besties WHERE requesterId=userId OR recipientId=userId)` | Profile Page → Stats Section |
| **Times Selected as Emergency** | `COUNT(checkins WHERE bestieIds CONTAINS userId)` | Profile Page → Stats Section |
| **Days Active** | `(NOW - firstCheckInDate) / 1 day` | Profile Page → Stats Section |
| **Night Check-ins** | `COUNT(checkins WHERE hour >= 21 OR hour < 6)` | Profile Page → Stats Section |
| **Weekend Check-ins** | `COUNT(checkins WHERE dayOfWeek IN [0,6])` | Profile Page → Stats Section |

---

## 🔗 Firebase Analytics Integration

**Status:** Not yet fully integrated. Currently using custom Firestore queries.

**To Connect Firebase Analytics:**
1. Add `firebase/analytics` package
2. Initialize in `firebase.js`
3. Track events using `logEvent()`:
   - `checkin_created`
   - `checkin_completed`
   - `bestie_added`
   - `badge_earned`
   - `sos_triggered`
   - etc.

**Recommended Events to Track:**
- Page views
- Button clicks
- Form submissions
- Feature usage
- Error events
- Conversion events (onboarding, first check-in, etc.)

---

## 📝 Notes

- All metrics are calculated in real-time from Firestore collections
- Time-based metrics respect the selected time range (7d, 30d, all)
- Some metrics require composite indexes in Firestore
- Cost estimates are conservative approximations
- User behavior metrics use MODE (most common value) calculation

