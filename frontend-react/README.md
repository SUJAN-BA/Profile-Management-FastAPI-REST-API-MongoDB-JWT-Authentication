# React Profile Management Frontend

This React application is an independent frontend for the existing FastAPI and MongoDB backend.

## Requirements

- Node.js 18 or newer
- FastAPI backend running on `127.0.0.1:8000`

## Build and start the complete application

```powershell
cd C:\Users\sujan\Fastapi\frontend-react
npm install
npm run build
cd ..
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Open `http://127.0.0.1:8000`.

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`.

## Routes

- `/login`
- `/register`
- `/dashboard`
- `/profile`

## Structure

- `src/pages` - Route-level pages
- `src/layouts` - Authentication and application shells
- `src/components` - Reusable UI components
- `src/context` - JWT authentication context
- `src/services/api.js` - Axios API layer
