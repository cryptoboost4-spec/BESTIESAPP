# Facebook Advanced Access Request - Business Asset User Profile Access

## 1. How will this app use Business Asset User Profile Access?

**Answer:**

Our app is a safety check-in application that helps users stay safe when traveling or in potentially risky situations. We use Business Asset User Profile Access to:

1. **Display emergency contact names and profile pictures** in the app interface so users can identify and select their trusted contacts when creating safety check-ins.

2. **Personalize safety alert messages** sent via Messenger when a user fails to check in safely. The contact's name and profile picture help the user identify who is checking on them during an emergency situation.

3. **Improve user experience** by showing real names and photos instead of generic placeholders, making it easier for users to manage their emergency contacts and understand who will receive alerts.

---

## 2. Describe how your app uses this permission or feature

**Answer:**

**Step-by-Step User Flow:**

1. **User adds emergency contact via Messenger:**
   - User shares their personal Messenger link (m.me/besties.safety?ref=userId) with a trusted friend or family member
   - Friend clicks the link and sends a message to our Messenger Page
   - Our app receives the webhook event and fetches the friend's profile (name and profile picture) using Business Asset User Profile Access
   - The contact is added to the user's emergency contact list with their real name and photo displayed

2. **User creates a safety check-in:**
   - User opens the app and creates a check-in, selecting which Messenger contacts should be notified
   - The app displays the contact's name and profile picture so the user can identify and select the right person
   - User sets a check-in duration (e.g., "I'll be back in 2 hours")

3. **Safety alert sent if check-in expires:**
   - If the user doesn't check in safely before the time expires, our app automatically sends a safety alert via Messenger
   - The alert includes the user's name, location, and check-in details
   - The contact's name and profile picture are used to personalize the alert message, helping the user identify who is checking on them

4. **Emergency SOS feature:**
   - If a user triggers an emergency SOS, alerts are immediately sent to all active Messenger contacts
   - Contact names and photos are displayed in the alert so users know who has been notified

**Technical Implementation:**

- We use the Facebook Graph API to fetch user profile data (first_name, last_name, profile_pic) when a contact connects via Messenger
- This data is stored locally in our database and used to:
  - Display contacts in the user interface
  - Personalize alert messages
  - Help users identify their emergency contacts

**Current API Usage:**
Our app is actively using the Facebook Graph API. Recent usage statistics show:
- `gr:get:User` - 6 profile fetch calls (working for developers/testers with Standard Access)
- `gr:get:User/accounts` - 38 account verification calls
- `gr:get:Page` - 2 page information calls

**Why Advanced Access is Needed:**
The low number of successful `gr:get:User` calls (only 6) demonstrates that Standard Access only works for developers/testers. We need Advanced Access to enable profile fetching for all live users, which is essential for our safety alert functionality.

**Data Usage:**

- Profile data is only accessed when a user explicitly connects via Messenger (by clicking the m.me link and sending a message)
- Data is only used to display contact information within the app and personalize safety alerts
- We do not share, sell, or use this data for any other purpose
- Data is stored securely and deleted when contacts expire (after 20 hours of inactivity)

---

## 3. Screencast Requirements

**What to Record (2-5 minutes):**

