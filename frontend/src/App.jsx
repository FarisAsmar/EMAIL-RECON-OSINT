const RISK = {
  critical: { label: "CRITICAL", cls: "red" },
  high:     { label: "HIGH",     cls: "amber" },
  low:      { label: "SAFE",     cls: "green" },
  safe:     { label: "SAFE",     cls: "green" },
  unknown:  { label: "UNKNOWN",  cls: "muted" },
};
const LOGOS = { gmail: "G", instagram: "IG", tiktok: "TT" };

export default function Results({ data, onReset }) {
  const { email, results, chain_possible, risk_score, summary, linked_platforms } = data;
  const scoreClass = risk_score >= 70 ? "critical" : risk_score >= 30 ? "warn" : "safe";
  const scoreLabel = risk_score >= 70 ? "⚡ HIGH RISK" : risk_score >= 30 ? "⚠ MODERATE RISK" : "✓ LOW RISK";

  const nodeColor = (r) => {
    if (!r) return "muted";
    if (r.risk === "critical") return "red";
    if (r.risk === "high") return "amber";
    if (r.risk === "low" || r.risk === "safe") return "green";
    return "muted";
  };
  const nodeSub = (r) => {
    if (!r) return "";
    if (r.status === "available") return "Unclaimed";
    if (r.status === "taken") return "Registered";
    if (r.status === "linked") return "Found";
    if (r.status === "not_found") return "Not found";
    return "Unknown";
  };

  return (
    <div className="results-page">
      <div className="results-topbar">
        <div>
          <div className="results-email-label">// Scan results for</div>
          <div className="results-email">{email}</div>
        </div>
        <button className="btn-back" onClick={onReset}>← New scan</button>
      </div>

      <div className={`risk-card ${scoreClass}`}>
        <div>
          <div className="risk-score">{risk_score}</div>
          <div className="risk-score-sub">// risk score</div>
        </div>
        <div>
          <div className="risk-label">{scoreLabel}</div>
          <div className="risk-summary">{summary}</div>
        </div>
      </div>

      <div className="chain-card">
        <div className="chain-header">
          <span className="chain-title">Attack chain</span>
          <span className={`chain-badge ${chain_possible ? "viable" : "blocked"}`}>{chain_possible ? "⚡ VIABLE" : "✓ BLOCKED"}</span>
        </div>
        <div className="chain-flow">
          <ChainNode icon="@" name="Attacker" sub="origin" color="muted" />
          <ChainArrow on={true} />
          <ChainNode icon="G" name="Gmail" sub={nodeSub(results[0])} color={nodeColor(results[0])} />
          <ChainArrow on={chain_possible} label="claim" />
          <ChainNode icon="IG" name="Instagram" sub={nodeSub(results[1])} color={nodeColor(results[1])} />
          <ChainArrow on={chain_possible && results[1]?.status === "linked"} label="reset" />
          <ChainNode icon="TT" name="TikTok" sub={nodeSub(results[2])} color={nodeColor(results[2])} />
        </div>
        {chain_possible && (
          <div className="chain-explain">
            <span className="chain-explain-icon">⚡</span>
            <span>Attacker registers <strong>{email}</strong> on Gmail, triggers "Forgot password" on {linked_platforms.join(" and ")}, and the reset link arrives in their inbox. No 2FA required — full account takeover in under 5 minutes.</span>
          </div>
        )}
      </div>

      <div className="platforms-label">// Platform breakdown</div>
      <div className="platforms-grid">
        {results.map((r) => {
          const cfg = RISK[r.risk] || RISK.unknown;
          return (
            <div key={r.platform} className={`platform-card ${cfg.cls}`}>
              <div className="platform-top">
                <div className="platform-logo">{LOGOS[r.icon] || r.platform[0]}</div>
                <div className="platform-name">{r.platform}</div>
                <span className={`risk-pill ${cfg.cls}`}>{cfg.label}</span>
              </div>
              <div className="platform-status">status: <span>{r.status.replace("_", " ")}</span></div>
              <div className="platform-detail">{r.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="mitigation-card">
        <div className="mitigation-title">How to stay protected</div>
        <div className="mitigations">
          <div><div className="mit-num">// 01</div><div className="mit-title">Enable 2FA everywhere</div><div className="mit-body">Use an authenticator app on every platform. This breaks the reset chain even if an attacker registers your email.</div></div>
          <div><div className="mit-num">// 02</div><div className="mit-title">Claim your email variants</div><div className="mit-body">Register all email addresses linked to your social accounts, even ones you don't actively use as inboxes.</div></div>
          <div><div className="mit-num">// 03</div><div className="mit-title">Use a password manager</div><div className="mit-body">Unique passwords per platform limit the blast radius if any single account is compromised.</div></div>
        </div>
      </div>
    </div>
  );
}

function ChainNode({ icon, name, sub, color }) {
  return (
    <div className="chain-node">
      <div className={`chain-icon ${color}`}>{icon}</div>
      <div className="chain-node-name">{name}</div>
      <div className="chain-node-sub">{sub}</div>
    </div>
  );
}

function ChainArrow({ on, label }) {
  return (
    <div className={`chain-arrow ${on ? "on" : "off"}`}>
      {label && <span className="chain-arrow-label">{label}</span>}
      <div className="chain-arrow-row">
        <div className="chain-arrow-line" />
        <span className="chain-arrow-tip">›</span>
      </div>
    </div>
  );
}
