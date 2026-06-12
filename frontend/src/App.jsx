import { useState } from "react";
import Scanner from "./components/Scanner";
import Results from "./components/Results";
import "./App.css";

const ZEROBOUNCE_API_KEY = "6b3405af87a24d129af24abe6d970628";

async function checkGmail(email) {
  if (!email.endsWith("@gmail.com")) {
    return { platform: "Gmail", status: "skipped", detail: "Not a Gmail address — availability check skipped.", risk: "unknown", icon: "gmail" };
  }
  try {
    const res = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}&ip_address=`);
    const data = await res.json();
    const status = (data.status || "").toLowerCase();
    if (status === "valid") {
      return { platform: "Gmail", status: "taken", detail: "This Gmail address already exists and is active. The Gmail hijack vector is blocked.", risk: "safe", icon: "gmail" };
    } else if (status === "invalid") {
      return { platform: "Gmail", status: "available", detail: "This Gmail address does NOT exist — it is unclaimed. An attacker can register it and trigger password resets on linked platforms.", risk: "critical", icon: "gmail" };
    } else {
      return { platform: "Gmail", status: "uncertain", detail: `Could not definitively verify Gmail (status: ${status || "empty"}).`, risk: "unknown", icon: "gmail" };
    }
  } catch (e) {
    return { platform: "Gmail", status: "error", detail: `Verification error: ${e.message}`, risk: "unknown", icon: "gmail" };
  }
}

async function checkInstagram(email) {
  try {
    const res = await fetch("https://www.instagram.com/accounts/account_recovery_send_ajax/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": "missing",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.instagram.com/accounts/password/reset/",
      },
      body: `email_or_username=${encodeURIComponent(email)}&recaptcha_challenge_field=`,
      mode: "cors",
    });
    const body = await res.text();
    const lower = body.toLowerCase();
    if (res.status === 200 && (lower.includes("email_sent") || lower.includes('"ok"') || lower.includes("true"))) {
      return { platform: "Instagram", status: "linked", detail: "An Instagram account is linked to this email. Password reset can be triggered without verifying email ownership.", risk: "high", icon: "instagram" };
    } else if (res.status === 400 || res.status === 404) {
      return { platform: "Instagram", status: "not_found", detail: "No Instagram account found linked to this email.", risk: "low", icon: "instagram" };
    } else {
      return { platform: "Instagram", status: "uncertain", detail: `Ambiguous response from Instagram (HTTP ${res.status}). May be rate-limited or blocked.`, risk: "unknown", icon: "instagram" };
    }
  } catch (e) {
    // CORS block usually means Instagram responded — treat as uncertain
    return { platform: "Instagram", status: "uncertain", detail: "Instagram blocked the request (CORS). Try checking manually at instagram.com/accounts/password/reset.", risk: "unknown", icon: "instagram" };
  }
}

async function checkTikTok(email) {
  try {
    const res = await fetch(`https://www.tiktok.com/passport/web/user/prelogin/?account=${encodeURIComponent(email)}&service=tiktok`, {
      headers: { "Referer": "https://www.tiktok.com/" },
      mode: "cors",
    });
    const data = await res.json();
    const statusCode = data?.data?.status;
    if (statusCode === 1) {
      return { platform: "TikTok", status: "linked", detail: "A TikTok account is linked to this email. Reset flow can be triggered without verifying email ownership.", risk: "high", icon: "tiktok" };
    } else if (statusCode === 0) {
      return { platform: "TikTok", status: "not_found", detail: "No TikTok account found linked to this email.", risk: "low", icon: "tiktok" };
    } else {
      return { platform: "TikTok", status: "uncertain", detail: "TikTok returned an unexpected response. May be rate-limited.", risk: "unknown", icon: "tiktok" };
    }
  } catch (e) {
    return { platform: "TikTok", status: "uncertain", detail: "TikTok blocked the request (CORS). Try checking manually at tiktok.com/login.", risk: "unknown", icon: "tiktok" };
  }
}

function buildSummary(results, chainPossible, linkedPlatforms) {
  const gmail = results[0];
  if (chainPossible) {
    const names = linkedPlatforms.join(" and ");
    return `⚠️ Attack chain viable. Gmail is unclaimed and ${names} account(s) are linked to it. An attacker can register this Gmail and trigger password resets — no 2FA needed.`;
  } else if (gmail.status === "available") {
    return "Gmail is unclaimed but no linked platform accounts were found. Still a risk — claim this email to prevent future exposure.";
  } else if (gmail.status === "taken") {
    return "Gmail address is already registered. The core hijack vector is blocked. Ensure 2FA is enabled on all platforms.";
  }
  return "Scan complete. Review individual results below.";
}

export default function App() {
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (email) => {
    setScanning(true);
    setError(null);
    setScanData(null);
    try {
      // All checks run from the browser — no server IP blocking
      const [gmailResult, igResult, ttResult] = await Promise.all([
        checkGmail(email),
        checkInstagram(email),
        checkTikTok(email),
      ]);

      const results = [gmailResult, igResult, ttResult];
      const linkedPlatforms = results.slice(1).filter(r => r.status === "linked").map(r => r.platform);
      const chainPossible = gmailResult.status === "available" && linkedPlatforms.length > 0;

      let riskScore = 0;
      results.forEach(r => {
        if (r.risk === "critical") riskScore += 40;
        else if (r.risk === "high") riskScore += 30;
      });
      riskScore = Math.min(riskScore, 100);

      setScanData({
        email,
        results,
        chain_possible: chainPossible,
        linked_platforms: linkedPlatforms,
        risk_score: riskScore,
        summary: buildSummary(results, chainPossible, linkedPlatforms),
      });
    } catch (e) {
      setError(`Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => { setScanData(null); setError(null); };

  return (
    <div className="app">
      <div className="noise" />
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">MAIL</span>
            <span className="logo-accent">RECON</span>
            <span className="logo-bracket">]</span>
          </div>
          <p className="tagline">Email hijack chain demonstrator — for security awareness only</p>
        </div>
      </header>
      <main className="main">
        {!scanData && <Scanner onScan={handleScan} scanning={scanning} error={error} />}
        {scanData && <Results data={scanData} onReset={handleReset} />}
      </main>
      <footer className="footer">
        <p>Built for educational purposes · Never use against accounts you don't own</p>
        <a href="https://github.com/FarisAsmar/email-recon-awareness" target="_blank" rel="noreferrer">GitHub ↗</a>
      </footer>
    </div>
  );
}
