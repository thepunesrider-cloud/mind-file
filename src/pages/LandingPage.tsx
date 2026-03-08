import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LANDING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

.landing-root *, .landing-root *::before, .landing-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

.landing-root {
  --bg: #F4F8FC;
  --navy: #0B2044;
  --teal: #0E879B;
  --bright-teal: #13C5C5;
  --text-primary: #0B2044;
  --text-secondary: #4A6080;
  --border: rgba(14,135,155,0.15);
  --gradient: linear-gradient(135deg, #0B2044 0%, #0E879B 50%, #13C5C5 100%);
  --ice-highlight: rgba(19,197,197,0.08);
  --card-bg: #FFFFFF;
  --surface: #FFFFFF;
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text-primary);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.landing-root[data-theme="dark"] {
  --bg: #0B1221; --navy: #E4EDF8; --teal: #2DD4E8; --bright-teal: #13C5C5;
  --text-primary: #E4EDF8; --text-secondary: #7A9AB8;
  --border: rgba(19,197,197,0.18);
  --gradient: linear-gradient(135deg, #1A3A6E 0%, #0E879B 50%, #13C5C5 100%);
  --ice-highlight: rgba(19,197,197,0.1);
  --card-bg: #0E1A2E; --surface: #0E1A2E;
  background: #0B1221; color: #E4EDF8;
}

/* NAV */
.landing-root nav { position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; transition: background 0.35s, backdrop-filter 0.35s, border-bottom 0.35s; }
.landing-root nav.scrolled { background: rgba(244,248,252,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(14,135,155,0.12); }
.landing-root[data-theme="dark"] nav.scrolled { background: rgba(10,14,26,0.94); border-bottom-color: rgba(19,197,197,0.12); }
.landing-root .nav-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 20px; color: var(--navy); text-decoration: none; }
.landing-root .nav-logo-dot { width: 6px; height: 6px; background: var(--bright-teal); border-radius: 1px; flex-shrink: 0; }
.landing-root .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
.landing-root .nav-links a { font-weight: 500; font-size: 14px; color: var(--text-secondary); text-decoration: none; transition: color 0.2s; }
.landing-root .nav-links a:hover, .landing-root .nav-links a.active { color: var(--teal); }
.landing-root .nav-cta { border: 1.5px solid var(--teal); color: var(--teal); background: transparent; border-radius: 6px; padding: 8px 20px; font-weight: 500; font-size: 14px; cursor: pointer; transition: background 0.25s, color 0.25s; text-decoration: none; }
.landing-root .nav-cta:hover { background: var(--teal); color: white; }
.landing-root .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
.landing-root .hamburger span { display: block; width: 22px; height: 2px; background: var(--navy); border-radius: 2px; transition: 0.3s; }
.landing-root[data-theme="dark"] .hamburger span { background: #E4EDF8; }
.landing-root .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.landing-root .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.landing-root .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.landing-root .mobile-menu { display: none; position: fixed; top: 64px; left: 0; right: 0; background: rgba(244,248,252,0.97); backdrop-filter: blur(20px); padding: 24px 48px; z-index: 999; border-bottom: 1px solid var(--border); flex-direction: column; gap: 20px; }
.landing-root .mobile-menu.open { display: flex; }
.landing-root[data-theme="dark"] .mobile-menu { background: rgba(10,14,26,0.97); border-bottom-color: rgba(19,197,197,0.12); }
.landing-root .mobile-menu a { font-weight: 500; font-size: 16px; color: var(--text-secondary); text-decoration: none; transition: color 0.2s; }
.landing-root .mobile-menu a:hover { color: var(--teal); }

/* THEME TOGGLE */
.landing-root .theme-toggle { position: relative; width: 52px; height: 28px; flex-shrink: 0; cursor: pointer; background: none; border: none; padding: 0; }
.landing-root .toggle-track { position: absolute; inset: 0; border-radius: 100px; background: rgba(14,135,155,0.15); border: 1.5px solid rgba(14,135,155,0.25); transition: background 0.3s, border-color 0.3s; overflow: hidden; }
.landing-root[data-theme="dark"] .toggle-track { background: rgba(19,197,197,0.2); border-color: rgba(19,197,197,0.4); }
.landing-root .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--teal); transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), background 0.3s; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.landing-root[data-theme="dark"] .toggle-thumb { transform: translateX(24px); background: var(--bright-teal); }
.landing-root .toggle-icon-sun, .landing-root .toggle-icon-moon { position: absolute; top: 50%; transition: opacity 0.25s, transform 0.25s; font-size: 11px; line-height: 1; }
.landing-root .toggle-icon-sun { left: 6px; transform: translateY(-50%); opacity: 1; }
.landing-root .toggle-icon-moon { right: 6px; transform: translateY(-50%); opacity: 0; }
.landing-root[data-theme="dark"] .toggle-icon-sun { opacity: 0; }
.landing-root[data-theme="dark"] .toggle-icon-moon { opacity: 1; }

/* SECTION COMMONS */
.landing-root section { position: relative; }
.landing-root .container { max-width: 1160px; margin: 0 auto; padding: 0 48px; }
.landing-root .section-label { font-weight: 600; font-size: 11px; letter-spacing: 3px; color: var(--teal); text-transform: uppercase; margin-bottom: 20px; }
.landing-root .gradient-text { background: linear-gradient(90deg, var(--teal) 0%, var(--bright-teal) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.landing-root .diagonal-divider { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.landing-root .diagonal-divider::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(135deg, rgba(14,135,155,0.06) 0px, rgba(14,135,155,0.06) 1px, transparent 1px, transparent 60px); }

/* REVEAL */
.landing-root .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
.landing-root .reveal.visible { opacity: 1; transform: translateY(0); }
.landing-root .reveal-scale { opacity: 0; transform: scale(0.96) translateY(20px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
.landing-root .reveal-scale.visible { opacity: 1; transform: scale(1) translateY(0); }

/* HERO */
.landing-root #hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; overflow: hidden; padding-top: 64px; }
.landing-root[data-theme="dark"] #hero { background: #0B1221; }
.landing-root .hero-inner { max-width: 900px; margin: 0 auto; position: relative; z-index: 1; padding: 0 24px; }
.landing-root .hero-badge { display: inline-flex; align-items: center; border: 1px solid rgba(19,197,197,0.3); background: rgba(19,197,197,0.06); border-radius: 100px; padding: 6px 16px; font-weight: 600; font-size: 11px; letter-spacing: 2px; color: var(--teal); text-transform: uppercase; margin-bottom: 32px; opacity: 0; animation: heroFadeUp 0.7s ease-out forwards; }
.landing-root .hero-h1 { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 80px; color: var(--navy); line-height: 1.05; margin-bottom: 28px; opacity: 0; animation: heroFadeUp 0.7s ease-out 0.15s forwards; }
.landing-root[data-theme="dark"] .hero-h1 { color: #E4EDF8; }
.landing-root .hero-sub { font-weight: 400; font-size: 19px; color: var(--text-secondary); max-width: 580px; margin: 0 auto 40px; line-height: 1.8; opacity: 0; animation: heroFadeUp 0.7s ease-out 0.3s forwards; }
.landing-root .hero-ctas { display: flex; align-items: center; justify-content: center; gap: 32px; margin-bottom: 64px; opacity: 0; animation: heroFadeUp 0.7s ease-out 0.45s forwards; }
.landing-root .btn-primary { background: var(--navy); color: white; border-radius: 8px; padding: 14px 32px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.25s, transform 0.25s, box-shadow 0.25s; }
.landing-root .btn-primary:hover { background: var(--teal); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(14,135,155,0.3); }
.landing-root .btn-secondary { background: none; border: none; color: var(--teal); font-weight: 500; font-size: 15px; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.25s; position: relative; }
.landing-root .btn-secondary::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 1px; background: var(--teal); transform: scaleX(0); transition: transform 0.25s; transform-origin: left; }
.landing-root .btn-secondary:hover::after { transform: scaleX(1); }
.landing-root .hero-stats { display: inline-flex; align-items: center; gap: 40px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 100px; padding: 16px 40px; opacity: 0; animation: heroFadeUp 0.7s ease-out 0.6s forwards; }
.landing-root[data-theme="dark"] .hero-stats { background: rgba(14,26,46,0.8); border-color: rgba(19,197,197,0.18); }
.landing-root .hero-stat { text-align: center; }
.landing-root .hero-stat strong { display: block; font-weight: 700; font-size: 20px; color: var(--navy); }
.landing-root[data-theme="dark"] .hero-stat strong { color: #E4EDF8; }
.landing-root .hero-stat span { font-size: 12px; color: var(--text-secondary); }
.landing-root .hero-stat-divider { width: 1px; height: 32px; background: var(--border); }
.landing-root .hero-blob { position: absolute; border-radius: 50%; z-index: 0; pointer-events: none; }
.landing-root .hero-blob-1 { width: 600px; height: 600px; top: -100px; right: -150px; background: rgba(19,197,197,0.06); filter: blur(80px); }
.landing-root[data-theme="dark"] .hero-blob-1 { background: rgba(19,197,197,0.04); }
.landing-root .hero-blob-2 { width: 500px; height: 500px; bottom: -100px; left: -150px; background: rgba(11,32,68,0.04); filter: blur(80px); }
.landing-root[data-theme="dark"] .hero-blob-2 { background: rgba(19,197,197,0.03); }
@keyframes heroFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* PROBLEM */
.landing-root #problem { background: white; padding: 120px 0; }
.landing-root[data-theme="dark"] #problem { background: #0E1A2E; }
.landing-root .problem-statement { max-width: 800px; margin: 0 auto 72px; text-align: center; font-weight: 700; font-size: 52px; color: var(--navy); line-height: 1.15; }
.landing-root[data-theme="dark"] .problem-statement { color: #E4EDF8; }
.landing-root .problem-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
.landing-root .problem-card { background: white; border-radius: 16px; padding: 40px 32px; border: 1px solid rgba(14,135,155,0.1); box-shadow: 0 4px 24px rgba(11,32,68,0.05); }
.landing-root[data-theme="dark"] .problem-card { background: #0B1221; border-color: rgba(19,197,197,0.12); box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
.landing-root .problem-stat { font-weight: 700; font-size: 60px; background: linear-gradient(90deg, var(--teal) 0%, var(--bright-teal) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 12px; display: block; }
.landing-root .problem-card h3 { font-weight: 600; font-size: 18px; color: var(--navy); margin-bottom: 10px; }
.landing-root[data-theme="dark"] .problem-card h3 { color: #E4EDF8; }
.landing-root .problem-card p { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }

/* SOLUTION */
.landing-root #solution { background: var(--bg); padding: 120px 0; }
.landing-root[data-theme="dark"] #solution { background: #0B1221; }
.landing-root .solution-grid { display: grid; grid-template-columns: 55% 45%; gap: 80px; align-items: center; }
.landing-root .solution-title { font-weight: 700; font-size: 46px; color: var(--navy); line-height: 1.15; margin-bottom: 24px; }
.landing-root[data-theme="dark"] .solution-title { color: #E4EDF8; }
.landing-root .solution-body { font-size: 16px; color: var(--text-secondary); line-height: 1.75; margin-bottom: 32px; }
.landing-root .feature-pills { display: flex; flex-wrap: wrap; gap: 10px; }
.landing-root .feature-pill { background: rgba(19,197,197,0.08); border: 1px solid rgba(19,197,197,0.2); border-radius: 100px; padding: 8px 18px; font-weight: 500; font-size: 13px; color: var(--teal); }
.landing-root .terminal-card { background: var(--navy); border-radius: 16px; padding: 32px; position: relative; overflow: hidden; }
.landing-root .terminal-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 36px; background: #0D1B36; border-radius: 16px 16px 0 0; }
.landing-root .terminal-dots { position: absolute; top: 11px; left: 16px; display: flex; gap: 6px; z-index: 1; }
.landing-root .terminal-dot { width: 12px; height: 12px; border-radius: 50%; }
.landing-root .terminal-dot.red { background: #FF5F57; }
.landing-root .terminal-dot.yellow { background: #FEBC2E; }
.landing-root .terminal-dot.green { background: #28C840; }
.landing-root .terminal-lines { margin-top: 36px; }
.landing-root .terminal-line { font-family: 'SF Mono','Fira Code','Courier New',monospace; font-size: 13px; line-height: 1.8; opacity: 0; white-space: nowrap; overflow: hidden; }
.landing-root .terminal-line.grey { color: #6B8099; }
.landing-root .terminal-line.teal { color: var(--bright-teal); }
.landing-root .terminal-line.gold { color: #F5A623; }
.landing-root .terminal-line.white { color: #E8EFF8; }
.landing-root .terminal-line.bright { color: #13C5C5; font-weight: 600; }
.landing-root .terminal-line.visible { opacity: 1; }
.landing-root .cursor { display: inline-block; width: 8px; height: 14px; background: var(--bright-teal); margin-left: 2px; vertical-align: middle; animation: blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.landing-root .tl-1 { animation: termLine 0.3s ease forwards 0.2s; }
.landing-root .tl-2 { animation: termLine 0.3s ease forwards 0.5s; }
.landing-root .tl-3 { animation: termLine 0.3s ease forwards 0.8s; }
.landing-root .tl-4 { animation: termLine 0.3s ease forwards 1.1s; }
.landing-root .tl-5 { animation: termLine 0.3s ease forwards 1.4s; }
.landing-root .tl-6 { animation: termLine 0.3s ease forwards 1.7s; }
.landing-root .tl-7 { animation: termLine 0.3s ease forwards 2.0s; }
.landing-root .tl-8 { animation: termLine 0.3s ease forwards 2.3s; }
@keyframes termLine { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
.landing-root .terminal-card:not(.in-view) .terminal-line { animation-play-state: paused; }
.landing-root .terminal-card.in-view .terminal-line { animation-play-state: running; }

/* FEATURES */
.landing-root #features { background: white; padding: 120px 0; }
.landing-root[data-theme="dark"] #features { background: #0E1A2E; }
.landing-root .features-header { text-align: center; margin-bottom: 64px; }
.landing-root .section-title { font-weight: 700; font-size: 52px; color: var(--navy); line-height: 1.15; }
.landing-root .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
.landing-root .feature-card { background: var(--bg); border-radius: 20px; padding: 36px 32px; border: 1px solid rgba(14,135,155,0.08); transition: background 0.3s, box-shadow 0.3s, transform 0.3s; }
.landing-root .feature-card:hover { background: white; box-shadow: 0 12px 40px rgba(11,32,68,0.08); transform: translateY(-4px); }
.landing-root[data-theme="dark"] .feature-card { background: #0B1221; border-color: rgba(19,197,197,0.1); }
.landing-root[data-theme="dark"] .feature-card:hover { background: #13213A; box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
.landing-root .feature-icon { width: 48px; height: 48px; background: var(--navy); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
.landing-root[data-theme="dark"] .feature-icon { background: #1A3A6E; }
.landing-root .feature-card h3 { font-weight: 600; font-size: 22px; color: var(--navy); margin-bottom: 12px; }
.landing-root[data-theme="dark"] .feature-card h3 { color: #E4EDF8; }
.landing-root .feature-card p { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }

/* HOW IT WORKS */
.landing-root #how { background: var(--bg); padding: 120px 0; }
.landing-root[data-theme="dark"] #how { background: #0B1221; }
.landing-root .how-header { text-align: center; margin-bottom: 72px; }
.landing-root .steps-wrapper { position: relative; display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; margin-bottom: 48px; }
.landing-root .steps-line { position: absolute; top: 30px; left: calc(16.66% + 24px); right: calc(16.66% + 24px); border-top: 2px dashed rgba(14,135,155,0.2); z-index: 0; }
.landing-root .step { text-align: center; position: relative; z-index: 1; }
.landing-root .step-num { width: 60px; height: 60px; margin: 0 auto 24px; background: var(--gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; color: white; }
.landing-root .step h3 { font-weight: 600; font-size: 20px; color: var(--navy); margin-bottom: 10px; }
.landing-root[data-theme="dark"] .step h3 { color: #E4EDF8; }
.landing-root .step p { font-size: 14px; color: var(--text-secondary); line-height: 1.75; }

/* SEARCH METHODS */
.landing-root #search { background: white; padding: 100px 0; }
.landing-root[data-theme="dark"] #search { background: #0E1A2E; }
.landing-root .search-header { text-align: center; margin-bottom: 12px; }
.landing-root .search-subtitle { font-size: 18px; color: var(--text-secondary); text-align: center; margin-bottom: 56px; }
.landing-root .methods-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.landing-root .method-card { border-left: 3px solid var(--bright-teal); background: var(--bg); border-radius: 0 12px 12px 0; padding: 20px 24px; display: flex; flex-direction: column; gap: 4px; transition: background 0.25s, box-shadow 0.25s; }
.landing-root .method-card:hover { background: white; box-shadow: 0 4px 16px rgba(11,32,68,0.06); }
.landing-root[data-theme="dark"] .method-card { background: #0B1221; }
.landing-root[data-theme="dark"] .method-card:hover { background: #13213A; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.landing-root .method-name { font-weight: 600; font-size: 14px; color: var(--navy); display: flex; align-items: center; gap: 8px; }
.landing-root[data-theme="dark"] .method-name { color: #E4EDF8; }
.landing-root .method-desc { font-size: 13px; color: var(--text-secondary); }
.landing-root .method-badge { font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 100px; letter-spacing: 0.5px; }
.landing-root .method-badge.teal { background: rgba(19,197,197,0.15); color: var(--teal); }
.landing-root .method-badge.navy { background: var(--navy); color: white; }
.landing-root[data-theme="dark"] .method-badge.navy { background: #1A3A6E; }

/* USE CASES */
.landing-root #usecases { background: var(--navy); padding: 120px 0; }
.landing-root #usecases .section-label { color: rgba(19,197,197,0.7); }
.landing-root #usecases .section-title { color: white; text-align: center; margin-bottom: 56px; }
.landing-root .personas-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 20px; }
.landing-root .persona-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px 28px; transition: background 0.25s, border-color 0.25s; }
.landing-root .persona-card:hover { background: rgba(19,197,197,0.1); border-color: rgba(19,197,197,0.3); }
.landing-root .persona-icon { font-size: 40px; margin-bottom: 16px; display: block; }
.landing-root .persona-name { font-weight: 600; font-size: 18px; color: white; margin-bottom: 10px; line-height: 1.3; }
.landing-root .persona-desc { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 20px; }
.landing-root .persona-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.landing-root .persona-tag { background: rgba(19,197,197,0.15); color: var(--bright-teal); border-radius: 100px; padding: 4px 12px; font-size: 11px; font-weight: 500; }

/* SECURITY */
.landing-root #security { background: var(--bg); padding: 120px 0; }
.landing-root[data-theme="dark"] #security { background: #0B1221; }
.landing-root .security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
.landing-root .security-title { font-weight: 700; font-size: 46px; color: var(--navy); margin-bottom: 20px; line-height: 1.15; }
.landing-root[data-theme="dark"] .security-title { color: #E4EDF8; }
.landing-root .security-body { font-size: 16px; color: var(--text-secondary); line-height: 1.75; margin-bottom: 36px; }
.landing-root .security-feature { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
.landing-root .sec-check { width: 22px; height: 22px; background: rgba(19,197,197,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.landing-root .sec-check::after { content: '✓'; font-size: 11px; color: var(--teal); font-weight: 700; }
.landing-root .security-feature-text h4 { font-weight: 600; font-size: 15px; color: var(--navy); margin-bottom: 2px; }
.landing-root[data-theme="dark"] .security-feature-text h4 { color: #E4EDF8; }
.landing-root .security-feature-text p { font-size: 14px; color: var(--text-secondary); }
.landing-root .badge-cards { display: flex; flex-direction: column; gap: 16px; }
.landing-root .badge-card { background: white; border-radius: 12px; border: 1px solid rgba(14,135,155,0.12); padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
.landing-root[data-theme="dark"] .badge-card { background: #0E1A2E; border-color: rgba(19,197,197,0.12); }
.landing-root .badge-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.landing-root[data-theme="dark"] .badge-icon { background: #0B1221; }
.landing-root .badge-card h4 { font-weight: 600; font-size: 16px; color: var(--navy); margin-bottom: 2px; }
.landing-root[data-theme="dark"] .badge-card h4 { color: #E4EDF8; }
.landing-root .badge-card p { font-size: 13px; color: var(--text-secondary); }

/* ROADMAP */
.landing-root #roadmap { background: white; padding: 120px 0; }
.landing-root[data-theme="dark"] #roadmap { background: #0E1A2E; }
.landing-root .roadmap-header { text-align: center; margin-bottom: 80px; }
.landing-root .timeline { position: relative; max-width: 900px; margin: 0 auto; }
.landing-root .timeline-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: rgba(14,135,155,0.2); transform: translateX(-50%); }
.landing-root .milestone { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-bottom: 60px; position: relative; }
.landing-root .milestone-content { background: white; border-radius: 16px; padding: 32px; border: 1px solid rgba(14,135,155,0.12); box-shadow: 0 2px 16px rgba(11,32,68,0.04); }
.landing-root[data-theme="dark"] .milestone-content { background: #0B1221; border-color: rgba(19,197,197,0.12); box-shadow: 0 2px 16px rgba(0,0,0,0.3); }
.landing-root .milestone.right .milestone-content { grid-column: 2; }
.landing-root .milestone-node { position: absolute; left: 50%; top: 32px; width: 16px; height: 16px; border-radius: 50%; background: white; border: 2px solid var(--teal); transform: translateX(-50%); z-index: 1; }
.landing-root[data-theme="dark"] .milestone-node { background: #0B1221; }
.landing-root .milestone-quarter { font-weight: 600; font-size: 11px; letter-spacing: 2px; color: var(--teal); text-transform: uppercase; margin-bottom: 8px; }
.landing-root .milestone-title { font-weight: 700; font-size: 22px; color: var(--navy); margin-bottom: 8px; }
.landing-root[data-theme="dark"] .milestone-title { color: #E4EDF8; }
.landing-root .milestone-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 16px; }
.landing-root .status-badge { display: inline-flex; align-items: center; border-radius: 6px; padding: 4px 12px; font-weight: 600; font-size: 11px; letter-spacing: 1px; }
.landing-root .status-badge.dev { background: rgba(245,166,35,0.15); color: #F5A623; }
.landing-root .status-badge.planned { background: rgba(14,135,155,0.1); color: var(--teal); }
.landing-root .status-badge.future { background: rgba(11,32,68,0.08); color: var(--navy); }
.landing-root[data-theme="dark"] .status-badge.future { background: rgba(26,58,110,0.4); color: #7A9AB8; }

/* TESTIMONIALS */
.landing-root #testimonials { background: white; padding: 120px 0; }
.landing-root[data-theme="dark"] #testimonials { background: #0E1A2E; }
.landing-root .testimonials-header { text-align: center; margin-bottom: 64px; }
.landing-root .testimonials-track-wrap { overflow: hidden; mask-image: linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%); }
.landing-root .testimonials-track { display: flex; gap: 24px; animation: scrollTrack 35s linear infinite; width: max-content; }
.landing-root .testimonials-track:hover { animation-play-state: paused; }
@keyframes scrollTrack { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.landing-root .testimonial-card { background: var(--bg); border-radius: 20px; padding: 32px 28px; border: 1px solid var(--border); width: 340px; flex-shrink: 0; transition: box-shadow 0.25s, transform 0.25s; }
.landing-root[data-theme="dark"] .testimonial-card { background: #0B1221; }
.landing-root .testimonial-card:hover { box-shadow: 0 12px 40px rgba(11,32,68,0.1); transform: translateY(-4px); }
.landing-root .testimonial-stars { color: #F5A623; font-size: 14px; letter-spacing: 2px; margin-bottom: 14px; }
.landing-root .testimonial-quote { font-size: 15px; color: var(--text-secondary); line-height: 1.75; margin-bottom: 20px; font-style: italic; }
.landing-root .testimonial-author { display: flex; align-items: center; gap: 12px; }
.landing-root .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: white; }
.landing-root .testimonial-name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.landing-root .testimonial-role { font-size: 12px; color: var(--text-secondary); }

/* PRICING */
.landing-root #pricing { background: var(--bg); padding: 120px 0; }
.landing-root[data-theme="dark"] #pricing { background: #0B1221; }
.landing-root .pricing-header { text-align: center; margin-bottom: 16px; }
.landing-root .pricing-sub { font-size: 18px; color: var(--text-secondary); text-align: center; margin-bottom: 56px; }
.landing-root .pricing-toggle { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 48px; }
.landing-root .pricing-toggle span { font-weight: 500; font-size: 14px; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
.landing-root .pricing-toggle span.active { color: var(--teal); font-weight: 600; }
.landing-root .billing-toggle { width: 44px; height: 24px; background: var(--teal); border-radius: 100px; position: relative; cursor: pointer; border: none; transition: background 0.25s; }
.landing-root .billing-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.25s cubic-bezier(.34,1.56,.64,1); }
.landing-root .billing-toggle.yearly::after { transform: translateX(20px); }
.landing-root .pricing-badge-save { display: inline-flex; align-items: center; background: rgba(19,197,197,0.12); border: 1px solid rgba(19,197,197,0.25); border-radius: 100px; padding: 3px 10px; font-weight: 600; font-size: 11px; color: var(--teal); }
.landing-root .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; align-items: start; }
.landing-root .pricing-card { background: white; border-radius: 24px; padding: 36px 32px; border: 1px solid var(--border); transition: box-shadow 0.3s, transform 0.3s; position: relative; overflow: hidden; }
.landing-root[data-theme="dark"] .pricing-card { background: #0E1A2E; border-color: rgba(19,197,197,0.12); }
.landing-root .pricing-card:hover { box-shadow: 0 16px 48px rgba(11,32,68,0.1); transform: translateY(-4px); }
.landing-root .pricing-card.featured { background: var(--navy); border-color: transparent; box-shadow: 0 20px 60px rgba(11,32,68,0.25); }
.landing-root[data-theme="dark"] .pricing-card.featured { background: #0D2A4F; }
.landing-root .pricing-card.featured::before { content: 'MOST POPULAR'; position: absolute; top: 20px; right: -28px; background: var(--bright-teal); color: var(--navy); font-weight: 700; font-size: 9px; letter-spacing: 1.5px; padding: 5px 36px; transform: rotate(45deg) translateY(-10px); }
.landing-root .plan-name { font-weight: 600; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: var(--teal); margin-bottom: 8px; }
.landing-root .pricing-card.featured .plan-name { color: var(--bright-teal); }
.landing-root .plan-price { font-weight: 700; font-size: 52px; color: var(--text-primary); line-height: 1; margin-bottom: 4px; display: flex; align-items: flex-start; gap: 4px; }
.landing-root .pricing-card.featured .plan-price { color: white; }
.landing-root .plan-price sup { font-size: 22px; margin-top: 10px; font-weight: 500; }
.landing-root .plan-period { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }
.landing-root .pricing-card.featured .plan-period { color: rgba(255,255,255,0.55); }
.landing-root .plan-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.6; }
.landing-root .pricing-card.featured .plan-desc { color: rgba(255,255,255,0.65); }
.landing-root .plan-divider { height: 1px; background: var(--border); margin-bottom: 24px; }
.landing-root .pricing-card.featured .plan-divider { background: rgba(255,255,255,0.1); }
.landing-root .plan-features { list-style: none; margin-bottom: 32px; }
.landing-root .plan-features li { font-size: 14px; color: var(--text-secondary); padding: 7px 0; display: flex; align-items: center; gap: 10px; }
.landing-root .pricing-card.featured .plan-features li { color: rgba(255,255,255,0.75); }
.landing-root .plan-features li::before { content: '✓'; color: var(--teal); font-weight: 700; font-size: 13px; flex-shrink: 0; }
.landing-root .pricing-card.featured .plan-features li::before { color: var(--bright-teal); }
.landing-root .plan-features li.na { opacity: 0.4; }
.landing-root .plan-features li.na::before { content: '—'; color: var(--text-secondary); }
.landing-root .btn-plan { width: 100%; padding: 13px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.25s, transform 0.2s, box-shadow 0.25s; border: none; display: block; text-align: center; text-decoration: none; }
.landing-root .btn-plan.outline { background: transparent; border: 1.5px solid var(--border); color: var(--text-primary); }
.landing-root .btn-plan.outline:hover { border-color: var(--teal); color: var(--teal); }
.landing-root[data-theme="dark"] .btn-plan.outline { color: #E4EDF8; }
.landing-root .btn-plan.filled { background: var(--bright-teal); color: var(--navy); box-shadow: 0 6px 20px rgba(19,197,197,0.3); }
.landing-root .btn-plan.filled:hover { background: white; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(19,197,197,0.25); }

/* FAQ */
.landing-root #faq { background: white; padding: 120px 0; }
.landing-root[data-theme="dark"] #faq { background: #0E1A2E; }
.landing-root .faq-header { text-align: center; margin-bottom: 64px; }
.landing-root .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 60px; max-width: 960px; margin: 0 auto; }
.landing-root .faq-item { border-bottom: 1px solid var(--border); padding: 24px 0; cursor: pointer; }
.landing-root .faq-question { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.landing-root .faq-question h4 { font-weight: 600; font-size: 16px; color: var(--text-primary); line-height: 1.4; }
.landing-root .faq-chevron { width: 28px; height: 28px; border-radius: 50%; background: var(--ice-highlight); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.3s, background 0.25s; font-size: 12px; color: var(--teal); }
.landing-root .faq-item.open .faq-chevron { transform: rotate(180deg); background: var(--teal); color: white; }
.landing-root .faq-answer { overflow: hidden; max-height: 0; transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.3s; }
.landing-root .faq-item.open .faq-answer { max-height: 300px; padding-top: 14px; }
.landing-root .faq-answer p { font-size: 15px; color: var(--text-secondary); line-height: 1.75; }

/* SUPPORT */
.landing-root #support { background: var(--bg); padding: 120px 0; }
.landing-root[data-theme="dark"] #support { background: #0B1221; }
.landing-root .support-header { text-align: center; margin-bottom: 72px; }
.landing-root .support-header h2 { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 48px; color: var(--navy); line-height: 1.15; margin-bottom: 16px; }
.landing-root .support-header p { font-size: 18px; color: var(--text-secondary); max-width: 560px; margin: 0 auto; line-height: 1.7; }
.landing-root .support-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-bottom: 64px; }
.landing-root .support-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 40px 32px; text-align: center; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
.landing-root .support-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(14,135,155,0.12); border-color: var(--teal); }
.landing-root[data-theme="dark"] .support-card { background: #0E1A2E; border-color: rgba(19,197,197,0.12); }
.landing-root .support-card-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; background: var(--ice-highlight); }
.landing-root .support-card h3 { font-weight: 700; font-size: 20px; color: var(--text-primary); margin-bottom: 10px; }
.landing-root .support-card p { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 20px; }
.landing-root .support-card-link { font-weight: 600; font-size: 14px; color: var(--teal); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: gap 0.2s; }
.landing-root .support-card-link:hover { gap: 10px; }
.landing-root .support-card-link::after { content: '→'; }
.landing-root .community-banner { background: linear-gradient(135deg, var(--navy) 0%, rgba(14,135,155,0.9) 100%); border-radius: 20px; padding: 56px 48px; display: flex; align-items: center; justify-content: space-between; gap: 40px; position: relative; overflow: hidden; }
.landing-root .community-banner::before { content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px; background: rgba(19,197,197,0.15); border-radius: 50%; filter: blur(60px); }
.landing-root .community-banner-text { position: relative; z-index: 1; flex: 1; }
.landing-root .community-banner-text h3 { font-weight: 700; font-size: 28px; color: white; margin-bottom: 12px; }
.landing-root .community-banner-text p { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.7; max-width: 480px; }
.landing-root .community-banner-actions { position: relative; z-index: 1; display: flex; gap: 16px; flex-shrink: 0; }
.landing-root .btn-community { padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; text-decoration: none; transition: transform 0.25s, box-shadow 0.25s; display: inline-flex; align-items: center; gap: 8px; border: none; }
.landing-root .btn-community.primary { background: white; color: var(--navy); }
.landing-root .btn-community.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.landing-root .btn-community.outline { background: transparent; color: white; border: 1.5px solid rgba(255,255,255,0.4); }
.landing-root .btn-community.outline:hover { border-color: white; transform: translateY(-2px); }

/* CTA */
.landing-root #cta { background: linear-gradient(135deg, #0B2044 0%, #0D3060 40%, #0E7A7A 100%); padding: 140px 0; position: relative; overflow: hidden; text-align: center; }
.landing-root .cta-blobs { position: absolute; inset: 0; pointer-events: none; }
.landing-root .cta-blob { position: absolute; border-radius: 50%; filter: blur(80px); }
.landing-root .cta-blob-1 { width: 500px; height: 500px; top: -100px; left: -100px; background: rgba(19,197,197,0.08); }
.landing-root .cta-blob-2 { width: 400px; height: 400px; bottom: -80px; right: 10%; background: rgba(255,255,255,0.03); }
.landing-root .cta-blob-3 { width: 300px; height: 300px; top: 30%; right: -80px; background: rgba(19,197,197,0.06); }
.landing-root .cta-inner { max-width: 700px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
.landing-root .cta-badge { display: inline-flex; align-items: center; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); border-radius: 100px; padding: 6px 16px; font-weight: 600; font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.9); text-transform: uppercase; margin-bottom: 32px; }
.landing-root .cta-title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 56px; color: white; line-height: 1.1; margin-bottom: 20px; }
.landing-root .cta-sub { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 40px; }
.landing-root .cta-fine { font-size: 13px; color: rgba(255,255,255,0.5); }

/* FOOTER */
.landing-root footer { background: #07142B; padding: 60px 0 40px; }
.landing-root .footer-top { border-top: 1px solid rgba(255,255,255,0.06); }
.landing-root .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 60px; padding: 60px 0 40px; }
.landing-root .footer-logo { font-weight: 700; font-size: 20px; color: white; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.landing-root .footer-tagline { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
.landing-root .footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
.landing-root .footer-location { font-size: 12px; color: rgba(255,255,255,0.3); }
.landing-root .footer-col h5 { font-weight: 600; font-size: 13px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 20px; }
.landing-root .footer-col a { display: block; font-size: 14px; color: rgba(255,255,255,0.5); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
.landing-root .footer-col a:hover { color: rgba(255,255,255,0.9); }
.landing-root .footer-col a.teal { color: var(--bright-teal); }

/* SCROLL PROGRESS */
.landing-root .scroll-progress { position: fixed; top: 0; left: 0; height: 3px; z-index: 1001; background: linear-gradient(90deg, #0E879B, #13C5C5); width: 0%; transition: width 0.1s linear; }

/* BACK TO TOP */
.landing-root .back-to-top { position: fixed; bottom: 32px; left: 32px; z-index: 999; width: 44px; height: 44px; border-radius: 50%; background: var(--navy); color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; box-shadow: 0 4px 20px rgba(11,32,68,0.2); opacity: 0; transform: translateY(12px); pointer-events: none; transition: opacity 0.3s, transform 0.3s, background 0.25s; }
.landing-root .back-to-top.visible { opacity: 1; transform: translateY(0); pointer-events: all; }
.landing-root .back-to-top:hover { background: var(--teal); }

/* FOCUS */
.landing-root a:focus-visible, .landing-root button:focus-visible, .landing-root input:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; border-radius: 4px; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .landing-root nav { padding: 0 24px; }
  .landing-root .nav-links { display: none; }
  .landing-root .nav-cta { display: none; }
  .landing-root .hamburger { display: flex; }
  .landing-root .container { padding: 0 24px; }
  .landing-root .hero-h1 { font-size: 48px; }
  .landing-root .hero-sub { font-size: 16px; }
  .landing-root .hero-stats { flex-direction: column; gap: 16px; border-radius: 20px; }
  .landing-root .hero-stat-divider { width: 80%; height: 1px; }
  .landing-root .hero-ctas { flex-direction: column; gap: 16px; }
  .landing-root .problem-statement { font-size: 36px; }
  .landing-root .problem-cards { grid-template-columns: 1fr; }
  .landing-root .solution-grid { grid-template-columns: 1fr; gap: 40px; }
  .landing-root .solution-title { font-size: 36px; }
  .landing-root .features-grid { grid-template-columns: 1fr; }
  .landing-root .section-title { font-size: 36px; }
  .landing-root .steps-wrapper { grid-template-columns: 1fr; }
  .landing-root .steps-line { display: none; }
  .landing-root .methods-grid { grid-template-columns: 1fr; }
  .landing-root .personas-grid { grid-template-columns: 1fr 1fr; }
  .landing-root .security-grid { grid-template-columns: 1fr; gap: 40px; }
  .landing-root .security-title { font-size: 36px; }
  .landing-root .timeline-line { display: none; }
  .landing-root .milestone { grid-template-columns: 1fr; gap: 0; }
  .landing-root .milestone.right .milestone-content { grid-column: 1; }
  .landing-root .milestone-node { display: none; }
  .landing-root .cta-title { font-size: 40px; }
  .landing-root .footer-grid { grid-template-columns: 1fr; gap: 36px; }
  .landing-root .pricing-grid { grid-template-columns: 1fr; }
  .landing-root .faq-grid { grid-template-columns: 1fr; }
  .landing-root .support-grid { grid-template-columns: 1fr; }
  .landing-root .community-banner { flex-direction: column; text-align: center; padding: 40px 28px; }
  .landing-root .community-banner-text p { max-width: 100%; }
  .landing-root .community-banner-actions { flex-direction: column; width: 100%; }
  .landing-root .btn-community { justify-content: center; }
  .landing-root .support-header h2 { font-size: 36px; }
  .landing-root .back-to-top { bottom: 20px; left: 20px; }
}
@media (max-width: 480px) {
  .landing-root .hero-h1 { font-size: 38px; }
  .landing-root .hero-badge { font-size: 9px; letter-spacing: 1px; }
  .landing-root .personas-grid { grid-template-columns: 1fr; }
  .landing-root .section-title { font-size: 30px; }
  .landing-root .problem-stat { font-size: 48px; }
}
`;

const LANDING_HTML = `
<div class="scroll-progress" id="scrollProgress"></div>
<button class="back-to-top" id="backToTop" aria-label="Back to top">↑</button>

<nav id="navbar">
  <a href="#" class="nav-logo"><div class="nav-logo-dot"></div>SORTIFY</a>
  <ul class="nav-links">
    <li><a href="#features">Features</a></li>
    <li><a href="#how">How It Works</a></li>
    <li><a href="#security">Security</a></li>
    <li><a href="#usecases">Use Cases</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#support">Support</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:16px;">
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
      <div class="toggle-track"><span class="toggle-icon-sun">☀️</span><span class="toggle-icon-moon">🌙</span></div>
      <div class="toggle-thumb"></div>
    </button>
    <a href="/login" class="nav-cta">Get Started Free</a>
  </div>
  <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="#features">Features</a><a href="#how">How It Works</a><a href="#security">Security</a><a href="#usecases">Use Cases</a><a href="#pricing">Pricing</a><a href="#roadmap">Roadmap</a><a href="#faq">FAQ</a>
  <a href="/login" class="nav-cta" style="text-align:center;margin-top:8px;">Get Started Free</a>
</div>

<section id="hero">
  <div class="hero-blob hero-blob-1"></div>
  <div class="hero-blob hero-blob-2"></div>
  <div class="hero-inner">
    <div class="hero-badge">✦&nbsp;&nbsp;NOW LIVE — AI-POWERED FILE INTELLIGENCE</div>
    <h1 class="hero-h1">Your Files,<br>Finally <span class="gradient-text">Intelligent.</span></h1>
    <p class="hero-sub">Sortify reads, understands, and organises every document you own — automatically. Search by meaning, chat with your docs, get reminded before deadlines, and never lose a file again. <strong>Your data stays private — always.</strong></p>
    <div class="hero-ctas">
      <a href="/login" class="btn-primary">Get Started Free →</a>
      <a href="#features" class="btn-secondary">Explore Features ↓</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><strong>80% less time</strong><span>searching for files</span></div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat"><strong>500ms</strong><span>average search speed</span></div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat"><strong>100%</strong><span>India-ready documents</span></div>
    </div>
  </div>
</section>

<section id="problem">
  <div class="diagonal-divider"></div>
  <div class="container" style="position:relative;z-index:1;">
    <div class="reveal" style="text-align:center;margin-bottom:12px;"><div class="section-label">THE PROBLEM</div></div>
    <div class="problem-statement reveal" style="transition-delay:0.1s;">Every day, professionals lose <span class="gradient-text">1.8 hours</span> searching for files they already have.</div>
    <div class="problem-cards">
      <div class="problem-card reveal-scale" style="transition-delay:0.1s;"><span class="problem-stat">1.8 hrs</span><h3>Lost daily per person</h3><p>Searching for files that already exist on your own device.</p></div>
      <div class="problem-card reveal-scale" style="transition-delay:0.22s;"><span class="problem-stat">60%</span><h3>Files are unsearchable</h3><p>Because they were named 'final_v3_ACTUAL_final.pdf'.</p></div>
      <div class="problem-card reveal-scale" style="transition-delay:0.34s;"><span class="problem-stat">₹5L+</span><h3>Lost annually by SMBs</h3><p>Due to missed contract renewals and compliance deadlines.</p></div>
    </div>
  </div>
</section>

<section id="solution">
  <div class="container">
    <div class="reveal" style="margin-bottom:8px;"><div class="section-label">THE SOLUTION</div></div>
    <div class="solution-grid">
      <div class="reveal" style="transition-delay:0.1s;">
        <h2 class="solution-title">Sortify doesn't store files.<br>It understands them.</h2>
        <p class="solution-body">The moment you upload a document, Sortify's AI reads it — extracts names, dates, amounts, and context — then makes it instantly findable by meaning, not just filename.</p>
        <div class="feature-pills"><span class="feature-pill">✓ Auto-tagging</span><span class="feature-pill">✓ Smart summaries</span><span class="feature-pill">✓ Expiry reminders</span><span class="feature-pill">✓ Semantic search</span></div>
      </div>
      <div class="reveal" style="transition-delay:0.25s;">
        <div class="terminal-card" id="terminalCard">
          <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
          <div class="terminal-lines">
            <div class="terminal-line grey tl-1">▸ File uploaded: insurance_policy.pdf</div>
            <div class="terminal-line grey tl-2">▸ Reading document content...</div>
            <div class="terminal-line teal tl-3">✓ Type detected: Insurance Policy</div>
            <div class="terminal-line teal tl-4">✓ Tags: Insurance · Health · Renewal · 2025</div>
            <div class="terminal-line teal tl-5">✓ Expiry date found: 14 March 2026</div>
            <div class="terminal-line gold tl-6">⏰ Reminder set: 30 days before expiry</div>
            <div class="terminal-line white tl-7">▸ File is now searchable as:</div>
            <div class="terminal-line bright tl-8">&nbsp;&nbsp;"health insurance", "renewal", "March 2026"<span class="cursor"></span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="features">
  <div class="container">
    <div class="features-header reveal"><div class="section-label">CORE FEATURES</div><h2 class="section-title">Everything your files need.<br>Nothing you don't.</h2></div>
    <div class="features-grid">
      <div class="feature-card reveal-scale" style="transition-delay:0.05s;"><div class="feature-icon">🔍</div><h3>AI Metadata Extraction</h3><p>Upload any file — Sortify reads the content, extracts key information, and stores it as searchable metadata.</p></div>
      <div class="feature-card reveal-scale" style="transition-delay:0.17s;"><div class="feature-icon">🏷️</div><h3>Smart Auto-Tagging</h3><p>AI assigns intelligent labels the moment a file lands. Invoice, Contract, Medical, Legal — organised automatically.</p></div>
      <div class="feature-card reveal-scale" style="transition-delay:0.29s;"><div class="feature-icon">⚡</div><h3>Summary-Based Search</h3><p>Search inside AI-generated summaries. Find files by what they mean, not what they're named.</p></div>
      <div class="feature-card reveal-scale" style="transition-delay:0.41s;"><div class="feature-icon">⏰</div><h3>Auto-Reminder System</h3><p>Sortify reads expiry dates inside your documents and sets reminders automatically — 90, 30, and 7 days before renewal.</p></div>
      <div class="feature-card reveal-scale" style="transition-delay:0.53s;"><div class="feature-icon">🔐</div><h3>End-to-End Encryption</h3><p>AES-256 encryption on every file. Role-based access, PII detection alerts, and full audit logs.</p></div>
      <div class="feature-card reveal-scale" style="transition-delay:0.65s;"><div class="feature-icon">☁️</div><h3>Google Drive Import</h3><p>Connect Google Drive and import files directly. Browse, select, and bring your documents into Sortify with one click.</p></div>
    </div>
  </div>
</section>

<section id="how">
  <div class="diagonal-divider"></div>
  <div class="container" style="position:relative;z-index:1;">
    <div class="how-header reveal"><div class="section-label">HOW IT WORKS</div><h2 class="section-title">From upload to intelligent in 3 seconds.</h2></div>
    <div class="steps-wrapper">
      <div class="steps-line"></div>
      <div class="step reveal" style="transition-delay:0.08s;"><div class="step-num">1</div><h3>Upload Anything</h3><p>Drop a file, photo, PDF or scan from any device.</p></div>
      <div class="step reveal" style="transition-delay:0.2s;"><div class="step-num">2</div><h3>AI Reads & Understands</h3><p>In under 3 seconds, the AI extracts content, identifies document type, reads entities, and generates a summary.</p></div>
      <div class="step reveal" style="transition-delay:0.32s;"><div class="step-num">3</div><h3>Instantly Organised</h3><p>Files are tagged, summarised, indexed for search, and reminder-ready.</p></div>
    </div>
  </div>
</section>

<section id="search">
  <div class="container">
    <div class="search-header reveal"><div class="section-label">SEARCH INTELLIGENCE</div><h2 class="section-title">9 ways to find any file.</h2></div>
    <p class="search-subtitle reveal" style="transition-delay:0.1s;">Most tools give you one. Sortify gives you nine.</p>
    <div class="methods-grid">
      <div class="method-card reveal-scale" style="transition-delay:0.05s;"><div class="method-name">Keyword Search</div><div class="method-desc">Search inside file content, not just filenames.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.1s;"><div class="method-name">Tag-Based Search</div><div class="method-desc">Filter by auto-assigned or custom tags.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.15s;"><div class="method-name">File Type Filter</div><div class="method-desc">Find all PDFs, JPGs, or DOCXs in one click.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.2s;"><div class="method-name">Date Range Search</div><div class="method-desc">By upload date or dates found inside documents.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.25s;"><div class="method-name">Natural Language</div><div class="method-desc">'Show invoices from last month' — just type it.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.3s;"><div class="method-name">Entity Search</div><div class="method-desc">Find by PAN number, company name, or amount.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.35s;"><div class="method-name">Semantic Search <span class="method-badge teal">V2.0</span></div><div class="method-desc">Understands meaning. Finds relevant files even without exact words.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.4s;"><div class="method-name">Summary Search</div><div class="method-desc">Search inside AI-generated summaries of every file.</div></div>
      <div class="method-card reveal-scale" style="transition-delay:0.45s;"><div class="method-name">AI Chat Search <span class="method-badge navy">V4.0</span></div><div class="method-desc">'Which policies expire before June?' — conversational.</div></div>
    </div>
  </div>
</section>

<section id="usecases">
  <div class="container">
    <div class="reveal" style="text-align:center;margin-bottom:12px;"><div class="section-label">USE CASES</div></div>
    <h2 class="section-title reveal" style="transition-delay:0.08s;">Built for anyone who works with documents.</h2>
    <div class="personas-grid">
      <div class="persona-card reveal-scale" style="transition-delay:0.08s;"><span class="persona-icon">💼</span><div class="persona-name">Freelancers &amp; Consultants</div><p class="persona-desc">Client contracts, invoices, project files — auto-organised.</p><div class="persona-tags"><span class="persona-tag">Invoices</span><span class="persona-tag">Contracts</span><span class="persona-tag">Projects</span></div></div>
      <div class="persona-card reveal-scale" style="transition-delay:0.18s;"><span class="persona-icon">🏢</span><div class="persona-name">Small Businesses</div><p class="persona-desc">GST documents, vendor agreements, employee files — always compliant.</p><div class="persona-tags"><span class="persona-tag">GST</span><span class="persona-tag">Agreements</span><span class="persona-tag">Compliance</span></div></div>
      <div class="persona-card reveal-scale" style="transition-delay:0.28s;"><span class="persona-icon">⚖️</span><div class="persona-name">CA &amp; Legal Firms</div><p class="persona-desc">Case files, compliance docs, renewal deadlines — automated.</p><div class="persona-tags"><span class="persona-tag">Legal</span><span class="persona-tag">Tax</span><span class="persona-tag">Deadlines</span></div></div>
      <div class="persona-card reveal-scale" style="transition-delay:0.38s;"><span class="persona-icon">🏥</span><div class="persona-name">Healthcare Clinics</div><p class="persona-desc">Patient records, insurance docs, license renewals — organised and secure.</p><div class="persona-tags"><span class="persona-tag">Records</span><span class="persona-tag">Insurance</span><span class="persona-tag">Licenses</span></div></div>
      <div class="persona-card reveal-scale" style="transition-delay:0.48s;"><span class="persona-icon">🎓</span><div class="persona-name">Students &amp; Researchers</div><p class="persona-desc">Papers, notes, references, thesis drafts — intelligently organised.</p><div class="persona-tags"><span class="persona-tag">Research</span><span class="persona-tag">Notes</span><span class="persona-tag">References</span></div></div>
    </div>
  </div>
</section>

<section id="security">
  <div class="container">
    <div class="reveal" style="margin-bottom:8px;"><div class="section-label">SECURITY &amp; PRIVACY</div></div>
    <div class="security-grid">
      <div class="reveal" style="transition-delay:0.08s;">
        <h2 class="security-title">Your files are yours.<br>Always.</h2>
        <p class="security-body">Sortify is built with security as the foundation. Every file is encrypted end-to-end. Every access is logged.</p>
        <div class="security-feature"><div class="sec-check"></div><div class="security-feature-text"><h4>AES-256 Encryption</h4><p>End-to-end on every file.</p></div></div>
        <div class="security-feature"><div class="sec-check"></div><div class="security-feature-text"><h4>Role-Based Access</h4><p>Control who sees, edits, and shares.</p></div></div>
        <div class="security-feature"><div class="sec-check"></div><div class="security-feature-text"><h4>PII Detection Alerts</h4><p>Warned when sensitive data is uploaded.</p></div></div>
        <div class="security-feature"><div class="sec-check"></div><div class="security-feature-text"><h4>DPDP Act Compliant</h4><p>India's Data Protection law ready from day one.</p></div></div>
      </div>
      <div class="reveal" style="transition-delay:0.22s;">
        <div class="badge-cards">
          <div class="badge-card"><div class="badge-icon">🔒</div><div><h4>AES-256</h4><p>Military-grade encryption standard</p></div></div>
          <div class="badge-card"><div class="badge-icon">🇮🇳</div><div><h4>DPDP Ready</h4><p>India Data Protection compliant</p></div></div>
          <div class="badge-card"><div class="badge-icon">🛡️</div><div><h4>Zero Knowledge</h4><p>We cannot read your files</p></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="roadmap">
  <div class="container">
    <div class="roadmap-header reveal"><div class="section-label">ROADMAP</div><h2 class="section-title">Where we're going.</h2></div>
    <div class="timeline">
      <div class="timeline-line"></div>
      <div class="milestone left"><div class="milestone-content reveal" style="transition-delay:0.08s;"><div class="milestone-quarter">Q2 2026</div><div class="milestone-title">V1.0 — Launch</div><div class="milestone-desc">Web app · AI engine · Smart search · Auto-reminders · Android app</div><span class="status-badge dev">IN DEVELOPMENT</span></div><div class="milestone-node"></div></div>
      <div class="milestone right"><div></div><div class="milestone-content reveal" style="transition-delay:0.12s;"><div class="milestone-quarter">Q3–Q4 2026</div><div class="milestone-title">V2.0 — Growth</div><div class="milestone-desc">iOS app · Desktop agent · Custom AI model · Enterprise dashboard</div><span class="status-badge planned">PLANNED</span></div><div class="milestone-node"></div></div>
      <div class="milestone left"><div class="milestone-content reveal" style="transition-delay:0.08s;"><div class="milestone-quarter">2027</div><div class="milestone-title">V3.0 — Enterprise</div><div class="milestone-desc">White-label product · Compliance packs · On-premise · SOC 2</div><span class="status-badge planned">PLANNED</span></div><div class="milestone-node"></div></div>
      <div class="milestone right"><div></div><div class="milestone-content reveal" style="transition-delay:0.12s;"><div class="milestone-quarter">2027–2028</div><div class="milestone-title">V4.0 — Platform</div><div class="milestone-desc">AI chat assistant · Workflow automation · Vernacular AI for 22 languages</div><span class="status-badge future">FUTURE</span></div><div class="milestone-node"></div></div>
    </div>
  </div>
</section>

<section id="testimonials">
  <div class="container"><div class="testimonials-header reveal"><div class="section-label">WHAT PEOPLE SAY</div><h2 class="section-title">Trusted by early testers across India.</h2></div></div>
  <div class="testimonials-track-wrap">
    <div class="testimonials-track" id="testimonialsTrack">
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"I used to spend 30 minutes every morning hunting for client contracts. Sortify found everything in under 2 seconds."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0B2044,#0E879B)">RK</div><div><div class="testimonial-name">Rahul Khedekar</div><div class="testimonial-role">Freelance Consultant · Pune</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"The auto-reminder for our insurance renewals alone is worth it. We almost missed a ₹40L policy renewal."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0E879B,#13C5C5)">PR</div><div><div class="testimonial-name">Priya Rawat</div><div class="testimonial-role">CA · Mumbai</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"Our clinic now manages all patient consent forms through Sortify. What used to take an hour takes 5 minutes."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#13C5C5,#0B2044)">DP</div><div><div class="testimonial-name">Dr. Deepa Pillai</div><div class="testimonial-role">Healthcare Clinic · Bangalore</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"The natural language search understood 'GST invoices from March' perfectly."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0E879B,#0B2044)">AS</div><div><div class="testimonial-name">Arjun Shah</div><div class="testimonial-role">SMB Owner · Ahmedabad</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★☆</div><p class="testimonial-quote">"Sortify's semantic search found papers relevant to my thesis that I'd completely forgotten I had."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#1A3A6E,#13C5C5)">NJ</div><div><div class="testimonial-name">Neha Joshi</div><div class="testimonial-role">PhD Researcher · IIT Delhi</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"Sortify's expiry detection reads inside agreements and flags renewals weeks before."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0B2044,#13C5C5)">VM</div><div><div class="testimonial-name">Vikram Mehta</div><div class="testimonial-role">Legal Firm Partner · Delhi</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"I used to spend 30 minutes every morning hunting for client contracts. Sortify found everything in under 2 seconds."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0B2044,#0E879B)">RK</div><div><div class="testimonial-name">Rahul Khedekar</div><div class="testimonial-role">Freelance Consultant · Pune</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"The auto-reminder for our insurance renewals alone is worth it."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0E879B,#13C5C5)">PR</div><div><div class="testimonial-name">Priya Rawat</div><div class="testimonial-role">CA · Mumbai</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"Our clinic now manages all patient consent forms through Sortify."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#13C5C5,#0B2044)">DP</div><div><div class="testimonial-name">Dr. Deepa Pillai</div><div class="testimonial-role">Healthcare Clinic · Bangalore</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"The natural language search understood 'GST invoices from March' perfectly."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0E879B,#0B2044)">AS</div><div><div class="testimonial-name">Arjun Shah</div><div class="testimonial-role">SMB Owner · Ahmedabad</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★☆</div><p class="testimonial-quote">"Sortify's semantic search found papers relevant to my thesis."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#1A3A6E,#13C5C5)">NJ</div><div><div class="testimonial-name">Neha Joshi</div><div class="testimonial-role">PhD Researcher · IIT Delhi</div></div></div></div>
      <div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"Sortify's expiry detection reads inside agreements and flags renewals weeks before."</p><div class="testimonial-author"><div class="testimonial-avatar" style="background:linear-gradient(135deg,#0B2044,#13C5C5)">VM</div><div><div class="testimonial-name">Vikram Mehta</div><div class="testimonial-role">Legal Firm Partner · Delhi</div></div></div></div>
    </div>
  </div>
</section>

<section id="pricing">
  <div class="container">
    <div class="pricing-header reveal"><div class="section-label">PRICING</div><h2 class="section-title">Simple, transparent pricing.</h2></div>
    <p class="pricing-sub reveal" style="transition-delay:0.08s;">No surprises. Cancel or change your plan at any time.</p>
    <div class="pricing-toggle reveal" style="transition-delay:0.14s;">
      <span class="active" id="lblMonthly">Monthly</span>
      <button class="billing-toggle" id="billingToggle" aria-label="Toggle billing period"></button>
      <span id="lblYearly">Yearly</span>
      <span class="pricing-badge-save" id="saveBadge" style="opacity:0;transition:opacity 0.3s;">Save 30%</span>
    </div>
    <div class="pricing-grid">
      <div class="pricing-card reveal-scale" style="transition-delay:0.08s;"><div class="plan-name">Free</div><div class="plan-price"><sup>₹</sup><span class="price-val" data-monthly="0" data-yearly="0">0</span></div><div class="plan-period">forever free</div><p class="plan-desc">Perfect for individuals getting started.</p><div class="plan-divider"></div><ul class="plan-features"><li>Up to 50 files</li><li>AI metadata extraction</li><li>Smart auto-tagging</li><li>Keyword & tag search</li><li>7-day expiry reminders</li><li class="na">Natural language search</li><li class="na">Semantic search</li><li class="na">Team collaboration</li></ul><a href="/login" class="btn-plan outline">Get Started Free</a></div>
      <div class="pricing-card featured reveal-scale" style="transition-delay:0.18s;"><div class="plan-name">Pro</div><div class="plan-price"><sup>₹</sup><span class="price-val" data-monthly="499" data-yearly="349">499</span></div><div class="plan-period" id="proPeriod">per month</div><p class="plan-desc">For professionals who live inside documents.</p><div class="plan-divider"></div><ul class="plan-features"><li>Unlimited files</li><li>AI metadata extraction</li><li>Smart auto-tagging</li><li>All 9 search modes</li><li>Auto-reminders (90/30/7 days)</li><li>Natural language search</li><li>Semantic search (V2.0)</li><li class="na">Team collaboration</li></ul><a href="/login" class="btn-plan filled">Start Pro Free →</a></div>
      <div class="pricing-card reveal-scale" style="transition-delay:0.28s;"><div class="plan-name">Team</div><div class="plan-price"><sup>₹</sup><span class="price-val" data-monthly="1499" data-yearly="999">1499</span></div><div class="plan-period" id="teamPeriod">per month · up to 10 users</div><p class="plan-desc">For small businesses and clinic teams.</p><div class="plan-divider"></div><ul class="plan-features"><li>Everything in Pro</li><li>Up to 10 team members</li><li>Role-based access control</li><li>PII detection alerts</li><li>Audit logs & activity feed</li><li>Tally & Zoho integration</li><li>Priority support</li><li>DPDP compliance tools</li></ul><a href="/login" class="btn-plan outline">Start Team Trial</a></div>
    </div>
  </div>
</section>

<section id="faq">
  <div class="container">
    <div class="faq-header reveal"><div class="section-label">FAQ</div><h2 class="section-title">Questions, answered.</h2></div>
    <div class="faq-grid">
      <div class="faq-item reveal" style="transition-delay:0.05s;"><div class="faq-question"><h4>Does Sortify store my actual files?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>Sortify stores encrypted copies on secure Indian cloud infrastructure. AES-256 encryption and Zero Knowledge policy.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.1s;"><div class="faq-question"><h4>What file types does Sortify support?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>PDFs, Word, Excel, JPGs, PNGs (with OCR), scanned documents, and text files. More formats added monthly.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.15s;"><div class="faq-question"><h4>How does the AI read my documents?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>Our AI runs OCR then NLP to extract entities. Processed on secure servers — your data never trains public models.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.2s;"><div class="faq-question"><h4>Is Sortify compliant with India's DPDP Act?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>Yes. Built from the ground up for DPDP 2023. Data stored in India, consent records maintained, full deletion on request.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.25s;"><div class="faq-question"><h4>Can I use Sortify offline?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>Desktop agent (coming Q3 2026) supports offline access. Web app requires internet.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.3s;"><div class="faq-question"><h4>How do reminders work?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>AI reads expiry dates from documents and schedules notifications at 90, 30, and 7 days before deadlines.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.35s;"><div class="faq-question"><h4>What if I exceed the free plan limit?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>You'll be notified. Existing files stay accessible. New uploads pause until you upgrade — nothing deleted.</p></div></div>
      <div class="faq-item reveal" style="transition-delay:0.4s;"><div class="faq-question"><h4>Is there a mobile app?</h4><div class="faq-chevron">▾</div></div><div class="faq-answer"><p>Android launches Q2 2026, iOS Q3 2026. Both support camera scanning, upload, search, and push reminders.</p></div></div>
    </div>
  </div>
</section>

<section id="support">
  <div class="container">
    <div class="support-header reveal"><div class="section-label">SUPPORT</div><h2>We're here to <span class="gradient-text">help.</span></h2><p>Whether you need quick answers or hands-on assistance — we've got you covered.</p></div>
    <div class="support-grid">
      <div class="support-card reveal" style="transition-delay:0.05s;"><div class="support-card-icon">📧</div><h3>Email Support</h3><p>Reach our team directly. Pro gets 24hr SLA, Business gets 4hr.</p><a href="mailto:founders@sortify.in" class="support-card-link">founders@sortify.in</a></div>
      <div class="support-card reveal" style="transition-delay:0.1s;"><div class="support-card-icon">💬</div><h3>Live Chat</h3><p>AI support assistant inside the app. Instant answers 24/7.</p><a href="/login" class="support-card-link">Open Chat in App</a></div>
      <div class="support-card reveal" style="transition-delay:0.15s;"><div class="support-card-icon">📖</div><h3>Help Center</h3><p>Step-by-step guides, tutorials, and tips.</p><a href="#faq" class="support-card-link">Browse FAQ</a></div>
    </div>
    <div class="community-banner reveal">
      <div class="community-banner-text"><h3>Join the Sortify Community 🇮🇳</h3><p>Connect with thousands of Indian professionals using Sortify.</p></div>
      <div class="community-banner-actions">
        <a href="https://twitter.com/sortifyapp" target="_blank" rel="noopener" class="btn-community primary">🐦 Follow on X</a>
        <a href="mailto:founders@sortify.in?subject=Community%20Access" class="btn-community outline">📩 Request Access</a>
      </div>
    </div>
  </div>
</section>

<section id="cta">
  <div class="cta-blobs"><div class="cta-blob cta-blob-1"></div><div class="cta-blob cta-blob-2"></div><div class="cta-blob cta-blob-3"></div></div>
  <div class="cta-inner">
    <div class="cta-badge reveal">NOW LIVE</div>
    <h2 class="cta-title reveal" style="transition-delay:0.1s;">Start managing your documents intelligently — for free.</h2>
    <p class="cta-sub reveal" style="transition-delay:0.2s;">Join thousands of Indian professionals using Sortify.</p>
    <div class="reveal" style="transition-delay:0.3s;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
      <a href="/login" class="btn-primary" style="font-size:17px;padding:16px 40px;">Create Free Account →</a>
    </div>
    <p class="cta-fine reveal" style="transition-delay:0.4s;">No credit card required · Free plan available · Cancel anytime</p>
  </div>
</section>

<footer>
  <div class="container">
    <div class="footer-top"></div>
    <div class="footer-grid">
      <div><div class="footer-logo"><div class="nav-logo-dot"></div>SORTIFY</div><p class="footer-tagline">Intelligent File Management, Reimagined</p><p class="footer-copy">© 2026 Sortify. All rights reserved.</p><p class="footer-location">📍 Pune, India</p></div>
      <div class="footer-col"><h5>Product</h5><a href="#features">Features</a><a href="#how">How It Works</a><a href="#security">Security</a><a href="#roadmap">Roadmap</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
      <div class="footer-col"><h5>Support</h5><a href="#faq">FAQ</a><a href="#support">Help & Support</a><a href="mailto:founders@sortify.in" class="teal">founders@sortify.in</a><a href="https://twitter.com/sortifyapp" target="_blank" rel="noopener">Twitter / X</a></div>
    </div>
  </div>
</footer>
`;

function initLandingScripts(root: HTMLElement) {
  // Reveal observer
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  root.querySelectorAll('.reveal, .reveal-scale').forEach(el => revealObs.observe(el));

  // Terminal card
  const terminalObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); terminalObs.unobserve(e.target); } });
  }, { threshold: 0.3 });
  const termCard = root.querySelector('#terminalCard');
  if (termCard) terminalObs.observe(termCard);

  // Nav scroll
  const navbar = root.querySelector('#navbar') as HTMLElement;
  const onScroll = () => { if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 80); };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active nav links
  const sections = root.querySelectorAll('section[id]');
  const navLinks = root.querySelectorAll('.nav-links a');
  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = (e.target as HTMLElement).id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => activeObs.observe(s));

  // Hamburger
  const hamburger = root.querySelector('#hamburger') as HTMLElement;
  const mobileMenu = root.querySelector('#mobileMenu') as HTMLElement;
  hamburger?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('open');
    hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', mobileMenu?.classList.contains('open') ? 'true' : 'false');
  });
  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { mobileMenu.classList.remove('open'); hamburger?.classList.remove('open'); });
  });

  // Dark mode toggle
  const themeToggle = root.querySelector('#themeToggle') as HTMLElement;
  const savedTheme = localStorage.getItem('sortify-landing-theme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('sortify-landing-theme', next);
  });

  // Scroll progress
  const scrollProgress = root.querySelector('#scrollProgress') as HTMLElement;
  const updateProgress = () => {
    const pct = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress && pct > 0) scrollProgress.style.width = ((window.scrollY / pct) * 100) + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });

  // Back to top
  const backToTop = root.querySelector('#backToTop') as HTMLElement;
  const onScrollBtt = () => { backToTop?.classList.toggle('visible', window.scrollY > 500); };
  window.addEventListener('scroll', onScrollBtt, { passive: true });
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Hero parallax
  const heroBlob1 = root.querySelector('.hero-blob-1') as HTMLElement;
  const heroBlob2 = root.querySelector('.hero-blob-2') as HTMLElement;
  const onMouseMove = (e: MouseEvent) => {
    const xPct = (e.clientX / window.innerWidth - 0.5) * 2;
    const yPct = (e.clientY / window.innerHeight - 0.5) * 2;
    if (heroBlob1) heroBlob1.style.transform = `translate(${xPct * 20}px, ${yPct * 20}px)`;
    if (heroBlob2) heroBlob2.style.transform = `translate(${xPct * -14}px, ${yPct * -14}px)`;
  };
  document.addEventListener('mousemove', onMouseMove);

  // Pricing toggle
  const billingToggle = root.querySelector('#billingToggle') as HTMLElement;
  const lblMonthly = root.querySelector('#lblMonthly') as HTMLElement;
  const lblYearly = root.querySelector('#lblYearly') as HTMLElement;
  const saveBadge = root.querySelector('#saveBadge') as HTMLElement;
  const proPeriod = root.querySelector('#proPeriod') as HTMLElement;
  const teamPeriod = root.querySelector('#teamPeriod') as HTMLElement;
  let isYearly = false;
  billingToggle?.addEventListener('click', () => {
    isYearly = !isYearly;
    billingToggle.classList.toggle('yearly', isYearly);
    lblMonthly?.classList.toggle('active', !isYearly);
    lblYearly?.classList.toggle('active', isYearly);
    if (saveBadge) saveBadge.style.opacity = isYearly ? '1' : '0';
    if (proPeriod) proPeriod.textContent = isYearly ? 'per month, billed yearly' : 'per month';
    if (teamPeriod) teamPeriod.textContent = isYearly ? 'per month billed yearly · 10 users' : 'per month · up to 10 users';
    root.querySelectorAll('.price-val').forEach(el => {
      const htmlEl = el as HTMLElement;
      const val = isYearly ? htmlEl.dataset.yearly : htmlEl.dataset.monthly;
      htmlEl.textContent = parseInt(val || '0').toLocaleString('en-IN');
    });
  });

  // FAQ accordion
  root.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      root.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // Smooth scroll for anchors
  root.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href) return;
      const target = root.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Cleanup function
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scroll', updateProgress);
    window.removeEventListener('scroll', onScrollBtt);
    document.removeEventListener('mousemove', onMouseMove);
    revealObs.disconnect();
    terminalObs.disconnect();
    activeObs.disconnect();
  };
}

const LandingPage = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!rootRef.current) return;

    // Intercept internal links to use React Router
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
      }
    };
    rootRef.current.addEventListener('click', handleClick);

    const cleanup = initLandingScripts(rootRef.current);

    return () => {
      rootRef.current?.removeEventListener('click', handleClick);
      cleanup();
    };
  }, [navigate]);

  return (
    <>
      <style>{LANDING_CSS}</style>
      <div
        ref={rootRef}
        className="landing-root"
        dangerouslySetInnerHTML={{ __html: LANDING_HTML }}
      />
    </>
  );
};

export default LandingPage;
