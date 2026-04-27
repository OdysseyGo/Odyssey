# Odyssey

## Setup

Make sure you have

- Docker + Docker compose
- Node.js and npm
- (Optional, for mobile) IOS/Android Emulator

Copy the example environment and update secrets:

```bash
cp .env.example .env
```

## 1. Start Backend + Database

From the project root:

```bash
docker compose up --build
```

- Backend: <http://localhost:8000>  
- Health check: <http://localhost:8000/api/health/>

## 2. API Documentation

- Swagger UI: <http://localhost:8000/api/docs/>  
- ReDoc (Documentation): <http://localhost:8000/api/redoc/>

## 3. Run the Admin Dashboard

The admin dashboard is a separate React + Vite web app for staff/admin users.

```bash
cd admin-dashboard
npm install   # first time only
npm run dev
```

- Admin Dashboard: <http://localhost:5173>

Log in with a Django staff account (`is_staff=true`). The dashboard proxies all `/api` requests to `localhost:8000`, so the backend must be running.

**Features:**
- Overview stats (users, tours, reports)
- User management: view, ban/unban, change role, toggle staff
- Tour management: view, approve, reject, archive, delete
- Analytics: growth charts, user/tour/difficulty distributions, active users
- Reports: review and action user-submitted reports

## 4. Frontend Development (Mobile iOS with Expo + Xcode)

This project uses Expo + React Native with native iOS builds for on-device testing.

### Prerequisites (macOS)

Install the following:

- Node.js + npm
- Xcode (latest stable from App Store)
- Xcode Command Line Tools
- iOS SDK and development tools (installed with Xcode verify via Xcode > Settings > Components)
- Apple ID signed in to Xcode

### First-time mobile setup

From the repository root:

```bash
cd mobile
npm install
```

Generate native iOS project files from Expo config:

```bash
npx expo prebuild --platform ios
```

### iOS signing and certificate setup (Xcode)

1. Open `mobile/ios/Odyssey.xcworkspace` in Xcode (use `.xcworkspace`, not `.xcodeproj`).
2. Go to Xcode > Settings > Accounts and sign in with your Apple ID.
3. Select the `Odyssey` app target > Signing & Capabilities.
4. Enable `Automatically manage signing`.
5. Select your Team.

### Physical device requirements (iPhone)

Before first install to device:

1. Connect iPhone via USB.
2. On iPhone, tap `Trust This Computer`.
3. Enable Developer Mode on iOS (Settings > Privacy & Security > Developer Mode), then reboot if prompted.
4. Keep device unlocked during first build/install.

### Run and test on iOS device

From `mobile/`:

```bash
npx expo prebuild --platform ios
npx expo run:ios --device "<your device name>"
```

Run prebuild again whenever you change native-relevant app config/plugins (for example in `app.config.js`).

## 6. Formatting/Linting

### Backend

#### Validate changes

```bash
#From /backend
./scripts/validate.sh
```

#### Auto-Fix

```bash
#From /backend
ruff check . --fix
black .
```

### Frontend

#### Validate changes

```bash
#From /mobile
npm run validate
```

#### Auto-Fix

```bash
#From /mobile
npm run format
npm run lint -- --fix
```

#### Backend admin page

1. Create superuser
docker compose exec backend python manage.py createsuperuser
2. Admin page
<http://localhost:8000/admin/>

#### API Key for Gemini and Google Maps

Add the following keys to the .env file:

GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

Note: Enable Places API, Elevation API, Geocoding API, and Directions API in the Google Cloud Console

#### AWS S3 Storage Setup

Tour cover images (and any future media uploads) are stored on **Amazon S3** instead of the local filesystem. The Django backend uses the `django-storages` library with `boto3` to upload files directly to S3. A `USE_S3` environment variable lets you toggle between S3 (production/staging) and local file storage (development).

Follow the steps below to configure S3 for your environment:

1. **Create an S3 Bucket**
   - Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and navigate to **S3**.
   - Click **Create bucket** and choose a unique name (e.g., `odyssey-tours-media`).
   - Select a region close to your users (e.g., `eu-central-1`). Remember this — you'll need it for `AWS_S3_REGION_NAME`.
   - **Uncheck** "Block *all* public access" so the mobile app can load images directly via URL. Acknowledge the warning.
   - Leave all other options as default and create the bucket.

2. **Configure CORS on the Bucket**
   CORS (Cross-Origin Resource Sharing) is required so that the mobile app and website can fetch images from the bucket's domain. Without this the browser/app will block the requests.
   - Open your bucket → **Permissions** tab → scroll to **CORS configuration** → click **Edit** and paste:

     ```json
     [
         {
             "AllowedHeaders": ["*"],
             "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
             "AllowedOrigins": ["*"],
             "ExposeHeaders": []
         }
     ]
     ```

   - Save the changes.

