# Firebase Monitoring Alerts Setup Guide

**Purpose**: Configure Firebase monitoring alerts to catch errors and issues early  
**Platform**: Firebase Console  
**Estimated Time**: 30 minutes

---

## 🎯 Overview

Set up automated alerts for:
- High error rates in Cloud Functions
- Function execution failures
- Performance degradation
- Cost threshold warnings
- Database issues

---

## 📊 Recommended Alerts

### 1. **Cloud Functions Error Rate Alert**

**What it monitors**: Error rate across all functions  
**Threshold**: >5% error rate  
**Action**: Email notification to admin

**Setup Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Functions** → **Dashboard**
4. Click **Monitoring** tab
5. Click **Create Alert**
6. Configure:
   - **Metric**: Error rate
   - **Condition**: Greater than 5%
   - **Duration**: 5 minutes
   - **Notification**: Email
7. Click **Save**

---

### 2. **Critical Function Failure Alert**

**What it monitors**: Specific critical functions failing  
**Functions to monitor**:
- `completeCheckIn`
- `createCheckoutSession`
- `checkExpiredCheckIns`
- `triggerEmergencySOS`

**Setup Steps**:
1. Functions → Monitoring
2. Create Alert for each critical function
3. Configure:
   - **Metric**: Execution count
   - **Condition**: Drops to 0 when expected
   - **Or**: Error count > 10 in 5 minutes
4. Save alert

---

### 3. **Cost Threshold Alert**

**What it monitors**: Firebase billing costs  
**Threshold**: Set based on your budget  
**Recommended**: $50/month for small app, $200/month for growing app

**Setup Steps**:
1. Go to **Project Settings** → **Usage and billing**
2. Click **Details & settings**
3. Scroll to **Budget alerts**
4. Click **Set budget**
5. Configure:
   - **Budget amount**: $50 (or your threshold)
   - **Alert thresholds**: 50%, 75%, 90%, 100%
   - **Notification**: Email
6. Click **Save**

---

### 4. **Firestore Read/Write Spike Alert**

**What it monitors**: Unusual database activity  
**Threshold**: 2x normal read/write rate

**Setup Steps**:
1. Go to **Firestore** → **Usage**
2. Note your normal daily read/write counts
3. Set up Cloud Monitoring alert:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **Monitoring** → **Alerting**
   - Click **Create Policy**
   - Select **Firestore** metrics
   - Set threshold to 2x your normal rate
   - Add notification channel (email)

---

### 5. **Storage Quota Alert**

**What it monitors**: Firebase Storage usage  
**Threshold**: 80% of quota

**Setup Steps**:
1. Go to **Storage** → **Usage**
2. Check your current usage and quota
3. Set up alert at 80% capacity
4. Configure notification

---

### 6. **Authentication Failure Spike**

**What it monitors**: Failed login attempts  
**Threshold**: >100 failures in 5 minutes (potential attack)

**Setup Steps**:
1. Go to **Authentication** → **Usage**
2. Set up monitoring for failed attempts
3. Alert if spike detected

---

## 📧 Notification Channels

### Email Notifications
**Recommended for**: All alerts  
**Setup**: Automatically configured with Firebase account

### Slack Integration (Optional)
**Recommended for**: Team environments

**Setup Steps**:
1. Create Slack webhook URL
2. Go to Cloud Monitoring → Notification Channels
3. Add Slack channel
4. Configure webhook URL
5. Test notification

### SMS Alerts (Optional)
**Recommended for**: Critical production issues  
**Setup**: Via Cloud Monitoring notification channels

---

## 🔍 Monitoring Dashboard

### Create Custom Dashboard

**Metrics to track**:
- Total users (daily)
- Active check-ins (real-time)
- Function invocations (hourly)
- Error rates (hourly)
- Database reads/writes (daily)
- Storage usage (daily)
- Costs (daily)

**Setup Steps**:
1. Go to Cloud Monitoring → Dashboards
2. Click **Create Dashboard**
3. Add charts for each metric
4. Save dashboard
5. Bookmark for daily review

---

## ⚠️ Alert Fatigue Prevention

### Best Practices
- Don't set thresholds too low (avoid false positives)
- Group related alerts
- Use different notification channels for different severity levels
- Review and adjust thresholds monthly
- Disable alerts during maintenance windows

### Alert Severity Levels

**Critical** (Immediate action required):
- Emergency SOS function failing
- Payment processing errors
- Database completely down
- Notification: SMS + Email + Slack

**High** (Action required within 1 hour):
- Error rate >5%
- Critical function failures
- Cost threshold exceeded
- Notification: Email + Slack

**Medium** (Action required within 24 hours):
- Performance degradation
- Storage quota warnings
- Notification: Email only

**Low** (Informational):
- Daily usage reports
- Weekly cost summaries
- Notification: Email digest

---

## 📋 Alert Response Checklist

### When Alert Fires

1. **Acknowledge**: Confirm you received the alert
2. **Assess**: Check Firebase Console for details
3. **Investigate**: Review logs and error messages
4. **Act**: Fix the issue or escalate
5. **Document**: Note what happened and how you fixed it
6. **Follow-up**: Verify alert clears after fix

---

## 🔧 Useful Firebase Console Links

- **Functions Logs**: `https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs`
- **Firestore Data**: `https://console.firebase.google.com/project/YOUR_PROJECT/firestore`
- **Usage & Billing**: `https://console.firebase.google.com/project/YOUR_PROJECT/usage`
- **Cloud Monitoring**: `https://console.cloud.google.com/monitoring`

---

## ✅ Setup Verification

After setting up alerts, verify they work:

- [ ] Trigger a test error in a function
- [ ] Verify error alert fires
- [ ] Check email notification received
- [ ] Review alert details in console
- [ ] Adjust thresholds if needed

---

## 📊 Recommended Review Schedule

- **Daily**: Check monitoring dashboard
- **Weekly**: Review alert history, adjust thresholds
- **Monthly**: Analyze trends, optimize alerts
- **Quarterly**: Review and update alert strategy

---

**Last Updated**: 2025-12-20  
**Next Review**: After first week of production use
