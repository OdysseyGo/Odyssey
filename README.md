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

#### Apple In-App Purchase Setup

Odyssey uses **Apple In-App Purchases (IAP)** for subscription billing and credit pack purchases. The mobile app presents the native StoreKit purchase sheet; the backend verifies signed transactions with the App Store Server API and listens to App Store Server Notifications V2.

**1. Configure Products in App Store Connect**

In **App Store Connect → Your App → In-App Purchases**, create:

- **Auto-renewable subscriptions** (group: `odyssey_premium`):
  - `com.odyssey.subscription.monthly`
  - `com.odyssey.subscription.yearly`
- **Consumable** products for each credit pack (e.g. `com.odyssey.credits.50`, `com.odyssey.credits.150`). The `product_id` of each `CreditPack` row must match the App Store product ID.

**2. Generate an App Store Server API Key**

In **App Store Connect → Users and Access → Integrations → In-App Purchase**, create a key with the *In-App Purchase* role and download the `.p8` file. Record the **Key ID** and **Issuer ID**.

**3. Update `.env`**

```dotenv
APPLE_BUNDLE_ID=com.odyssey.app
APPLE_ISSUER_ID=your-issuer-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_ENVIRONMENT=Sandbox   # or Production
APPLE_APP_APPLE_ID=your-numeric-app-id
```

**4. Configure App Store Server Notifications V2**

In App Store Connect, set the **Production/Sandbox Server URL** for notifications to:

```
https://<your-backend-host>/api/payments/iap/notifications/
```

This endpoint verifies the signed payload and updates subscription state (renewals, cancellations, refunds) automatically.

**5. Seed credit packs**

Create `CreditPack` rows via Django admin with `product_id` set to the matching App Store consumable product ID.

**6. Run migrations**

```bash
docker compose exec backend python manage.py migrate
```

**Payment API Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/payments/plans/` | GET | No | List subscription plans |
| `/api/payments/subscription/` | GET | Yes | Get current subscription status |
| `/api/payments/subscription/manage/` | GET | Yes | Get the App Store subscription management URL |
| `/api/payments/credit-packs/` | GET | No | List available credit packs |
| `/api/payments/credits/balance/` | GET | Yes | Get credit balance + transactions |
| `/api/payments/tours/{id}/unlock/` | POST | Yes | Spend credits to unlock a tour |
| `/api/payments/tours/{id}/access/` | GET | Yes | Check tour access |
| `/api/payments/ai-allowance/` | GET | Yes | Get AI generation quota |
| `/api/payments/creator/earnings/` | GET | Yes | Get creator earnings breakdown |
| `/api/payments/iap/verify/` | POST | Yes | Verify a signed StoreKit transaction (subscription or credit pack) |
| `/api/payments/iap/notifications/` | POST | No | App Store Server Notifications V2 endpoint (signature verified) |

**End-to-End Flow**

1. User taps **Subscribe** or **Buy credits** → mobile app calls StoreKit to complete the purchase natively.
2. App sends the resulting signed `JWSTransaction` to `/api/payments/iap/verify/`.
3. Backend verifies the signature with `appstoreserverlibrary`, then either activates/upgrades the `Subscription` or credits the user's balance.
4. Lifecycle events (renewal, cancellation, refund, billing retry) are delivered to `/api/payments/iap/notifications/` and applied server-side.

**Sandbox Testing**

- Create a **Sandbox Tester** in App Store Connect and sign in on the device via *Settings → App Store → Sandbox Account*.
- Set `APPLE_ENVIRONMENT=Sandbox` in the backend `.env`.
- Use the sandbox tester to make purchases — no real charges occur.

