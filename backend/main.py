from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
import re

app = FastAPI(title="Email Recon Awareness API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    email: str

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "application/json, text/html, */*",
}

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

ABSTRACT_API_KEY = "0563d876bbf5466d8f2b6561c1f2a2a0"

async def check_gmail_available(email: str, client: httpx.AsyncClient) -> dict:
    """
    Check if a Gmail address exists using Abstract API email verification.
    """
    if not email.endswith("@gmail.com"):
        return {
            "platform": "Gmail",
            "status": "skipped",
            "detail": "Not a Gmail address — availability check skipped.",
            "risk": "unknown",
            "icon": "gmail"
        }
    try:
        resp = await client.get(
            "https://emailvalidation.abstractapi.com/v1/",
            params={"api_key": ABSTRACT_API_KEY, "email": email},
            timeout=15,
        )
        data = resp.json()
        deliverability = data.get("deliverability", "")
        is_valid_format = data.get("is_valid_format", {}).get("value", False)
        is_disposable = data.get("is_disposable_email", {}).get("value", False)

        if deliverability == "UNDELIVERABLE":
            return {
                "platform": "Gmail",
                "status": "available",
                "detail": "This Gmail address does NOT exist — it is unclaimed and can be registered. An attacker can create it and use password resets on linked platforms.",
                "risk": "critical",
                "icon": "gmail"
            }
        elif deliverability == "DELIVERABLE":
            return {
                "platform": "Gmail",
                "status": "taken",
                "detail": "This Gmail address already exists and is active. The Gmail hijack vector is blocked.",
                "risk": "safe",
                "icon": "gmail"
            }
        else:
            return {
                "platform": "Gmail",
                "status": "uncertain",
                "detail": f"Could not definitively verify Gmail status (deliverability: {deliverability}).",
                "risk": "unknown",
                "icon": "gmail"
            }
    except Exception as e:
        return {
            "platform": "Gmail",
            "status": "error",
            "detail": f"Abstract API error: {str(e)}",
            "risk": "unknown",
            "icon": "gmail"
        }

async def check_instagram(email: str, client: httpx.AsyncClient) -> dict:
    """
    Instagram allows password reset requests for any email without verification.
    We probe the reset endpoint — if it responds as if the account exists, the email is linked.
    """
    try:
        resp = await client.post(
            "https://www.instagram.com/accounts/account_recovery_send_ajax/",
            data={"email_or_username": email, "recaptcha_challenge_field": ""},
            headers={
                **HEADERS,
                "X-CSRFToken": "missing",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": "https://www.instagram.com/accounts/password/reset/",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=10,
        )
        body = resp.text.lower()
        if resp.status_code == 200 and ("email_sent" in body or "true" in body or "success" in body):
            return {
                "platform": "Instagram",
                "status": "linked",
                "detail": "An Instagram account is linked to this email. Password reset can be triggered without verifying email ownership.",
                "risk": "high",
                "icon": "instagram"
            }
        elif resp.status_code in (400, 403):
            return {
                "platform": "Instagram",
                "status": "not_found",
                "detail": "No Instagram account found linked to this email.",
                "risk": "low",
                "icon": "instagram"
            }
        else:
            return {
                "platform": "Instagram",
                "status": "uncertain",
                "detail": f"Ambiguous response from Instagram (HTTP {resp.status_code}). May be rate-limited.",
                "risk": "unknown",
                "icon": "instagram"
            }
    except Exception as e:
        return {
            "platform": "Instagram",
            "status": "error",
            "detail": f"Request failed: {str(e)}",
            "risk": "unknown",
            "icon": "instagram"
        }

async def check_tiktok(email: str, client: httpx.AsyncClient) -> dict:
    """
    TikTok's pre-check endpoint lets you verify if an email is registered
    without sending a code or requiring any authentication.
    """
    try:
        resp = await client.get(
            "https://www.tiktok.com/passport/web/user/prelogin/",
            params={"account": email, "service": "tiktok"},
            headers={**HEADERS, "Referer": "https://www.tiktok.com/"},
            timeout=10,
        )
        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        # TikTok returns data.data.status: 1 = registered, 0 = not registered
        status_code = data.get("data", {}).get("status")
        if status_code == 1:
            return {
                "platform": "TikTok",
                "status": "linked",
                "detail": "A TikTok account is linked to this email. Reset flow can be triggered without verifying email ownership.",
                "risk": "high",
                "icon": "tiktok"
            }
        elif status_code == 0:
            return {
                "platform": "TikTok",
                "status": "not_found",
                "detail": "No TikTok account found linked to this email.",
                "risk": "low",
                "icon": "tiktok"
            }
        else:
            return {
                "platform": "TikTok",
                "status": "uncertain",
                "detail": "TikTok returned an unexpected response. Possibly rate-limited or API changed.",
                "risk": "unknown",
                "icon": "tiktok"
            }
    except Exception as e:
        return {
            "platform": "TikTok",
            "status": "error",
            "detail": f"Request failed: {str(e)}",
            "risk": "unknown",
            "icon": "tiktok"
        }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/scan")
async def scan(req: ScanRequest):
    email = req.email.strip().lower()

    if not is_valid_email(email):
        return {"error": "Invalid email address format."}

    async with httpx.AsyncClient(follow_redirects=True) as client:
        results = await asyncio.gather(
            check_gmail_available(email, client),
            check_instagram(email, client),
            check_tiktok(email, client),
        )

    results = list(results)

    # Build the attack chain
    gmail_result = results[0]
    linked_platforms = [r for r in results[1:] if r["status"] == "linked"]

    chain_possible = gmail_result["status"] == "available" and len(linked_platforms) > 0

    risk_score = 0
    for r in results:
        if r["risk"] == "critical": risk_score += 40
        elif r["risk"] == "high": risk_score += 30
        elif r["risk"] == "low": risk_score += 0
    risk_score = min(risk_score, 100)

    return {
        "email": email,
        "results": results,
        "chain_possible": chain_possible,
        "linked_platforms": [r["platform"] for r in linked_platforms],
        "risk_score": risk_score,
        "summary": build_summary(gmail_result, linked_platforms, chain_possible)
    }

def build_summary(gmail_result, linked_platforms, chain_possible):
    if chain_possible:
        platforms = ", ".join([p["platform"] for p in linked_platforms])
        return f"⚠️ Attack chain viable. Gmail address is unclaimed, and {platforms} account(s) are linked to it. An attacker can register this Gmail and trigger password resets on those platforms — no 2FA needed."
    elif gmail_result["status"] == "available" and not linked_platforms:
        return "Gmail is unclaimed but no linked platform accounts were found. Risk is lower, but the email should still be claimed to prevent future exposure."
    elif gmail_result["status"] == "taken":
        return "Gmail address is already registered. The core hijack vector via Gmail is blocked. Ensure the owner also has 2FA enabled."
    else:
        return "Scan complete. Review individual results below."
