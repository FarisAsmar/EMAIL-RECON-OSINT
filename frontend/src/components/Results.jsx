import "./Results.css";

const RISK_CONFIG = {
  critical: { label: "CRITICAL", color: "danger", icon: "✗" },
  high:     { label: "HIGH",     color: "warn",   icon: "⚠" },
  low:      { label: "SAFE",     color: "safe",   icon: "✓" },
  safe:     { label: "SAFE",     color: "safe",   icon: "✓" },
  unknown:  { label: "UNKNOWN",  color: "muted",  icon: "?" },
};

const PLATFORM_ICONS = {
  gmail:     "G",
  instagram: "IG",
  tiktok:    "TT",
};

export default function Results({ data, onReset }) {
  const { email, results, chain_possible, risk_score, summary, linked_platforms } = data;

  const scoreColor =
    risk_score >= 70 ? "danger" :
    risk_score >= 40 ? "warn" :
    "safe";

  return (
    <div className="results">
      {/* Top bar */}
      <div className="results-header">
        <div>
          <div className="results-label">Scan complete</div>
          <div className="results-email">{email}</div>
        </div>
        <button className="btn btn-ghost" onClick={onReset}>← New scan</button>
      </div>

      {/* Risk score */}
      <div className={`risk-score-card risk-${scoreColor}`}>
        <div className="risk-score-left">
          <div className="risk-score-num">{risk_score}</div>
          <div className="risk-score-label">/ 100 risk score</div>
        </div>
        <div className="risk-score-right">
          <p className="risk-summary">{summary}</p>
        </div>
      </div>

      {/* Attack chain diagram */}
      <div className="chain-section">
        <div className="section-header">
          <span className="section-title">Attack chain</span>
          {chain_possible
            ? <span className="chain-badge chain-viable">VIABLE</span>
            : <span className="chain-badge chain-blocked">BLOCKED</span>
          }
        </div>

        <div className="chain-diagram">
          <ChainNode
            icon="@"
            label="Attacker"
            sub="starts here"
            color="muted"
          />
          <ChainArrow active={true} />
          <ChainNode
            icon={PLATFORM_ICONS.gmail}
            label="Gmail"
            sub={results[0].status === "available" ? "Unclaimed ✗" : "Taken ✓"}
            color={results[0].status === "available" ? "danger" : "safe"}
          />
          <ChainArrow active={chain_possible} />
          <ChainNode
            icon={PLATFORM_ICONS.instagram}
            label="Instagram"
            sub={results[1].status === "linked" ? "Account found" : results[1].status === "not_found" ? "No account" : "Unknown"}
            color={results[1].status === "linked" ? "warn" : "muted"}
          />
          <ChainArrow active={chain_possible && results[1].status === "linked"} label="reset" />
          <ChainNode
            icon={PLATFORM_ICONS.tiktok}
            label="TikTok"
            sub={results[2].status === "linked" ? "Account found" : results[2].status === "not_found" ? "No account" : "Unknown"}
            color={results[2].status === "linked" ? "warn" : "muted"}
          />
        </div>

        {chain_possible && (
          <div className="chain-explain">
            <span className="chain-explain-icon">⚡</span>
            <span>
              Attacker registers <strong>{email}</strong> on Gmail →
              triggers "Forgot password" on {linked_platforms.join(" and ")} →
              reset link lands in attacker's inbox → full account takeover.
              No 2FA required on any step.
            </span>
          </div>
        )}
      </div>

      {/* Per-platform results */}
      <div className="section-header" style={{marginTop: 32}}>
        <span className="section-title">Platform breakdown</span>
      </div>
      <div className="platform-cards">
        {results.map((r) => {
          const cfg = RISK_CONFIG[r.risk] || RISK_CONFIG.unknown;
          return (
            <div key={r.platform} className={`platform-card platform-${cfg.color}`}>
              <div className="platform-card-header">
                <div className={`platform-icon platform-icon-${r.icon}`}>
                  {PLATFORM_ICONS[r.icon] || r.platform[0]}
                </div>
                <div className="platform-name">{r.platform}</div>
                <span className={`risk-tag risk-tag-${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <div className="platform-status">
                Status: <span className="status-value">{r.status.replace("_", " ")}</span>
              </div>
              <p className="platform-detail">{r.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Mitigation */}
      <div className="mitigation-card">
        <div className="section-title" style={{marginBottom: 16}}>How to stay protected</div>
        <div className="mitigations">
          <div className="mitigation-item">
            <span className="mitigation-num">01</span>
            <div>
              <div className="mitigation-title">Enable 2FA everywhere</div>
              <div className="mitigation-body">Use an authenticator app (not SMS) on every platform. This blocks the reset chain even if an attacker registers your email.</div>
            </div>
          </div>
          <div className="mitigation-item">
            <span className="mitigation-num">02</span>
            <div>
              <div className="mitigation-title">Claim your email variants</div>
              <div className="mitigation-body">Register all email addresses you use on social platforms — even if you don't plan to use them as Gmail inboxes.</div>
            </div>
          </div>
          <div className="mitigation-item">
            <span className="mitigation-num">03</span>
            <div>
              <div className="mitigation-title">Use a password manager</div>
              <div className="mitigation-body">Unique passwords per platform limit the blast radius of any single account being compromised.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChainNode({ icon, label, sub, color }) {
  return (
    <div className={`chain-node chain-node-${color}`}>
      <div className="chain-node-icon">{icon}</div>
      <div className="chain-node-label">{label}</div>
      <div className="chain-node-sub">{sub}</div>
    </div>
  );
}

function ChainArrow({ active, label }) {
  return (
    <div className={`chain-arrow ${active ? "chain-arrow-active" : "chain-arrow-inactive"}`}>
      {label && <span className="chain-arrow-label">{label}</span>}
      <div className="chain-arrow-line">
        <div className="chain-arrow-head">›</div>
      </div>
    </div>
  );
}
