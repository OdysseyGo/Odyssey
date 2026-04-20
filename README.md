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

## 4. Run the Frontend (Expo / React Native)

Expo runs on your machine (not in Docker):

```bash
cd mobile
npm install   # first time only
npm start
```

## 5. View the Frontend

### On your phone

1. Install **Expo Go** on your device.
2. Connect phone and computer to the same Wi‑Fi.
3. Scan the QR code shown in the Expo terminal or devtools.

### In your browser (web)

- With Expo running, press **`w`** in the Expo terminal.

### On iOS simulator (macOS)

- Download IOS Emulator from XCode
- With Expo running, press **`i`** in the Expo terminal.

Changes in `mobile/` are reflected automatically via Fast Refresh.

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

#### Stripe Payments Setup

Odyssey uses **Stripe** for subscription billing and credit pack purchases. The backend handles checkout sessions and webhooks; the mobile app opens Stripe Checkout in the browser.

**1. Create a Stripe Account**

Sign up at [stripe.com](https://stripe.com) and switch to **Test mode** (toggle in the dashboard).

**2. Get API Keys**

Go to **Developers → API keys** and copy:
- `STRIPE_SECRET_KEY` — starts with `sk_test_`
- `STRIPE_PUBLISHABLE_KEY` — starts with `pk_test_`

**3. Create Subscription Products**

In **Products → Add product**, create two prices for the premium subscription:
- Monthly: e.g. $9.99/month — copy the **Price ID** → `STRIPE_MONTHLY_PRICE_ID`
- Yearly: e.g. $79.99/year — copy the **Price ID** → `STRIPE_YEARLY_PRICE_ID`

**4. Create Credit Pack Products**

For each credit pack, create a one-time price product in Stripe (e.g. 50 credits for $2.99). Then seed the `CreditPack` table via Django admin or the shell with the matching `stripe_price_id`.

**5. Set Up Webhooks (local development)**

Install the Stripe CLI and run:

```bash
stripe listen --forward-to localhost:8000/api/payments/webhook/
```

Copy the **webhook signing secret** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

**6. Update `.env`**

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

**7. Run migrations**

```bash
docker compose exec backend python manage.py migrate
```

**Payment API Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/payments/plans/` | GET | No | List subscription plans |
| `/api/payments/subscribe/` | POST | Yes | Create Stripe Checkout for subscription |
| `/api/payments/subscription/` | GET | Yes | Get current subscription status |
| `/api/payments/subscription/cancel/` | POST | Yes | Cancel subscription at period end |
| `/api/payments/subscription/reactivate/` | POST | Yes | Reactivate canceled subscription |
| `/api/payments/credit-packs/` | GET | No | List available credit packs |
| `/api/payments/credits/purchase/` | POST | Yes | Create Stripe Checkout for credits |
| `/api/payments/credits/balance/` | GET | Yes | Get credit balance + transactions |
| `/api/payments/tours/{id}/unlock/` | POST | Yes | Spend credits to unlock a tour |
| `/api/payments/tours/{id}/access/` | GET | Yes | Check tour access |
| `/api/payments/ai-allowance/` | GET | Yes | Get AI generation quota |
| `/api/payments/webhook/` | POST | No | Stripe webhook (signature verified) |

**End-to-End Flow**

1. User taps **Subscribe** → backend creates a Stripe Checkout Session URL
2. Mobile opens URL in browser → user pays → Stripe redirects back
3. Stripe fires `checkout.session.completed` webhook → backend fulfills (sets `user_type=PREMIUM` or adds credits)
4. User can now access premium tours or spend credits to unlock paid tours

**Test Cards**

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | 3D Secure required |

Use any future expiry, any CVC, any ZIP.

