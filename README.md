# Mail Recon Awareness v2

> Demonstrates how unclaimed or reused email addresses can be hijacked across platforms — raising awareness about credential hygiene and the critical importance of 2FA.

**For educational purposes only. Never scan emails you don't own.**

---

## How it works

1. You enter an email address
2. The tool checks if that Gmail address is **unclaimed** (can still be registered)
3. It then probes **Instagram** and **TikTok** — platforms that allow signup/reset without verifying email ownership
4. If the Gmail is free AND accounts exist on those platforms → the full takeover chain is demonstrated:
   - Attacker registers the Gmail
   - Triggers "Forgot password" on Instagram/TikTok
   - Reset link arrives in attacker's inbox
   - No 2FA = full takeover. Done.

---

## Project structure

```
email-recon/
├── backend/
│   ├── main.py           # FastAPI app — all platform checks
│   ├── requirements.txt
│   └── railway.toml      # Railway deployment config
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── components/
    │       ├── Scanner.jsx   # Email input + how-it-works
    │       ├── Scanner.css
    │       ├── Results.jsx   # Chain diagram + platform breakdown
    │       └── Results.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

---

## Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# .env.local already points to localhost:8000 — no changes needed for local dev
npm install
npm run dev
```

Frontend will be at `http://localhost:5173`

---

## Deployment (Railway + Vercel)

### Step 1 — Deploy the backend to Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose **Deploy from GitHub repo** → select this repo
3. Set the **root directory** to `backend`
4. Railway auto-detects the `railway.toml` and runs `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Once deployed, copy your Railway backend URL (e.g. `https://email-recon-api.up.railway.app`)

### Step 2 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set the **root directory** to `frontend`
3. Add an environment variable:
   ```
   VITE_API_URL = https://your-railway-url.up.railway.app
   ```
4. Deploy — Vercel auto-runs `npm run build`

Done. Your frontend calls the Railway API, Railway does all the HTTP probing.

---

## Adding more platforms

To add a new platform check, add a new async function in `backend/main.py`:

```python
async def check_newplatform(email: str, client: httpx.AsyncClient) -> dict:
    # probe the platform's password reset or signup endpoint
    # return a dict with: platform, status, detail, risk, icon
    ...
```

Then add it to the `asyncio.gather()` call in `/api/scan` and update `Results.jsx` to include it in the chain diagram.

Only add platforms that **don't require email verification** during signup or password reset — that's the whole point.

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, httpx (async) |
| Frontend | React 18, Vite |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Disclaimer

This tool is built for security awareness and education. It only sends requests that any browser would send during a normal password reset flow — no exploitation, no credential access, no account modification. Use responsibly and only on email addresses you own.
