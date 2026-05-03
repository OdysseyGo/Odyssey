import React, { JSX, useEffect } from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

const TEAM = [
  { initials: 'CT', name: 'Cem Tarkan Tekcan',    id: '22201590', role: 'Mobile',       color: '#D97706', colorEnd: '#F59E0B', roleColor: '#D97706', roleBg: 'rgba(217,119,6,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vRmTFPUNB5G4rQAH3C_pDiPgRTgZtddu_ubVj7JhcHj55Qmx8XzMnbYA1Y0iFvo-45qNjcpT9nCKZxx/pub' },
  { initials: 'SB', name: 'Sami Bora Akoğuz',    id: '22202184', role: 'Backend',      color: '#0284C7', colorEnd: '#0369A1', roleColor: '#0284C7', roleBg: 'rgba(2,132,199,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vTwHvdTFj3oMyYfgUO1TO9nJVimbXRoBYzjzwEdQfmGHvGmM0OwxZUv8gnsGC7TbkgX5ZEkwYSgzK_q/pub' },
  { initials: 'CK', name: 'Can Kütükoğlu',        id: '22202619', role: 'Fullstack',    color: '#16A34A', colorEnd: '#22C55E', roleColor: '#16A34A', roleBg: 'rgba(22,163,74,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vRRA9O22zoyJovYB8LB-Y9MExky8WKPLa7zCrPZ9_5zoCG79ARSHEJ62-hR-bN0K8UD1-qenpo32Rf5/pub' },
  { initials: 'EE', name: 'Ege Ertem',            id: '22202433', role: 'Mobile',       color: '#7C3AED', colorEnd: '#A78BFA', roleColor: '#7C3AED', roleBg: 'rgba(124,58,237,0.10)', logbook: 'https://docs.google.com/document/d/e/2PACX-1vRM__8iTPELbKNomSY2GorymSvNcOUvP27BRU5Ew3wLI4QLNMxe7DkYhVCM0TGuisKOVAQQTvroRhug/pub' },
  { initials: 'MR', name: 'Mehmet Rodi Aydoğdu',  id: '22201856', role: 'AI / Backend', color: '#DC2626', colorEnd: '#F87171', roleColor: '#DC2626', roleBg: 'rgba(220,38,38,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vR19606XWW8aQ5tx8dDKzFS95B7G3KZPc7KWGUgKdR68qPwz_b9oKvoq2UGS8XCPO9JJgESI2lUf_oK/pub' },
];

const REPORTS = [
  { icon: '📋', title: 'Analysis & Requirements Report', desc: 'Scope definition, user personas, functional and non-functional requirements.', pdf: '/Odyssey/documents/Analysis_and_Requirements_Report_Odyssey.pdf' },
  { icon: '🏗️', title: 'Detailed Design Report',         desc: 'Database schema, API routing, system architecture, and component design.',   pdf: '/Odyssey/documents/Detailed_Design_Report_Odyssey.pdf' },
  { icon: '🎤', title: 'CS491 Demo Slides',              desc: 'First public demo presentation showcasing the original project scope.',       pdf: '/Odyssey/documents/cs491_demo_presentatio.pdf' },
];

const FEATURES = [
  { icon: '🤖', bg: 'rgba(2,132,199,0.10)',   title: 'AI Tour Creator',      desc: 'Describe any theme or city and let Gemini instantly generate a complete multi-stop walking tour with trivia and stories.' },
  { icon: '🧩', bg: 'rgba(217,119,6,0.10)',   title: 'Interactive Quizzes',  desc: 'At every stop, answer location-specific trivia questions to deepen your understanding of the place.' },
  { icon: '🗺️', bg: 'rgba(22,163,74,0.10)',   title: 'Live Maps',            desc: 'Google Maps integration shows your route, current location, and nearby tour stops in real time.' },
  { icon: '⭐', bg: 'rgba(245,158,11,0.10)',   title: 'Reviews & Ratings',   desc: 'Rate completed tours, leave detailed reviews, and help other explorers find the best adventures.' },
  { icon: '🔍', bg: 'rgba(2,132,199,0.10)',   title: 'Smart Search',         desc: 'Search tours by city, category, difficulty, duration, or continent — and find other explorers by username.' },
  { icon: '🌐', bg: 'rgba(217,119,6,0.10)',   title: 'Multi-language',       desc: 'Full English and Turkish support with device locale detection. More languages coming soon.' },
];

