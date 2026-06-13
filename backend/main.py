from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio, re, random
from playwright.async_api import async_playwright

app = FastAPI(title="Email Recon Awareness API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
]

def is_valid_email(email): 
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

async def check_gmail_playwright(email):
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto("https://accounts.google.com/signup/v2/createaccount", wait_until="load", timeout=15000)
            await page.fill('input[type="email"]', email)
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            content = await page.content()
            await browser.close()
            if "already in use" in content.lower() or "that email already exists" in content.lower():
                return {"status": "taken", "detail": "This Gmail address already exists and is active. The Gmail hijack vector is blocked.", "risk": "safe"}
            if "you can create a new gmail account" in content.lower() or "create your google account" in content.lower():
                return {"status": "available", "detail": "This Gmail address does NOT exist — it is unclaimed. An attacker can register it and trigger password resets on linked platforms.", "risk": "critical"}
            return {"status": "uncertain", "detail": "Gmail response unclear — may be rate-limited.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"Gmail check failed: {str(e)}", "risk": "unknown"}

async def check_tiktok_playwright(email):
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto("https://www.tiktok.com/login/phone-or-email/email", wait_until="load", timeout=15000)
            await page.fill('input[placeholder*="email"]', email)
            await page.fill('input[type="password"]', "dummypassword123")
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            content = await page.content()
            await browser.close()
            if "account doesn't exist" in content.lower() or "user not found" in content.lower():
                return {"status": "not_found", "detail": "No TikTok account found linked to this email.", "risk": "low"}
            if "password" in content.lower() and ("incorrect" in content.lower() or "doesn't match" in content.lower()):
                return {"status": "linked", "detail": "A TikTok account is linked to this email.", "risk": "high"}
            return {"status": "uncertain", "detail": "TikTok response unclear — may be rate-limited.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"TikTok check failed: {str(e)}", "risk": "unknown"}

async def check_instagram_playwright(email):
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto("https://www.instagram.com/accounts/password/reset/", wait_until="load", timeout=15000)
            await page.fill('input[name="email_or_username"]', email)
            await page.click('button:has-text("Send login link")')
            await page.wait_for_timeout(3000)
            content = await page.content()
            await browser.close()
            if "couldn't find" in content.lower() or "no account found" in content.lower() or "account doesn't exist" in content.lower():
                return {"status": "not_found", "detail": "No Instagram account found linked to this email.", "risk": "low"}
            if "sent" in content.lower() or "check your email" in content.lower():
                return {"status": "linked", "detail": "An Instagram account is linked to this email.", "risk": "high"}
            return {"status": "uncertain", "detail": "Instagram response unclear — may be rate-limited.", "risk": "unknown"}
    except Exception as e:
        return {"status": "error", "detail": f"Instagram check failed: {str(e)}", "risk": "unknown"}

@app.get("/proxy/gmail")
async def proxy_gmail(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    return await check_gmail_playwright(email)

@app.get("/proxy/instagram")
async def proxy_instagram(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    return await check_instagram_playwright(email)

@app.get("/proxy/tiktok")
async def proxy_tiktok(email: str = Query(...)):
    if not is_valid_email(email):
        return {"status": "error", "detail": "Invalid email format.", "risk": "unknown"}
    return await check_tiktok_playwright(email)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/scan")
async def scan(email: str):
    if not is_valid_email(email):
        return {"error": "Invalid email"}
    return {"email": email}
