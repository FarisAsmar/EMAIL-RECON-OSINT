export default function About() {
  return (
    <div className="page">
      <div className="about-page">
        <div className="about-hero">
          <div className="about-tag">About this project</div>
          <h1 className="about-title">Mail<span className="hl">Recon</span><br />Awareness</h1>
          <p className="about-subtitle">A security awareness tool built to demonstrate how overlooked email addresses create a direct path to full account takeovers, with no technical skill required from an attacker.</p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <div className="about-card-label">// The origin</div>
            <div className="about-text">
              <p>This project started as a command line tool built and run entirely within Kali Linux. The idea came from something I noticed years ago, the kind of thing you discover when you are curious and paying attention. I realised that reusing or abandoning an email address across platforms creates a surprisingly exploitable chain, and that most people have no idea it exists.</p>
              <p>The core concept is straightforward. If an email address is linked to a social media account but the Gmail itself is unclaimed, anyone can register it and use the password reset flow to take over that account. No exploits. No social engineering. Just a loophole hiding in plain sight.</p>
            </div>
          </div>

          <div className="about-card">
            <div className="about-card-label">// The rebuild</div>
            <div className="about-text">
              <p>What started as a terminal script has been rebuilt from the ground up into a fully deployed web application. With the help of AI, I designed and developed a proper frontend and backend, taking the project from a local Kali tool to something anyone with a browser can use and learn from.</p>
              <p>The rebuild was a deliberate step in learning how to translate a technical security concept into something clear, visual, and genuinely useful. The goal was never to enable harm. It was to make the risk visible so people can do something about it.</p>
            </div>
          </div>

          <div className="about-card">
            <div className="about-card-label">// What it covers</div>
            <div className="about-text">
              <p>The tool sits at the intersection of <strong>OSINT</strong> and practical security awareness. It checks whether a Gmail address is unclaimed, then uses a headless browser to probe whether that email is linked to Instagram or TikTok accounts that do not enforce email verification during signup or password reset. If both conditions are met, the full takeover chain is mapped and explained.</p>
              <p>The broader point is that cybersecurity is not always about sophisticated attacks. Sometimes it is as simple as an overlooked email address, a missing two factor authentication setting, or a password reset link landing in the wrong inbox. Small gaps create real consequences.</p>
            </div>
          </div>

          <div className="about-card">
            <div className="about-card-label">// Built by</div>
            <div className="author-row">
              <div className="author-avatar">F</div>
              <div>
                <div className="author-name">Faris Asmar</div>
                <div className="author-role">Cybersecurity student · Developer</div>
              </div>
            </div>
            <div className="about-text">
              <p>Focused on security awareness, OSINT, and building tools that make complex vulnerabilities understandable to anyone.</p>
            </div>
            <div className="stack-row">
              {["Python","FastAPI","Playwright","React","Vite","Railway","Vercel","ZeroBounce API","OSINT","Kali Linux"].map(t => (
                <span key={t} className="stack-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