const TECH = [
  { icon: '⚛️', name: 'React Native + Expo', desc: 'Cross-platform mobile with file-based routing via Expo Router' },
  { icon: '🐍', name: 'Django + DRF',        desc: 'REST API backend with JWT auth, PostgreSQL, and Docker' },
  { icon: '✨', name: 'Google Gemini',        desc: 'Gemini 2.5 Flash powers AI tour and quiz generation' },
  { icon: '🗺️', name: 'Google Maps',          desc: 'Live navigation, route metrics, and location services' },
];

const MISSION_CARDS = [
  { icon: '🎯', title: 'Purposeful Design',  desc: 'Every feature is built to deepen engagement with a place, not distract from it.' },
  { icon: '🤝', title: 'Community First',    desc: 'Local experts and passionate travelers are the best tour guides. We give them the tools.' },
  { icon: '🌍', title: 'Built for Everyone', desc: 'Multi-language support, accessible UI, and tours for every pace and interest.' },
];

export default function Home(): JSX.Element {
  const iconSrc      = useBaseUrl('/img/icon.jpeg');
  const groupPhoto   = useBaseUrl('/img/group_photo.jpg');
  const mascot1Src   = useBaseUrl('/img/mascotte1.png');
  const mascot2Src   = useBaseUrl('/img/mascotte2.png');

  useEffect(() => {
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const smoothScrollTo = (targetY: number, duration = 900) => {
      const startY = window.scrollY;
      const distance = targetY - startY;
      let start: number | null = null;
      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // Capture phase (true) fires before Docusaurus/React Router handles the click
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Extract hash regardless of base URL prefix (e.g. /Odyssey/#about → about)
      const hashIndex = href.lastIndexOf('#');
      if (hashIndex === -1) return;
      const id = href.slice(hashIndex + 1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return; // only intercept if the element exists on this page
      e.preventDefault();
      e.stopImmediatePropagation();
      history.pushState(null, '', `#${id}`);
      const targetY = el.getBoundingClientRect().top + window.scrollY - 64;
      smoothScrollTo(targetY);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return (
    <Layout title="Odyssey — City Exploration, Reimagined" description="AI-powered city tours by Odyssey">
      <div className="lp-page">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div>
              <div className="lp-hero-eyebrow">
                <span className="lp-eyebrow-dot" />
                AI-Powered City Tours
              </div>
              <h1 className="lp-hero-h1">Explore Every City Like a <span>Local</span></h1>
              <p className="lp-hero-sub">
                Odyssey transforms city exploration into interactive adventures. Solve puzzles,
                discover hidden gems, and let AI generate unique quests — all guided through your phone.
              </p>
              <div className="lp-hero-actions">
                <a href="#screenshots" className="lp-btn-primary">📱 See the App</a>
                <a href="#about" className="lp-btn-ghost">Learn More →</a>
              </div>
              <div className="lp-hero-stats">
                <div><div className="lp-stat-val">AI</div><div className="lp-stat-label">Generated Tours</div></div>
                <div><div className="lp-stat-val">∞</div><div className="lp-stat-label">Unique Quests</div></div>
                <div><div className="lp-stat-val">2</div><div className="lp-stat-label">Languages</div></div>
                <div><div className="lp-stat-val">🌍</div><div className="lp-stat-label">Any City</div></div>
              </div>
            </div>

            {/* Phone mockup cluster */}
            <div className="lp-hero-visual">
              {/* Left: Map */}
              <div className="lp-phone lp-phone-left">
                <div className="lp-phone-screen">
                  <div className="lp-phone-header">
                    <div className="lp-phone-header-title">🗺 Explore</div>
                    <div className="lp-phone-header-sub">Istanbul, Turkey</div>
                  </div>
                  <div className="lp-phone-map">
                    <div className="lp-map-grid" />
                    <span className="lp-map-pin">📍</span>
                  </div>
                  <div className="lp-tab-bar">
                    <span className="lp-tab">🏠</span>
                    <span className="lp-tab lp-tab--active">🗺</span>
                    <span className="lp-tab">👤</span>
                    <span className="lp-tab">⚙️</span>
                  </div>
                </div>
              </div>

              {/* Center: Tour List */}
              <div className="lp-phone lp-phone-main">
                <div className="lp-phone-screen">
                  <div className="lp-phone-header">
                    <div className="lp-phone-header-title">Odyssey</div>
                    <div className="lp-phone-header-sub">Discover your next adventure</div>
                  </div>
                  <div className="lp-phone-card">
                    <div className="lp-phone-card-img" style={{ background: 'linear-gradient(135deg,#0284C7,#0369A1)' }}>🏛️</div>
                    <div className="lp-phone-card-body">
                      <div className="lp-phone-card-title">Historic Istanbul Walk</div>
                      <div className="lp-phone-card-meta">⏱ 90 min · 8 stops · ⭐ 4.8</div>
                      <div className="lp-phone-pill">Featured</div>
                    </div>
                  </div>
                  <div className="lp-phone-card">
                    <div className="lp-phone-card-img" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>🍜</div>
                    <div className="lp-phone-card-body">
                      <div className="lp-phone-card-title">Street Food Adventure</div>
                      <div className="lp-phone-card-meta">⏱ 60 min · 5 stops · ⭐ 4.6</div>
                      <div className="lp-phone-pill">AI Generated</div>
                    </div>
                  </div>
                  <div className="lp-phone-map" style={{ height: '80px' }}>
                    <div className="lp-map-grid" />
                    <span className="lp-map-pin" style={{ fontSize: '16px' }}>🧭</span>
                  </div>
                  <div className="lp-tab-bar">
                    <span className="lp-tab lp-tab--active">🏠</span>
                    <span className="lp-tab">🗺</span>
                    <span className="lp-tab">👤</span>
                    <span className="lp-tab">⚙️</span>
                  </div>
                </div>
              </div>

              {/* Right: Quiz */}
              <div className="lp-phone lp-phone-right">
                <div className="lp-phone-screen lp-phone-screen--light">
                  <div className="lp-quiz-header">
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Step 3 of 8</div>
                    <div className="lp-quiz-prog"><div className="lp-quiz-fill" /></div>
                  </div>
                  <div className="lp-quiz-q">What year was the Hagia Sophia originally built as a cathedral?</div>
                  <div className="lp-quiz-options">
                    <div className="lp-quiz-opt">324 AD</div>
                    <div className="lp-quiz-opt lp-quiz-opt--correct">537 AD ✓</div>
                    <div className="lp-quiz-opt">800 AD</div>
                    <div className="lp-quiz-opt">1054 AD</div>
                  </div>
                  <div className="lp-tab-bar lp-tab-bar--light" style={{ marginTop: 'auto' }}>
                    <span className="lp-tab">🏠</span>
                    <span className="lp-tab">🗺</span>
                    <span className="lp-tab lp-tab--active">🎯</span>
                    <span className="lp-tab">👤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MASCOTS ──────────────────────────────────────────── */}
        <section className="lp-mascot-band">
          <div className="lp-container lp-mascot-inner">
            <div className="lp-mascot-text">
              <span className="lp-section-label" style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.15)' }}>Meet Ody</span>
              <h2>Your Guide to Every Adventure</h2>
              <p>Ody is Odyssey's mascot — curious, colourful, and always pointing you toward the next discovery. He'll be with you every step of the way.</p>
            </div>
            <div className="lp-mascot-images">
              <img src={mascot2Src} alt="Ody standing" className="lp-mascot-img" />
            </div>
          </div>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────── */}
        <section className="lp-section lp-section--white" id="about">
          <div className="lp-container lp-about-grid">
            <div className="lp-about-mascot">
              <img src={mascot1Src} alt="Ody mascot" className="lp-about-mascot-img" />
            </div>
            <div>
              <span className="lp-section-label">About the Project</span>
              <h2 className="lp-section-title">City Exploration,<br />Reimagined</h2>
              <p className="lp-section-sub" style={{ marginBottom: '24px' }}>
                Imagine exploring a new city — not with a boring guidebook, but by solving a thrilling
                mystery where the city itself is your game board.
              </p>
              <p className="lp-section-sub">
                Odyssey transforms city tours into interactive adventures, guiding you through points of
                interest with captivating stories and immersive challenges. We use AI to generate endless
                unique quests, and empower a community of creators to build their own — turning every city
                street into an unforgettable experience.
              </p>
            </div>
            <div className="lp-about-illustration">
              <div className="lp-ai-badge">✨ Powered by Gemini AI</div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--blue">🗺️</div>
                <div>
                  <h4>AI Tour Generation</h4>
                  <p>Gemini 2.5 Flash generates unique, story-driven walking tours for any city in seconds.</p>
                </div>
              </div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--amber">🏆</div>
                <div>
                  <h4>Gamification & Quizzes</h4>
                  <p>Complete challenges, answer location-based questions, and earn rewards at every stop.</p>
                </div>
              </div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--green">👥</div>
                <div>
                  <h4>Community Created</h4>
                  <p>Any user can create and share their own tour, turning local knowledge into adventures.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section className="lp-section lp-section--gray" id="features">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-label">Features</span>
              <h2 className="lp-section-title">Everything You Need to Explore</h2>
              <p className="lp-section-sub">Built for travelers, locals, and curious explorers alike.</p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="lp-feature-card">
                  <div className="lp-feature-card-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCREENSHOTS ──────────────────────────────────────── */}
        <section className="lp-section lp-section--white" id="screenshots">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-label">Screenshots</span>
              <h2 className="lp-section-title">See Odyssey in Action</h2>
              <p className="lp-section-sub">A peek at the screens you'll be exploring on your next adventure.</p>
            </div>
            <div className="lp-screenshots-track">

              {/* Screen 1: Tour List */}
              <div className="lp-screenshot-item">
                <div className="lp-screenshot-phone">
                  <div className="lp-screen-mock" style={{ background: '#0C1A2E' }}>
                    <div className="lp-s-header">
                      <div className="lp-s-header-title">Discover</div>
                      <div className="lp-s-header-sub">Find your next adventure</div>
                    </div>
                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      {[
                        { img: '🏛️', bg: 'linear-gradient(135deg,#0284C7,#0369A1)', title: 'Historic Istanbul Walk', meta: '90 min · 8 stops · Istanbul', stars: '★★★★★' },
                        { img: '🍜', bg: 'linear-gradient(135deg,#D97706,#F59E0B)', title: 'Parisian Street Food',   meta: '60 min · 5 stops · Paris',    stars: '★★★★☆' },
                        { img: '🌿', bg: 'linear-gradient(135deg,#16A34A,#22C55E)', title: 'Tokyo Garden Walk',     meta: '45 min · 4 stops · Tokyo',    stars: '★★★★★' },
                        { img: '🏰', bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', title: 'Medieval Prague',       meta: '120 min · 10 stops · Prague', stars: '★★★★☆' },
                      ].map((t) => (
                        <div key={t.title} className="lp-s-tour-card">
                          <div className="lp-s-tour-img" style={{ background: t.bg }}>{t.img}</div>
                          <div className="lp-s-tour-body">
                            <div className="lp-s-tour-title">{t.title}</div>
                            <div className="lp-s-tour-meta">{t.meta}</div>
                            <div className="lp-s-tour-stars">{t.stars}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-tab-bar">
                      <span className="lp-tab lp-tab--active">🏠</span>
                      <span className="lp-tab">🗺</span>
                      <span className="lp-tab">👤</span>
                      <span className="lp-tab">⚙️</span>
                    </div>
                  </div>
                </div>
                <div className="lp-screenshot-label">Tour Discovery</div>
              </div>

              {/* Screen 2: Map */}
              <div className="lp-screenshot-item">
                <div className="lp-screenshot-phone">
                  <div className="lp-screen-mock" style={{ background: '#0C1A2E' }}>
                    <div className="lp-s-header">
                      <div className="lp-s-header-title">🗺 Live Map</div>
                      <div className="lp-s-header-sub">3 stops remaining</div>
                    </div>
                    <div className="lp-s-map-full">
                      <div className="lp-s-map-grid" />
                      <span className="lp-s-pin" style={{ top: '20%', left: '30%' }}>📍</span>
                      <span className="lp-s-pin" style={{ top: '45%', left: '55%' }}>📍</span>
                      <span className="lp-s-pin" style={{ top: '60%', left: '25%', opacity: 0.5 }}>📍</span>
                      <span className="lp-s-pin" style={{ top: '35%', left: '65%', fontSize: '26px' }}>🔵</span>
                      <div className="lp-s-map-card">
                        <div className="lp-s-map-card-title">Next: Hagia Sophia</div>
                        <div className="lp-s-map-card-sub">280m · ~4 min walk</div>
                      </div>
                    </div>
                    <div className="lp-tab-bar">
                      <span className="lp-tab">🏠</span>
                      <span className="lp-tab lp-tab--active">🗺</span>
                      <span className="lp-tab">👤</span>
                      <span className="lp-tab">⚙️</span>
                    </div>
                  </div>
                </div>
                <div className="lp-screenshot-label">Live Navigation</div>
              </div>

              {/* Screen 3: Quiz */}
              <div className="lp-screenshot-item">
                <div className="lp-screenshot-phone">
                  <div className="lp-screen-mock" style={{ background: '#F8FAFC' }}>
                    <div className="lp-quiz-header">
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Step 4 of 8 — Hagia Sophia</div>
                      <div className="lp-quiz-prog"><div className="lp-quiz-fill" style={{ width: '50%' }} /></div>
                    </div>
                    <div className="lp-quiz-q" style={{ color: '#1E293B' }}>Which empire converted Hagia Sophia into a mosque in 1453?</div>
                    <div className="lp-quiz-options">
                      <div className="lp-quiz-opt" style={{ background: '#F8FAFC', color: '#1E293B', borderColor: 'rgba(30,41,59,0.10)' }}>Byzantine Empire</div>
                      <div className="lp-quiz-opt" style={{ background: '#F8FAFC', color: '#1E293B', borderColor: 'rgba(30,41,59,0.10)' }}>Roman Empire</div>
                      <div className="lp-quiz-opt lp-quiz-opt--correct">Ottoman Empire ✓</div>
                      <div className="lp-quiz-opt" style={{ background: '#F8FAFC', color: '#1E293B', borderColor: 'rgba(30,41,59,0.10)' }}>Mongolian Empire</div>
                    </div>
                    <div style={{ padding: '14px', marginTop: 'auto' }}>
                      <div style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid #16A34A', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>✓ Correct! +10 pts</div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>The Ottoman Sultan Mehmed II conquered Constantinople in 1453.</div>
                      </div>
                    </div>
                    <div className="lp-tab-bar lp-tab-bar--light" style={{ marginTop: 'auto' }}>
                      <span className="lp-tab">🏠</span>
                      <span className="lp-tab">🗺</span>
                      <span className="lp-tab lp-tab--active">🎯</span>
                      <span className="lp-tab">👤</span>
                    </div>
                  </div>
                </div>
                <div className="lp-screenshot-label">Interactive Quiz</div>
              </div>

              {/* Screen 4: Profile */}
              <div className="lp-screenshot-item">
                <div className="lp-screenshot-phone">
                  <div className="lp-screen-mock" style={{ background: '#F8FAFC' }}>
                    <div className="lp-s-profile-header">
                      <div className="lp-s-avatar">🧭</div>
                    </div>
                    <div className="lp-s-profile-body">
                      <div className="lp-s-profile-name">Ege Ertem</div>
                      <div className="lp-s-profile-sub">Istanbul, Turkey</div>
                      <div className="lp-s-stats-row">
                        <div className="lp-s-stat"><div className="lp-s-stat-val">12</div><div className="lp-s-stat-lbl">Tours Done</div></div>
                        <div className="lp-s-stat"><div className="lp-s-stat-val">3</div><div className="lp-s-stat-lbl">Created</div></div>
                        <div className="lp-s-stat"><div className="lp-s-stat-val">340</div><div className="lp-s-stat-lbl">Points</div></div>
                      </div>
                      <div className="lp-s-menu-item">🎯 My Tours</div>
                      <div className="lp-s-menu-item">⭐ Reviews</div>
                      <div className="lp-s-menu-item">🏆 Achievements</div>
                      <div className="lp-s-menu-item">⚙️ Settings</div>
                    </div>
                  </div>
                </div>
                <div className="lp-screenshot-label">Profile</div>
              </div>

              {/* Screen 5: Search */}
              <div className="lp-screenshot-item">
                <div className="lp-screenshot-phone">
                  <div className="lp-screen-mock" style={{ background: '#F8FAFC' }}>
                    <div className="lp-s-header">
                      <div className="lp-s-header-title">Search</div>
                    </div>
                    <div style={{ padding: '10px' }}>
                      <div style={{ background: '#fff', border: '1.5px solid rgba(30,41,59,0.10)', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span>🔍</span>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Search tours or users...</span>
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Suggestions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {['Istanbul', 'Food Tour', 'History', 'Walking'].map((tag) => (
                          <span key={tag} style={{ background: 'rgba(2,132,199,0.08)', color: '#0284C7', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px' }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Recent</div>
                      {['Paris food spots', 'Tokyo gardens', 'creator'].map((item) => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(30,41,59,0.10)' }}>
                          <span style={{ fontSize: '14px' }}>🕐</span>
                          <span style={{ fontSize: '12px', color: '#1E293B' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="lp-tab-bar lp-tab-bar--light" style={{ marginTop: 'auto' }}>
                      <span className="lp-tab">🏠</span>
                      <span className="lp-tab lp-tab--active">🔍</span>
                      <span className="lp-tab">🗺</span>
                      <span className="lp-tab">👤</span>
                    </div>
                  </div>
                </div>
                <div className="lp-screenshot-label">Search</div>
              </div>

            </div>
          </div>
        </section>

        {/* ── REPORTS ──────────────────────────────────────────── */}
        <section className="lp-section lp-section--gray" id="reports">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-label">Reports</span>
              <h2 className="lp-section-title">Project Documentation</h2>
              <p className="lp-section-sub">Our design decisions, architecture choices, and engineering milestones.</p>
            </div>
            <div className="lp-reports-list">
              {REPORTS.map((r) => (
                <div key={r.title} className="lp-report-embed">
                  <div className="lp-report-embed-header">
                    <span className="lp-report-icon">{r.icon}</span>
                    <div>
                      <h3 className="lp-report-title">{r.title}</h3>
                      <p className="lp-report-desc">{r.desc}</p>
                    </div>
                    <a href={r.pdf} target="_blank" rel="noopener noreferrer" className="lp-report-btn">Open full screen →</a>
                  </div>
                  <iframe
                    src={r.pdf}
                    title={r.title}
                    className="lp-report-iframe"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEAM ─────────────────────────────────────────────── */}
        <section className="lp-section lp-section--gray" id="team">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-label">The Team</span>
              <h2 className="lp-section-title">Meet the Explorers Behind Odyssey</h2>
              <p className="lp-section-sub">Five computer science students who believe travel should be an adventure, not a chore.</p>
            </div>
            <div className="lp-group-photo-wrap">
              <img src={groupPhoto} alt="The Odyssey team at Bilkent University" className="lp-group-photo" />
              <div className="lp-group-photo-caption">The Odyssey Team · Bilkent University</div>
            </div>
            <div className="lp-team-grid">
              {TEAM.map((m) => (
                <div key={m.name} className="lp-team-card">
                  <div className="lp-team-avatar" style={{ background: `linear-gradient(135deg,${m.color},${m.colorEnd})` }}>{m.initials}</div>
                  <div className="lp-team-name">{m.name}</div>
                  <div className="lp-team-id">{m.id}</div>
                  <a href={m.logbook} target="_blank" rel="noopener noreferrer" className="lp-logbook-btn" style={{ background: m.color }}>
                    📖 Read Weekly Logbook
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MISSION ──────────────────────────────────────────── */}
        <section className="lp-mission" id="mission">
          <div className="lp-container lp-mission-inner">
            <div>
              <div className="lp-mission-tag">🧭 Our Mission</div>
              <h2>Making Every City an Adventure</h2>
              <p>
                We started Odyssey because we believe the best way to understand a city is to experience it —
                not just photograph it. Traditional tours are passive. We wanted something that pulls you in,
                makes you curious, and rewards exploration.
              </p>
              <p>
                By combining AI-generated content, gamification, and community creativity, Odyssey makes city
                exploration more accessible, engaging, and fun for everyone — whether you're a first-time
                visitor or a lifelong local.
              </p>
            </div>
            <div className="lp-mission-right">
            <div className="lp-mission-cards">
              {MISSION_CARDS.map((c) => (
                <div key={c.title} className="lp-mission-card">
                  <div className="lp-mission-card-icon">{c.icon}</div>
                  <div>
                    <h4>{c.title}</h4>
                    <p>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* ── TECH ─────────────────────────────────────────────── */}
        <section className="lp-section lp-section--white" id="tech">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-section-label">Tech Stack</span>
              <h2 className="lp-section-title">Built With Modern Tools</h2>
            </div>
            <div className="lp-tech-grid">
              {TECH.map((t) => (
                <div key={t.name} className="lp-tech-card">
                  <div className="lp-tech-icon">{t.icon}</div>
                  <div className="lp-tech-name">{t.name}</div>
                  <div className="lp-tech-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <div className="lp-footer-logo">
              <div className="lp-footer-logo-icon"><img src={iconSrc} alt="Odyssey" /></div>
              Odyssey
            </div>
            <div className="lp-footer-copy">© 2026 Odyssey Project Team · Bilkent University</div>
          </div>
        </footer>

      </div>
    </Layout>
  );
}
