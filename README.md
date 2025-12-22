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

- Backend: http://localhost:8000  
- Health check: http://localhost:8000/api/health/

## 2. API Documentation

- Swagger UI: http://localhost:8000/api/docs/  
- ReDoc (Documentation): http://localhost:8000/api/redoc/

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
http://localhost:8000/admin/

#### API Key for Gemini and Google Maps

Add the following keys to the .env file:

GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

Note: Enable Places API, Elevation API and Directions API in the Google Cloud Console