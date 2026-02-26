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

## 3. Run the Frontend (Expo / React Native)

Expo runs on your machine (not in Docker):

```bash
cd mobile
npm install   # first time only
npm start
```

## 4. View the Frontend

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

## 5. Formatting/Linting

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

Note: Enable Places API, Elevation API and Directions API in the Google Cloud Console

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
