from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import re

app = FastAPI(title="Email Recon Awareness API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def is_valid_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/proxy/instagram")
async def proxy_instagram(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://www.instagram.com/accounts/account_recovery_send_ajax/",
                data={"email_or_username": email, "recaptcha_challenge_field": ""},
                headers={"X-Requested-With": "XMLHttpRequest"})
            text = res.text.lower()
            if res.status_code == 200 and ("email_sent" in text or '"ok"' in text or "true" in text):
                return {"status": "linked", "detail": "An Instagram account is linked to this email.", "risk": "high"}
            elif res.status_code in [400, 404]:
                return {"status": "not_found", "detail": "No Instagram account found.", "risk": "low"}
            return {"status": "uncertain", "detail": "Ambiguous response.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"Check failed: {str(e)}", "risk": "unknown"}

@app.get("/proxy/tiktok")
async def proxy_tiktok(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://www.tiktok.com/passport/web/user/prelogin/?account={email}&service=tiktok")
            data = res.json()
            status = data.get("data", {}).get("status")
            if status == 1:
                return {"status": "linked", "detail": "A TikTok account is linked to this email.", "risk": "high"}
            elif status == 0:
                return {"status": "not_found", "detail": "No TikTok account found.", "risk": "low"}
            return {"status": "uncertain", "detail": "Unexpected response.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"Check failed: {str(e)}", "risk": "unknown"}

@app.post("/api/scan")
async def scan(email: str):
    if not is_valid_email(email):
        return {"error": "Invalid email"}
    return {"email": email}
