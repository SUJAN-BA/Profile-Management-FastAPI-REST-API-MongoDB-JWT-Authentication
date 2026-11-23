# Authentication and Profile Management

FastAPI REST API with MongoDB persistence, JWT bearer authentication, and a
browser frontend for registration, login, and profile management.

## Run locally

Use Python 3.10 or newer.

1. Install MongoDB locally or create a MongoDB database and copy `.env.example`
   to `.env`.
2. Set `MONGODB_URI` to your database connection string. Replace
   `JWT_SECRET_KEY` with a unique random value of at least 32 bytes (for example,
   generate one with `python -c "import secrets; print(secrets.token_urlsafe(32))"`).
   Do not commit `.env` or share its contents.
3. Install dependencies and start the API from the project directory:

   ```powershell
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --reload
   ```

4. Open `http://127.0.0.1:8000/register`. API documentation is available at
   `http://127.0.0.1:8000/docs`.

The application creates unique email/profile indexes and a TTL index for
revoked JWTs on startup. MongoDB must be reachable before starting the API.

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account with `email` and an 8-128 character `password` |
| `POST` | `/api/auth/login` | Public | Validate credentials and return an access token |
| `GET` | `/api/auth/me` | Bearer token | Return the authenticated user's ID and email |
| `POST` | `/api/auth/logout` | Bearer token | Revoke the current token |
| `GET` | `/api/profile/` | Bearer token | Read the current user's profile (404 until saved) |
| `PUT` | `/api/profile/` | Bearer token | Create or replace the current user's profile |

Send protected requests with `Authorization: Bearer <access_token>`. The profile
includes name, phone number, date of birth (ISO `YYYY-MM-DD`), gender, and the
existing student, hobbies, interests, address, and branch fields. Invalid or
expired tokens return 401; invalid profile input returns 422.

The frontend keeps its bearer token in `sessionStorage` for the current browser
tab and clears it on logout or an expired session. As with any JavaScript
accessible token storage, this does not protect against scripts executing in
the same origin; deploy with HTTPS and protect the frontend against XSS.

## Postman

In the Postman desktop app, create these requests using the running API at
`http://127.0.0.1:8000`. For requests with a body, select **Body > raw > JSON**
and set `Content-Type: application/json`.

1. **Register**

   - Method: `POST`
   - URL: `http://127.0.0.1:8000/api/auth/register`
   - Body:

     ```json
     {
       "email": "you@example.com",
       "password": "test-password-123"
     }
     ```

2. **Login**

   - Method: `POST`
   - URL: `http://127.0.0.1:8000/api/auth/login`
   - Body: use the same email and password as registration.

   Copy `access_token` from the response.

3. **Get the current user**

   - Method: `GET`
   - URL: `http://127.0.0.1:8000/api/auth/me`
   - In **Authorization**, choose **Bearer Token** and paste the access token.

4. **Logout**

   - Method: `POST`
   - URL: `http://127.0.0.1:8000/api/auth/logout`
   - Use the same Bearer Token authorization. No body is needed.

The `/api/auth/me` and `/api/auth/logout` requests require the token returned
by a successful login. After logout, that token is revoked.
