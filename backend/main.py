from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import re
import httpx

app = FastAPI(title="Email Recon Awareness API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def is_valid_email(email): 
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

async def check_instagram_proxy(email):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://www.instagram.com/accounts/account_recovery_send_ajax/",
                headers={"Content-Type": "application/x-www-form-urlencoded", "X-CSRFToken": "missing", "X-Requested-With": "XMLHttpRequest", "Referer": "https://www.instagram.com/accounts/password/reset/"},
                content=f"email_or_username={email}&recaptcha_challenge_field=")
            body = res.text.lower()
            if res.status_code == 200 and ("email_sent" in body or '"ok"' in body or "true" in body):
                return {"status": "linked", "detail": "An Instagram account is linked to this email.", "risk": "high"}
            elif res.status_code in [400, 404]:
                return {"status": "not_found", "detail": "No Instagram account found linked to this email.", "risk": "low"}
            else:
                return {"status": "uncertain", "detail": f"Ambiguous response (HTTP {res.status_code}).", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"Instagram check failed: {str(e)}", "risk": "unknown"}

async def check_tiktok_proxy(email):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://www.tiktok.com/passport/web/user/prelogin/?account={email}&service=tiktok",
                headers={"Referer": "https://www.tiktok.com/"})
            data = res.json()
            statusCode = data.get("data", {}).get("status")
            if statusCode == 1:
                return {"status": "linked", "detail": "A TikTok account is linked to this email.", "risk": "high"}
            elif statusCode == 0:
                return {"status": "not_found", "detail": "No TikTok account found linked to this email.", "risk": "low"}
            else:
                return {"status": "uncertain", "detail": "TikTok returned unexpected response.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"TikTok check failed: {str(e)}", "risk": "unknown"}

@app.get("/proxy/instagram")
async def proxy_instagram(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    return await check_instagram_proxy(email)

@app.get("/proxy/tiktok")
async def proxy_tiktok(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    return await check_tiktok_proxy(email)

@app.get("/health")
async def health():
    return {"status": "ok"}
