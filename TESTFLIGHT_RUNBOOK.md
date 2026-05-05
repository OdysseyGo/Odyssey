# Odyssey TestFlight Runbook

Use this runbook for each iOS TestFlight release.

## 1. App Store Connect Prerequisites

- App record exists in App Store Connect.
- Bundle ID matches production app bundle ID exactly.
- Internal testers are added to TestFlight.

## 2. Production Environment Variables (EAS)

Set once (or update when changed):

```bash
cd mobile
npx eas-cli env:create --environment production --name APP_BUNDLE_ID --value com.yourcompany.odyssey
npx eas-cli env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://api.odysseygo.quest
npx eas-cli env:create --environment production --name ADMOB_APP_ID_IOS --value ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
npx eas-cli env:create --environment production --name ADMOB_APP_ID_ANDROID --value ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
```

Verify:

```bash
cd mobile
npx eas-cli env:list --environment production
```

## 3. Backend Production Readiness (Azure)

Required env:

- `DEBUG=0`
- strict `ALLOWED_HOSTS`
- strict `CORS_ALLOWED_ORIGINS`
- strict `CSRF_TRUSTED_ORIGINS`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_AUTH_KEY_P8_B64`
- `APNS_BUNDLE_ID` (must equal iOS bundle ID)
- `APNS_USE_SANDBOX=False`

Apply DB changes:

```bash
cd backend
python manage.py migrate
```

## 4. AdMob / SSV Readiness

- Rewarded ad unit SSV callback URL:
  `https://<your-backend-host>/api/ads/rewards/ssv/`
- Production iOS ad unit IDs are set in backend `AdPlacement`.
- Current mobile-used placements:
  - `tour_complete_interstitial`
  - `rewarded_ai_slot`
  - `rewarded_hint`
  - `rewarded_hint_reveal`
- Currently disabled as unused:
  - `profile_banner`
  - `tour_start_interstitial`
  - `rewarded_credits`

## 5. Build + Submit to TestFlight

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Notes:

- `mobile/eas.json` is already configured for production builds.
- Submit config is minimal; first submit may prompt for App Store Connect metadata.

## 6. App Store Connect TestFlight Steps

- Wait for build processing to complete.
- Add build to Internal Testing group.
- Fill Test Information:
  - What to test
  - Contact email
  - Optional demo account

## 7. On-Device QA Checklist

- App cold start and login/registration works.
- Terms update flow works.
- Location, camera, photos permissions behave correctly.
- ATT prompt appears and deny path still works.
- Push token registers after login.
- Production push notification delivery works.
- Rewarded ad flow grants backend reward via SSV.
- AI tour generation works after rewarded slot.
- Tour completion interstitial appears.
- No crashes on background/foreground transitions.

## 8. Compliance Gate Before External Testing

- Privacy Policy URL present.
- App Privacy (nutrition labels) updated for AdMob data usage.
- Tracking declaration/ATT consistent with app behavior.
- Age rating/content declarations complete.
- Export compliance answered in App Store Connect.

## 9. Release Hygiene

- Bump app version/build every upload.
- Add meaningful TestFlight release notes.
- Keep previous stable build available as fallback.