3. **Create an IAM User (programmatic access)**
   The backend needs credentials to upload files to S3. An IAM user provides a scoped access key for this purpose.
   - Go to **IAM** → **Users** → **Create user**.
   - Give it a descriptive name (e.g., `odyssey-backend-s3`).
   - On the permissions step, attach the managed policy **`AmazonS3FullAccess`** (or create a custom policy scoped to your bucket for tighter security).
   - After the user is created, go to **Security credentials** → **Create access key** and choose the "Application running outside AWS" use case.
   - Copy the **Access Key ID** and **Secret Access Key** — you will need them in the next step.

4. **Update your `.env` file**
   Add or update the following variables in your `.env` (see `.env.example` for reference):

   ```dotenv
   USE_S3=True
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_STORAGE_BUCKET_NAME=odyssey-tours-media
   AWS_S3_REGION_NAME=eu-central-1
   ```

   - **`USE_S3`** — Set to `True` to enable S3 storage. When set to `False` (or omitted), Django falls back to saving files in a local `media/` directory, which is useful for offline development.
   - **`AWS_STORAGE_BUCKET_NAME`** — Must match the bucket name you created in step 1.
   - **`AWS_S3_REGION_NAME`** — Must match the region you selected when creating the bucket.

5. **Rebuild & Verify**

   ```bash
   docker compose up --build
   ```

   The `boto3` and `django-storages` packages (listed in `backend/requirements/base.txt`) will be installed automatically during the Docker build. Once running, any image uploaded through the API (e.g., tour cover images) will be stored in your S3 bucket and served via `https://<bucket>.s3.amazonaws.com/`.

#### Advertisements (Google AdMob)

Odyssey shows banner, interstitial, and rewarded ads via Google AdMob. Rewarded ads are verified server-to-server with AdMob Server-Side Verification (SSV) and grant **credits**, **free AI tour slots**, **puzzle hints/skips**, or **tour revives** (the revive flow is reserved for a future feature; the backend ledger is ready).

Backend lives in `backend/apps/ads/` (mounted at `/api/ads/`). Mobile lives in `mobile/contexts/AdsContext.tsx` and `mobile/components/Ads/`.

1. **Add AdMob app IDs to `.env`** (use Google's published test IDs for dev — they're already wired as fallbacks):

   ```dotenv
   ADMOB_APP_ID_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
   ADMOB_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
   ```

2. **Seed `AdPlacement` rows** via Django admin (`http://localhost:8000/admin/` → Ads → Ad placements). At minimum:

   | key | ad_format | reward_type | reward_amount |
   |---|---|---|---|
   | `profile_banner` | BANNER | NONE | 0 |
   | `tour_start_interstitial` | INTERSTITIAL | NONE | 0 |
   | `tour_complete_interstitial` | INTERSTITIAL | NONE | 0 |
   | `rewarded_credits` | REWARDED | CREDITS | 50 |
   | `rewarded_ai_slot` | REWARDED | AI_SLOT | 1 |
   | `rewarded_hint` | REWARDED | HINT | 1 |
   | `rewarded_hint_reveal` | REWARDED | HINT | 1 |

   Leave `ad_unit_id_ios`/`ad_unit_id_android` blank in development — the mobile app falls back to AdMob's test ad unit IDs whenever `__DEV__` is true. Set real ad unit IDs only for the production build.

3. **Configure SSV in AdMob.** In the AdMob console, under each rewarded ad unit's settings, set the SSV callback URL to:

   ```
   https://<your-backend-host>/api/ads/rewards/ssv/
   ```

   No shared secret is needed — the endpoint validates Google's ECDSA signature against `https://www.gstatic.com/admob/reward/verifier-keys.json`.

4. **EAS Build is required for testing on device.** Expo Go cannot host the AdMob native module. Use `npx eas-cli build --profile development --platform ios` (or `--platform android`) and install the build on a device.

5. **App Store compliance notes:**
   - The ATT (App Tracking Transparency) prompt is shown on first iOS launch via `expo-tracking-transparency`. The `NSUserTrackingUsageDescription` string is set in `mobile/app.config.js`.
   - Ads are deliberately **not** shown during active walking navigation (a known Apple rejection vector).
   - Before submission, declare AdMob's data collection (Identifiers, Usage Data, Diagnostics) in App Store Connect's privacy nutrition labels.
