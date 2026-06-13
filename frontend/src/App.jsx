import { useState } from "react";
import Scanner from "./components/Scanner";
import Results from "./components/Results";
import About from "./components/About";
import "./App.css";

const API = "https://email-rec-awareness-production.up.railway.app";

async function checkGmail(email) {
  if (!email.endsWith("@gmail.com")) return { platform: "Gmail", status: "skipped", detail: "Not a Gmail address.", risk: "unknown", icon: "gmail" };
  try {
    const res = await fetch(`https://accounts.google.com/_/signin/sl/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: email }),
      mode: "cors",
    });
    const checkBody = await res.text();
    if (checkBody.includes('"error":1') || checkBody.includes("WRONG_PASSWD") || checkBody.includes("InvalidEmail")) {
      return { platform: "Gmail", status: "available", detail: "This Gmail address does not exist and can be registered. An attacker can create it and trigger password resets on linked platforms.", risk: "critical", icon: "gmail" };
    } else if (checkBody.includes('"error":2') || checkBody.includes("PASSWD_NOT_MATCH")) {
      return { platform: "Gmail", status: "taken", detail: "This Gmail address already exists and is active. The Gmail hijack vector is blocked.", risk: "safe", icon: "gmail" };
    }
    return { platform: "Gmail", status: "uncertain", detail: "Could not verify Gmail status.", risk: "unknown", icon: "gmail" };
  } catch (e) {
    return { platform: "Gmail", status: "uncertain", detail: "Gmail check blocked (CORS).", risk: "unknown", icon: "gmail" };
  }
}

async function checkInstagram(email) {
  try {
    const res = await fetch(`${API}/proxy/instagram?email=${encodeURIComponent(email)}`);
    return { platform: "Instagram", icon: "instagram", ...await res.json() };
  } catch (e) {
    return { platform: "Instagram", status: "error", detail: `Request failed: ${e.message}`, risk: "unknown", icon: "instagram" };
  }
}

async function checkTikTok(email) {
  try {
    const res = await fetch(`${API}/proxy/tiktok?email=${encodeURIComponent(email)}`);
    return { platform: "TikTok", icon: "tiktok", ...await res.json() };
  } catch (e) {
    return { platform: "TikTok", status: "error", detail: `Request failed: ${e.message}`, risk: "unknown", icon: "tiktok" };
  }
}

function buildSummary(results, chainPossible, linkedPlatforms) {
  const gmail = results[0];
  if (chainPossible) return `Attack chain viable. Gmail is unclaimed and ${linkedPlatforms.join(" and ")} account(s) are linked to it. An attacker can register this Gmail and trigger password resets with no 2FA required.`;
  if (gmail.status === "available") return "Gmail is unclaimed but no linked platform accounts found. Claim this email to prevent future exposure.";
  if (gmail.status === "taken") return "Gmail is already registered. The core hijack vector is blocked. Ensure 2FA is enabled on all platforms.";
  return "Scan complete. Review individual results below.";
}

export default function App() {
  const [page, setPage] = useState("home");
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (email) => {
    setScanning(true); setError(null); setScanData(null);
    try {
      const [gmailResult, igResult, ttResult] = await Promise.all([checkGmail(email), checkInstagram(email), checkTikTok(email)]);
      const results = [gmailResult, igResult, ttResult];
      const linked = results.slice(1).filter(r => r.status === "linked").map(r => r.platform);
      const chainPossible = gmailResult.status === "available" && linked.length > 0;
      let riskScore = 0;
      results.forEach(r => { if (r.risk === "critical") riskScore += 40; else if (r.risk === "high") riskScore += 30; });
      setScanData({ email, results, chain_possible: chainPossible, linked_platforms: linked, risk_score: Math.min(riskScore, 100), summary: buildSummary(results, chainPossible, linked) });
    } catch (e) { setError(`Scan failed: ${e.message}`); }
    finally { setScanning(false); }
  };

  const handleReset = () => { setScanData(null); setError(null); };
  const goHome = () => { setPage("home"); handleReset(); };

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo" onClick={goHome}>
            <div className="nav-logo-mark">MR</div>
            MailRecon
          </div>
          <div className="nav-links">
            <button className={`nav-link ${page === "home" ? "active" : ""}`} onClick={goHome}>Scanner</button>
            <button className={`nav-link ${page === "about" ? "active" : ""}`} onClick={() => setPage("about")}>About</button>
          </div>
          <button className="nav-cta" onClick={goHome}>Run Scan</button>
        </div>
      </nav>

      <main className="main">
        {page === "home" && !scanData && <Scanner onScan={handleScan} scanning={scanning} error={error} />}
        {page === "home" && scanData && <Results data={scanData} onReset={handleReset} />}
        {page === "about" && <About />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">© 2025 MailRecon by Faris Asmar · For educational purposes only</div>
          <div className="footer-right">
            <a className="footer-link" href="https://github.com/FarisAsmar/EMAIL-RECON-OSINT" target="_blank" rel="noreferrer">GitHub</a>
            <a className="footer-link" href="https://www.linkedin.com/in/faris-asmar-98223924a/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
