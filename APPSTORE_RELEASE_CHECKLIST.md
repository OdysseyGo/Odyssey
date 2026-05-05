# Odyssey iOS App Store Release Checklist

This checklist is for publishing the iOS app build to TestFlight/App Store.

## 1. Required Accounts

- Apple Developer Program account with App Store Connect access
- Expo account with EAS enabled
- AdMob account with iOS app + ad units configured

## 2. Required Environment Values

Set these in EAS (not only local `.env`):

```bash
cd mobile
npx eas-cli env:create --environment production --name APP_BUNDLE_ID --value com.yourcompany.odyssey
npx eas-cli env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://api.odysseygo.quest
npx eas-cli env:create --environment production --name ADMOB_APP_ID_IOS --value ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
npx eas-cli env:create --environment production --name ADMOB_APP_ID_ANDROID --value ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
```

Backend production env must include:

- `DEBUG=0`
- strict `ALLOWED_HOSTS`
- strict `CORS_ALLOWED_ORIGINS`
- strict `CSRF_TRUSTED_ORIGINS`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_AUTH_KEY_P8_B64`
- `APNS_BUNDLE_ID` (must match iOS bundle ID)
- `APNS_USE_SANDBOX=False`

## 3. AdMob + Backend SSV

- Run backend migrations in production so ad placement defaults and disable rules are applied:

```bash
cd backend
python manage.py migrate
```

- In AdMob rewarded ad unit settings, set SSV callback URL:
  `https://<your-backend-host>/api/ads/rewards/ssv/`
- In backend Admin, fill production `ad_unit_id_ios` for enabled placements.
- Placements currently used by mobile app:
  - `tour_complete_interstitial`
  - `rewarded_ai_slot`
  - `rewarded_hint`
  - `rewarded_hint_reveal`
- Unused placements are disabled by migration:
  - `profile_banner`
  - `tour_start_interstitial`
  - `rewarded_credits`

## 4. iOS Signing / Push

- Bundle identifier in App Store Connect must match build bundle ID.
- Push entitlement is split by build config:
  - Debug: `development`
  - Release: `production`
- Ensure APNs key and topic (`APNS_BUNDLE_ID`) match the same app.

## 5. First TestFlight Build Commands

```bash
cd mobile
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform ios --profile production
```

After build completes, submit:

```bash
cd mobile
npx eas-cli submit --platform ios --profile production
```

`eas.json` keeps submit config minimal; CLI will prompt for App Store Connect metadata on first submit.

## 6. Pre-Submission QA Gates

- Login / registration / terms flow
- Location + camera + photo permissions
- ATT prompt behavior
- Rewarded ad -> SSV reward grant works
- AI tour generation with `use_ad_slot` works
- Interstitial shown only on tour completion
- Push notification register + delivery works in production APNs mode

## 7. App Store Connect Metadata

- Privacy policy URL
- App privacy data categories for AdMob
- Tracking declaration (ATT)
- Age rating and content declarations
- Screenshots for required devices
