import { useEffect, useState } from "react";

const ROTATING_WORDS = ["liability?", "vulnerability?", "risk?", "weak link?"];

export default function Scanner({ onScan, scanning, error }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setWordIdx(i => (i + 1) % ROTATING_WORDS.length); setVisible(true); }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = e.target.email.value.trim();
    if (val) onScan(val);
  };

  return (
    <>
      <div className="hero">
        <div className="hero-status">
          <span className="hero-status-dot" />
          <span className="hero-status-line" />
          Live Security Scanner · 3 Platforms Checked
        </div>

        <h1 className="hero-title">
          Is your email a
          <span className="line2">
            <span className="hl" style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              display: "inline-block",
              transition: "opacity 0.3s, transform 0.3s"
            }}>
              {ROTATING_WORDS[wordIdx]}
            </span>
          </span>
        </h1>

        <p className="hero-desc">
          Enter a Gmail address to check if it's unclaimed and linked to social media accounts.<br />
          See exactly how account takeovers happen when 2FA is missing.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => document.getElementById('scan-input')?.focus()}>
            ↓ Start scanning
          </button>
          <button className="btn-secondary" onClick={() => document.querySelector('.steps-section')?.scrollIntoView({behavior:'smooth'})}>
            How it works
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat"><div className="stat-num"><span>3</span></div><div className="stat-label">Platforms checked</div></div>
          <div className="stat"><div className="stat-num"><span>Real</span></div><div className="stat-label">Browser automation</div></div>
          <div className="stat"><div className="stat-num"><span>0</span></div><div className="stat-label">Data stored</div></div>
          <div className="stat"><div className="stat-num"><span>100%</span></div><div className="stat-label">Open source</div></div>
        </div>
      </div>

      <div className="scan-section">
        <div className="scan-container">
          <div className="scan-label">Run a scan</div>
          <form className="scan-form" onSubmit={handleSubmit}>
            <div className="input-wrap">
              <span className="input-at">@</span>
              <input id="scan-input" name="email" type="email" className="email-input" placeholder="example@gmail.com" disabled={scanning} autoFocus required />
            </div>
            <button type="submit" className="btn-scan" disabled={scanning}>
              {scanning ? <><span className="spinner" /> Scanning</> : "Run Scan →"}
            </button>
          </form>
          <p className="scan-note">Only scan emails you own or have explicit permission to test · For educational purposes only</p>
          {error && <div className="error-box">{error}</div>}
        </div>
      </div>

      {scanning && (
        <div className="scan-log">
          <div className="log-header">// SCAN OUTPUT</div>
          <div className="log-line"><span className="log-ok">✓</span> Launching headless Chromium browser instance...</div>
          <div className="log-line log-delay-1"><span className="log-ok">✓</span> Probing Gmail signup endpoint...</div>
          <div className="log-line log-delay-2"><span className="log-ok">✓</span> Probing Instagram and TikTok login endpoints...</div>
          <div className="log-line log-delay-3"><span className="log-wait">⟳</span> Analysing attack chain viability...</div>
        </div>
      )}

      <div className="steps-section">
        <div className="section-header">
          <div className="section-tag">How it works</div>
          <div className="section-title">Three step attack chain analysis</div>
        </div>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">// STEP 01</div>
            <div className="step-icon">📧</div>
            <div className="step-title">Gmail availability check</div>
            <div className="step-desc">We verify whether the Gmail address is currently registered or still available to claim using Chromium browser automation to interact with Google's signup flow.</div>
          </div>
          <div className="step-card">
            <div className="step-num">// STEP 02</div>
            <div className="step-icon">🔍</div>
            <div className="step-title">Platform account lookup</div>
            <div className="step-desc">A headless Chromium browser checks Instagram and TikTok to determine if accounts are linked to that email, using the same flows a real user would.</div>
          </div>
          <div className="step-card">
            <div className="step-num">// STEP 03</div>
            <div className="step-icon">⛓</div>
            <div className="step-title">Attack chain mapping</div>
            <div className="step-desc">If Gmail is unclaimed and accounts exist, we map the full takeover chain and show exactly how an attacker would exploit the vulnerability.</div>
          </div>
        </div>
      </div>
    </>
  );
}
