from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import re

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/proxy/instagram")
async def proxy_instagram(email: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post("https://www.instagram.com/accounts/account_recovery_send_ajax/",
                data={"email_or_username": email, "recaptcha_challenge_field": ""},
                headers={"X-Requested-With": "XMLHttpRequest"})
            if r.status_code == 200:
                return {"status": "linked", "detail": "Instagram account found.", "risk": "high"}
            return {"status": "not_found", "detail": "No account found.", "risk": "low"}
    except:
        return {"status": "error", "detail": "Check failed.", "risk": "unknown"}

@app.get("/proxy/tiktok")
async def proxy_tiktok(email: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://www.tiktok.com/passport/web/user/prelogin/?account={email}&service=tiktok")
            data = r.json()
            status = data.get("data", {}).get("status")
            if status == 1:
                return {"status": "linked", "detail": "TikTok account found.", "risk": "high"}
            return {"status": "not_found", "detail": "No account found.", "risk": "low"}
    except:
        return {"status": "error", "detail": "Check failed.", "risk": "unknown"}
