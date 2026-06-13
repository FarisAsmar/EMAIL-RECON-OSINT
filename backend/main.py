from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI(title="Email Recon Awareness API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def is_valid_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/scan")
async def scan(email: str):
    if not is_valid_email(email):
        return {"error": "Invalid email"}
    return {"email": email}
