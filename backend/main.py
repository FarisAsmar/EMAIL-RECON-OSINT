from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/proxy/instagram")
async def proxy_instagram(email: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.instagram.com/accounts/account_recovery_send_ajax/",
                data={"email_or_username": email, "recaptcha_challenge_field": ""},
                headers={"X-Requested-With": "XMLHttpRequest"}
            )
            text = response.text.lower()
            if response.status_code == 200 and ("email_sent" in text or "true" in text):
                return {"status": "linked", "detail": "Instagram account found.", "risk": "high"}
            return {"status": "not_found", "detail": "No account found.", "risk": "low"}
    except Exception as e:
        return {"status": "error", "detail": str(e), "risk": "unknown"}

@app.get("/proxy/tiktok")
async def proxy_tiktok(email: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.tiktok.com/passport/web/user/prelogin/?account={email}&service=tiktok"
            )
            data = response.json()
            status_code = data.get("data", {}).get("status")
            if status_code == 1:
                return {"status": "linked", "detail": "TikTok account found.", "risk": "high"}
            return {"status": "not_found", "detail": "No account found.", "risk": "low"}
    except Exception as e:
        return {"status": "error", "detail": str(e), "risk": "unknown"}