1. **Show contact connection:**
   - User opens app and navigates to Settings
   - User copies their Messenger link
   - Switch to Messenger (or show a friend's perspective)
   - Friend clicks the m.me link
   - Friend sends a message
   - Switch back to app showing the contact appears with their real name and profile picture

2. **Show check-in creation:**
   - User creates a new check-in
   - Show the contact selector displaying the contact's name and photo
   - User selects the Messenger contact
   - User sets check-in duration and creates check-in

3. **Show safety alert (optional - can simulate):**
   - Show what happens when check-in expires
   - Show the alert message sent to Messenger contact
   - Show how the contact's name and photo are used in the alert

**Key Points to Highlight:**
- Contact's real name appears (not "Friend" or generic placeholder)
- Contact's profile picture is displayed
- This helps users identify and select the right emergency contacts
- Alerts are personalized with contact information

---

## 4. Agree that you will comply with allowed usage

**Answer:**

✅ **I agree to comply with the allowed usage for Business Asset User Profile Access.**

We will:
- Only use profile data (name and picture) to display contact information within our safety check-in app
- Only access profile data when users explicitly connect via Messenger
- Use the data solely to personalize safety alerts and improve user experience
- Not share, sell, or use this data for marketing, advertising, or any other purpose
- Store data securely and delete it when contacts expire
- Comply with all Facebook Platform Policies and data usage requirements

---

## Additional Notes for Submission

**Use Case Summary (for quick reference):**
"Our safety check-in app uses Business Asset User Profile Access to display emergency contact names and photos, helping users identify trusted contacts and receive personalized safety alerts when check-ins expire."

**Privacy Policy:**
Ensure your privacy policy mentions:
- How you collect Messenger contact data
- How you use profile information (name, photo)
- How long you store the data
- How users can request data deletion

**Test Instructions for Reviewers:**
1. Go to [your app URL]
2. Sign up or log in
3. Go to Settings > Messenger Contacts
4. Copy your Messenger link
5. Open Messenger and send the link to a test account
6. Test account clicks link and sends a message
7. Return to app - contact should appear with name and photo
8. Create a check-in and select the Messenger contact
9. Verify contact name and photo are displayed correctly

---

## 5. Facebook Login Confirmation

**Answer:**

**We are NOT currently using Facebook Login in this app.**

Our app uses:
- **Email/Password authentication** via Firebase Authentication
- **Facebook Messenger Platform API** (for sending/receiving messages and accessing user profiles via PSID)

We do NOT use:
- Facebook Login (OAuth)
- Facebook SDK for authentication
- Any Meta APIs related to Facebook Login (email, public_profile, user_friends, user_gender, user_birthday, etc.)

**Why we're not using Facebook Login:**
- Our app uses email/password authentication for user accounts
- We only interact with Facebook through the Messenger Platform API to send safety alerts and fetch contact profile information
- Facebook Login is planned for future implementation but is currently disabled in our codebase

**Testing Instructions (without Facebook Login):**
1. Visit our app at: https://bestiesapp.web.app (or your production URL)
2. Click "Sign Up" or "Log In"
3. Use email/password authentication (test credentials provided below)
4. Navigate to Settings > Messenger Contacts
5. Copy your Messenger link
6. Test the Messenger integration as described in the main test instructions

---

## 6. Test Credentials

**Answer:**

**Web App Access:**
- **Email:** bestiesappp@gmail.com
- **Password:** facebooktester
- **Access Code:** accesscode-web-1

**Additional Test Account (if needed):**
- **Access Code:** accesscode-web-2

**Note:** These credentials are active and will remain valid for one year after submission. The access codes can be used to bypass any paywall or premium features if applicable.

**How to Use:**
1. Go to https://bestiesapp.web.app (or your production URL)
2. Click "Sign Up" or "Log In"
3. Enter the email and password above
4. If prompted for an access code, enter: `accesscode-web-1`
5. Complete the sign-up/login process
6. Navigate to Settings > Messenger Contacts to test the Messenger integration

---

## 7. Payment/Membership Access Codes

**Answer:**

**Access Codes (if payment or membership required):**
- accesscode-web-1
- accesscode-web-2

**Note:** Our app is currently free to use. If any premium features are added in the future, these access codes will provide full access for testing purposes. Codes will remain active for one year after submission.

**If No Payment Required:**
Our app is free to use. No payment or membership is required to access the full functionality, including the Messenger integration feature.

---

## 8. Geographic Restrictions

**Answer:**

**No geographic restrictions apply.**

Our app is accessible worldwide. There are no geo-blocking, geo-fencing, or location-based restrictions. Users from any country can:
- Sign up and create an account
- Use all features including Messenger integration
- Add emergency contacts via Messenger
- Create safety check-ins
- Receive and send safety alerts

**Available Locations:**
- All countries worldwide
- No IP-based restrictions
- No country-specific limitations

---

## 9. Additional Documents

**Answer:**

**Privacy Policy:**
Our privacy policy is available at: https://bestiesapp.web.app/privacy

**Terms of Service:**
Our terms of service are available at: https://bestiesapp.web.app/terms (if applicable)

**App Store Listings:**
- Web App: https://bestiesapp.web.app
- (Add iOS/Android store links if applicable)

**Support Documentation:**
- Messenger Setup Guide: Available in our app documentation
- User Guide: Available in-app via help sections

**Note:** All required documentation is publicly accessible and complies with Facebook Platform Policies and applicable data protection regulations.

