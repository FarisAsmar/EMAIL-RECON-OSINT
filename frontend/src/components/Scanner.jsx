import { useState } from "react";
import "./Scanner.css";

export default function Scanner({ onScan, scanning, error }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) onScan(email.trim());
  };

  return (
    <div className="scanner">
      <div className="scanner-intro">
        <div className="terminal-line">
          <span className="prompt">~/recon</span>
          <span className="cursor-blink"> $</span>
        </div>
        <h1 className="scanner-title">Email Hijack Chain Detector</h1>
        <p className="scanner-desc">
          Enter an email to check if it's unclaimed on Gmail and linked to
          unverified-signup platforms. This demonstrates the account takeover
          risk of missing 2FA — for awareness only.
        </p>
        <div className="how-it-works">
          <div className="step">
            <span className="step-num">01</span>
            <span className="step-text">Check if Gmail address is unregistered (available to claim)</span>
          </div>
          <div className="step-arrow">↓</div>
          <div className="step">
            <span className="step-num">02</span>
            <span className="step-text">Probe Instagram &amp; TikTok — platforms that don't verify email on signup</span>
          </div>
          <div className="step-arrow">↓</div>
          <div className="step">
            <span className="step-num">03</span>
            <span className="step-text">If accounts exist → attacker registers Gmail → triggers password reset → full takeover</span>
          </div>
        </div>
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <span className="input-icon">@</span>
          <input
            type="email"
            className="email-input"
            placeholder="target@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={scanning}
            autoFocus
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={scanning || !email.trim()}>
          {scanning ? (
            <>
              <span className="spinner" />
              Scanning...
            </>
          ) : (
            <>
              <span>▶</span> Run Scan
            </>
          )}
        </button>
      </form>

      {scanning && (
        <div className="scan-log">
          <div className="log-line"><span className="log-ok">[OK]</span> Connecting to Google accounts API...</div>
          <div className="log-line log-delay-1"><span className="log-ok">[OK]</span> Probing Instagram recovery endpoint...</div>
          <div className="log-line log-delay-2"><span className="log-ok">[OK]</span> Querying TikTok prelogin check...</div>
          <div className="log-line log-delay-3"><span className="log-pend">[..]</span> Analysing chain viability...</div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span className="error-icon">✗</span> {error}
        </div>
      )}

      <p className="disclaimer">
        ⚠ Only scan emails you own or have explicit permission to test.
        This tool is for educational purposes only.
      </p>
    </div>
  );
}
