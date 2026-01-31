# Instagram Platform API Integration

**Version:** 0.4.9
**Last Updated:** January 30, 2026
**API:** Instagram Platform API (replaced Instagram Basic Display API in 2024)

## Overview

Zona21 integrates with Instagram Platform API to enable direct post scheduling and publishing from your media library. This guide covers complete setup, configuration, testing, and troubleshooting.

**Key Requirement:** Instagram **Business** or **Creator** account (Personal accounts are not supported by the Platform API)

## Table of Contents

1. [Quick Start](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [Configuration](#configuration)
4. [Testing & Verification](#testing--verification)
5. [Troubleshooting](#troubleshooting)
6. [Security](#security)
7. [API Migration Notes](#api-migration-notes)
8. [References](#references)

---

## Quick Start

### TL;DR

You **will NOT** find "Instagram API" as a standalone product in the Meta Dashboard. Instagram is now configured via **"Use Cases"** + **"Permissions"**.

### Where to Find Everything in Meta Dashboard

When you open your app at https://developers.facebook.com/apps/YOUR_APP_ID:

```
Left Sidebar Menu:
├── Dashboard (home screen)
├── Use cases ← START HERE
├── App Review
│   └── Permissions and Features ← THEN HERE
├── Settings
│   └── Basic ← CREDENTIALS HERE
├── Roles
└── ...others
```

### Quick Setup Steps

1. **Use Cases:** Menu → "Use cases" → "Authenticate and request data from users" → Get started
2. **Facebook Login:** Configure OAuth redirect URI: `zona21://oauth/callback`
3. **Permissions:** Menu → "App Review" → "Permissions and Features" → Request:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
4. **Credentials:** Menu → "Settings" → "Basic" → Copy App ID and App Secret
5. **Configure Zona21:** Create `instagram-config.json` with your credentials

---

## Detailed Setup

### Step 1: Create App on Meta for Developers

1. Go to: https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Choose type: **"Business"** (recommended) or **"Consumer"**
4. App name: "Zona21" (or any name)
5. Contact email: Your email

### Step 2: Configure Use Cases

⚠️ **IMPORTANT:** Instagram API is no longer a separate "product". It's configured via **Use Cases**.

1. In app sidebar, click **"Use cases"**
2. You'll see cards with options:

```
┌─────────────────────────────────────────┐
│ Authenticate and request data from users│ ← CLICK THIS
│ Let people log in and share data        │
│                                         │
│              [Get started]               │
└─────────────────────────────────────────┘
```

3. Click **"Get started"** on the first card
4. This activates **Facebook Login** (required for Instagram)

### Step 3: Configure OAuth Redirect

1. Inside "Authenticate and request data from users"
2. Configure **Facebook Login**
3. In **"Valid OAuth Redirect URIs"**, add:
   ```
   zona21://oauth/callback
   ```
4. For **"Deauthorize Callback URL"** and **"Data Deletion Request URL"**, add any valid URL:
   ```
   https://zona21.app/deauth
   https://zona21.app/delete
   ```
5. Click **"Save Changes"**

### Step 4: Request Instagram Permissions

1. Sidebar → **"App Review"** → **"Permissions and Features"**
2. Search for "instagram" in the search box
3. Request these permissions:
   - ✅ `instagram_business_basic` - Click "Request"
   - ✅ `instagram_business_content_publish` - Click "Request"
4. **For development/testing:** Permissions activate immediately
5. **For production:** Must submit for Meta review

### Step 5: Get Credentials

1. Sidebar → **"Settings"** → **"Basic"**
2. Scroll down to find:

```
App ID
123456789012345                    [Copy]
                                   ↑ COPY THIS

App Secret
*****************************      [Show] [Copy]
                                   ↑ CLICK "SHOW" AND COPY
```

3. **COPY** both values securely

---

## Configuration

### Account Type Requirement

⚠️ **CRITICAL:** Instagram Platform API requires a **Business** or **Creator** account. Personal accounts will not work.

#### Check Your Account Type

1. Open Instagram app on mobile
2. Go to Profile → Menu (☰) → Settings → Account
3. Check if it says:
   - ✅ "Professional account" or "Creator" → **Correct**
   - ❌ "Personal account" → **Must convert** (see below)

#### Convert Personal → Business/Creator

1. Settings → Account → Switch account type
2. Choose "Professional account" → "Creator" or "Business"
3. Complete the steps (category, contact information)
4. Connect to a Facebook Page (create one if needed)
5. Wait 5-10 minutes for changes to propagate

### Zona21 Configuration

#### Option A: Configuration File (Recommended) ⭐

**1. Copy the example file:**
```bash
cp instagram-config.example.json instagram-config.json
```

**2. Edit `instagram-config.json` with your credentials:**
```json
{
  "instagram": {
    "appId": "123456789012345",
    "appSecret": "your_app_secret_here",
    "redirectUri": "zona21://oauth/callback"
  }
}
```

**3. IMPORTANT:** The file `instagram-config.json` is already in `.gitignore`. **NEVER** commit it to git!

#### Option B: Environment Variables

If you prefer, use environment variables:

```bash
export INSTAGRAM_APP_ID="123456789012345"
export INSTAGRAM_APP_SECRET="your_app_secret_here"
export INSTAGRAM_REDIRECT_URI="zona21://oauth/callback"
```

Or create a `.env` file:

```env
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=zona21://oauth/callback
```

### Configuration File Locations

Zona21 searches in this priority order:

1. **Environment variables** (`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`)
2. **Project root** (development): `./instagram-config.json`
3. **User data directory** (production): `~/Library/Application Support/Zona21/instagram-config.json` (macOS)

---

## Testing & Verification

### Basic Connection Test

1. Open Zona21
2. Click **"Instagram"** button in Toolbar or navigate to Instagram tab
3. Click **"Connect Instagram"**
4. Browser window should open with Instagram authorization
5. After authorizing, you should see:
   - Success message
   - Your profile photo and username
   - Connected status

### Verify OAuth URL

When the browser opens, check that the URL contains:
```
https://api.instagram.com/oauth/authorize?
  client_id=YOUR_APP_ID
  &scope=instagram_business_basic,instagram_business_content_publish
  &response_type=code
  &redirect_uri=zona21://oauth/callback
```

### Test Post Publishing

**Prerequisites:** OAuth connection successful (above test passed)

**Steps:**

1. In Instagram tab, select an image from your library
2. Click **"Schedule Post"** or Instagram button
3. Fill in:
   - **Caption:** "Test post from Zona21 🎉"
   - **Hashtags:** #test #zona21
   - **Aspect ratio:** 1:1 (Square)
   - **Date/time:** Now (immediate publish)
4. Click **"Schedule"**

**Expected Results:**

- UI shows: `Pending → Publishing → Published`
- Post appears in your Instagram feed
- Caption and hashtags are correct

### Console Verification

Open Electron DevTools (View → Toggle Developer Tools) and check console logs:

**Successful OAuth:**
```
[oauth-manager] Starting Instagram OAuth flow
[oauth-manager] OAuth completed successfully
[oauth-manager] Token saved
```

**Successful Publishing:**
```
[instagram-publisher] Creating media container...
[instagram-publisher] Container created: IG_CONTAINER_ID
[instagram-publisher] Container status: FINISHED
[instagram-publisher] Publishing container...
[instagram-publisher] Post published successfully!
[instagram-publisher] Permalink: https://www.instagram.com/p/...
```

### Database Verification

Check saved token (macOS):

```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db <<EOF
SELECT
  username,
  scopes,
  datetime(expires_at/1000, 'unixepoch', 'localtime') as expires_at
FROM oauth_tokens
WHERE provider='instagram';
.quit
EOF
```

**Expected output:**
```
username | scopes | expires_at
---------|--------|------------
your_username | instagram_business_basic,instagram_business_content_publish | 2026-03-31 ...
```

---

## Troubleshooting

### Error: "Instagram not configured"

**Cause:** `instagram-config.json` file doesn't exist or has placeholder values.

**Solution:**
1. Verify file exists at correct location
2. Confirm you replaced `YOUR_INSTAGRAM_APP_ID` and `YOUR_INSTAGRAM_APP_SECRET` with real values
3. Restart the app

### Error: "OAuth callback failed"

**Cause:** Redirect URI not configured correctly in Meta for Developers.

**Solution:**
1. Go to https://developers.facebook.com/ → Your App → Use Cases → Facebook Login
2. Confirm `zona21://oauth/callback` is in **"Valid OAuth Redirect URIs"**
3. Click "Save Changes"
4. Wait 2-3 minutes for propagation
5. Try again

### Error: "Invalid client_id or client_secret"

**Cause:** Incorrect credentials.

**Solution:**
1. Verify you copied the **App ID** (not Facebook App ID)
2. Verify you copied the **App Secret** correctly (click "Show" first)
3. Check for extra spaces at beginning/end of strings in JSON
4. Ensure values are wrapped in quotes in JSON

### Error: "Personal account detected"

**Cause:** Your Instagram account is Personal (not Business/Creator).

**Full error message:**
```
Personal account detected. Instagram Platform API requires a Business or Creator account.
Go to Settings > Account > Switch account type in the Instagram app.
```

**Solution:**
1. Open Instagram app on mobile
2. Settings → Account → Switch account type
3. Choose "Professional account" → "Creator" or "Business"
4. Complete setup and connect to Facebook Page
5. Wait 5-10 minutes
6. Try connecting again in Zona21

### Error: "Permissions error" or "OAuthException"

**Cause:** Account not Business/Creator or not connected to Facebook.

**Solution:**
1. Verify account type (Settings → Account in Instagram app)
2. Convert to Business/Creator if necessary
3. Connect to a Facebook Page
4. Wait 5-10 minutes
5. Try again

### Error: "Redirect URI mismatch"

**Cause:** Meta Dashboard hasn't propagated changes yet.

**Solution:**
1. Confirm redirect URI is saved: `zona21://oauth/callback`
2. Wait 2-3 minutes
3. Try again
4. If still failing, recreate the OAuth redirect configuration

### Error: "App not in Live Mode"

**Cause:** Meta app is in Development mode.

**Solution:**
1. Meta Dashboard → Your App → Settings
2. Check if app is in "Live Mode"
3. For development/testing: Add test users in Roles
4. For production: Submit app for Meta review

### Issue: "Can't find Use Cases in menu"

**Cause 1:** Wrong app type

**Solution:**
1. Menu → Settings → Basic
2. Check "App Type"
3. If not "Business", create new Business-type app

**Cause 2:** Old dashboard

**Solution:**
1. Try direct URL: `https://developers.facebook.com/apps/YOUR_APP_ID/use-cases/`
2. Or look for "Business settings" or "App settings"

### Debug: Check Configuration Loading

Open Electron DevTools console and look for:

```javascript
[config-loader] Instagram config found
[config-loader] Config loaded from: /path/to/instagram-config.json
```

If you see:
```javascript
[config-loader] Instagram not configured
[config-loader] Searched paths: ...
```

Then Zona21 couldn't find your config file in any of the expected locations.

---

## Security

### Best Practices

- ✅ `instagram-config.json` is in `.gitignore`
- ✅ Tokens are stored encrypted in SQLite database
- ✅ Logs mask tokens (only show first/last 4 characters)
- ⚠️ **NEVER** share your `appSecret` publicly
- ⚠️ **NEVER** commit credentials to version control

### Token Storage

Tokens are stored encrypted in:
- **macOS:** `~/Library/Application Support/Zona21/zona21.db`
- **Windows:** `%APPDATA%/Zona21/zona21.db`
- **Linux:** `~/.config/Zona21/zona21.db`

### Token Expiration

- **Access tokens:** Expire after ~60 days
- **Refresh:** Automatically refreshed when near expiration
- **Re-authentication:** Required if auto-refresh fails

### Secure Development

**For development:**
1. Use `instagram-config.json` in project root
2. Never commit this file
3. Create separate app for testing

**For production:**
1. Copy config to user data directory
2. Use different App ID/Secret from development
3. Submit app for Meta review before public release

---

## API Migration Notes

### Platform API vs Basic Display API

**Previous:** Instagram Basic Display API (deprecated 2024)
**Current:** Instagram Platform API (recommended)

**Key Differences:**

| Feature | Basic Display API | Platform API |
|---------|-------------------|--------------|
| Account Type | Personal OK | Business/Creator only |
| Scopes | `instagram_basic`, `instagram_content_publish` | `instagram_business_basic`, `instagram_business_content_publish` |
| Publishing | Supported | Supported (same endpoints) |
| Status | Deprecated | Active |

### Migration from Basic Display

If you have an existing token from Basic Display API:

**Good news:** Tokens continue working until natural expiration (~60 days).

**Action required:** When token expires, users must:
1. Convert to Business/Creator account
2. Re-authenticate with new scopes

**What changed in code:**

[electron/main/oauth/oauth-manager.ts](../../electron/main/oauth/oauth-manager.ts)

```typescript
// BEFORE:
const scopes = 'instagram_basic,instagram_content_publish';

// AFTER:
const scopes = 'instagram_business_basic,instagram_business_content_publish';
```

**Validation added:**

```typescript
// Check account type
if (userInfo.account_type === 'PERSONAL') {
  throw new Error('Personal accounts not supported');
}
```

### Backward Compatibility

Zona21 handles tokens with old scopes gracefully:
- Recognizes existing authentication
- Publishing continues working (endpoints unchanged)
- Re-authentication required only after expiration

---

## Features

### Supported Operations

- ✅ OAuth 2.0 authentication
- ✅ Post publishing (photos and videos)
- ✅ Caption and hashtags
- ✅ Aspect ratio selection (1:1, 4:5, 16:9)
- ✅ Scheduled publishing
- ✅ Publishing queue management
- ✅ Auto token refresh
- ✅ Account type validation

### Limitations

- ❌ Personal accounts (Instagram Platform API limitation)
- ❌ Stories (not yet implemented)
- ❌ Reels (not yet implemented)
- ❌ Carousels/Multiple images (not yet implemented)
- ❌ Instagram Shopping tags

### Roadmap

Future enhancements planned:
- [ ] Stories support
- [ ] Reels support
- [ ] Carousel/Album posts
- [ ] Analytics/Insights
- [ ] Comment management

---

## Usage Tips

### Best Practices

1. **Test in development first:** Use `instagram-config.json` in project root
2. **Separate apps:** Create different Meta apps for development and production
3. **Secure credentials:** Use password manager for App Secret
4. **Account type:** Ensure Business/Creator before starting
5. **Monitor quota:** Meta enforces rate limits on API calls

### Scheduling Tips

- **Optimal times:** Schedule based on audience timezone
- **Preview:** Use Zona21 preview to check crop/aspect ratio
- **Captions:** Max 2,200 characters
- **Hashtags:** Max 30 per post (recommended: 5-10)
- **Queue management:** View scheduled posts in Instagram tab

### Performance

- **Publishing time:** 30-60 seconds (Instagram processing)
- **Image optimization:** Zona21 auto-optimizes for Instagram specs
- **Queue processing:** One post every 5 minutes (Instagram recommendation)
- **Retry logic:** Auto-retry on temporary failures

---

## References

### Official Documentation

- [Instagram Platform API](https://developers.facebook.com/docs/instagram-platform)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [OAuth 2.0 with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)

### Community Guides

- [Instagram Platform API GitHub Guide](https://gist.github.com/PrenSJ2/0213e60e834e66b7e09f7f93999163fc)
- [Instagram API Complete Guide 2026](https://tagembed.com/blog/instagram-api/)
- [Instagram Graph API Guide 2025](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)

### Related Zona21 Docs

- [Configuration Guide](../user-guide/preferences.md)
- [Architecture Overview](../developer/architecture.md)
- [API Reference](../developer/api-reference.md)

---

## Support

### Getting Help

If your issue isn't resolved:

1. **Check console logs:** View → Toggle Developer Tools
2. **Check system logs:**
   - macOS: `~/Library/Logs/Zona21/`
   - Windows: `%APPDATA%/Zona21/logs/`
3. **Search GitHub Issues:** [zona21/issues](https://github.com/Almar-cyber/zona21/issues)
4. **Open new issue:** Include logs and error messages

### Reporting Issues

When reporting issues, include:
- Zona21 version (Help → About)
- Operating system
- Instagram account type (Business/Creator/Personal)
- Error messages from console
- Steps to reproduce

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
**API Version:** Instagram Platform API v19.0
