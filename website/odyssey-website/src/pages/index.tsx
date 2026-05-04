import React, { JSX, useEffect } from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  Atom,
  BookOpenText,
  Bot,
  Compass,
  FileText,
  Globe2,
  Handshake,
  Languages,
  Map,
  MapPinned,
  Mic,
  Puzzle,
  Search,
  ServerCog,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

type IconItem = {
  icon: LucideIcon;
};

const TEAM = [
  { initials: 'CT', name: 'Cem Tarkan Tekcan',    id: '22201590', role: 'Mobile',       color: '#D97706', colorEnd: '#F59E0B', roleColor: '#D97706', roleBg: 'rgba(217,119,6,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vRmTFPUNB5G4rQAH3C_pDiPgRTgZtddu_ubVj7JhcHj55Qmx8XzMnbYA1Y0iFvo-45qNjcpT9nCKZxx/pub' },
  { initials: 'SB', name: 'Sami Bora Akoğuz',    id: '22202184', role: 'Backend',      color: '#0284C7', colorEnd: '#0369A1', roleColor: '#0284C7', roleBg: 'rgba(2,132,199,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vTwHvdTFj3oMyYfgUO1TO9nJVimbXRoBYzjzwEdQfmGHvGmM0OwxZUv8gnsGC7TbkgX5ZEkwYSgzK_q/pub' },
  { initials: 'CK', name: 'Can Kütükoğlu',        id: '22202619', role: 'Fullstack',    color: '#16A34A', colorEnd: '#22C55E', roleColor: '#16A34A', roleBg: 'rgba(22,163,74,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vRRA9O22zoyJovYB8LB-Y9MExky8WKPLa7zCrPZ9_5zoCG79ARSHEJ62-hR-bN0K8UD1-qenpo32Rf5/pub' },
  { initials: 'EE', name: 'Ege Ertem',            id: '22202433', role: 'Mobile',       color: '#7C3AED', colorEnd: '#A78BFA', roleColor: '#7C3AED', roleBg: 'rgba(124,58,237,0.10)', logbook: 'https://docs.google.com/document/d/e/2PACX-1vRM__8iTPELbKNomSY2GorymSvNcOUvP27BRU5Ew3wLI4QLNMxe7DkYhVCM0TGuisKOVAQQTvroRhug/pub' },
  { initials: 'MR', name: 'Mehmet Rodi Aydoğdu',  id: '22201856', role: 'AI / Backend', color: '#DC2626', colorEnd: '#F87171', roleColor: '#DC2626', roleBg: 'rgba(220,38,38,0.10)',  logbook: 'https://docs.google.com/document/d/e/2PACX-1vR19606XWW8aQ5tx8dDKzFS95B7G3KZPc7KWGUgKdR68qPwz_b9oKvoq2UGS8XCPO9JJgESI2lUf_oK/pub' },
];

const REPORTS: Array<IconItem & { title: string; desc: string; pdf: string }> = [
  { icon: FileText, title: 'Analysis & Requirements Report', desc: 'Scope definition, user personas, functional and non-functional requirements.', pdf: '/Odyssey/documents/Analysis_and_Requirements_Report_Odyssey.pdf' },
  { icon: MapPinned, title: 'Detailed Design Report',         desc: 'Database schema, API routing, system architecture, and component design.',   pdf: '/Odyssey/documents/Detailed_Design_Report_Odyssey.pdf' },
  { icon: Mic, title: 'CS491 Demo Slides',                    desc: 'First public demo presentation showcasing the original project scope.',       pdf: '/Odyssey/documents/cs491_demo_presentatio.pdf' },
];

const FEATURES: Array<IconItem & { bg: string; title: string; desc: string }> = [
  { icon: Bot, bg: 'rgba(2,132,199,0.10)',       title: 'AI Tour Creator',      desc: 'Describe any theme or city and let Gemini instantly generate a complete multi-stop walking tour with trivia and stories.' },
  { icon: Puzzle, bg: 'rgba(217,119,6,0.10)',    title: 'Interactive Quizzes',  desc: 'At every stop, answer location-specific trivia questions to deepen your understanding of the place.' },
  { icon: Map, bg: 'rgba(22,163,74,0.10)',       title: 'Live Maps',            desc: 'Google Maps integration shows your route, current location, and nearby tour stops in real time.' },
  { icon: Star, bg: 'rgba(245,158,11,0.10)',     title: 'Reviews & Ratings',   desc: 'Rate completed tours, leave detailed reviews, and help other explorers find the best adventures.' },
  { icon: Search, bg: 'rgba(2,132,199,0.10)',    title: 'Smart Search',         desc: 'Search tours by city, category, difficulty, duration, or continent — and find other explorers by username.' },
  { icon: Languages, bg: 'rgba(217,119,6,0.10)', title: 'Multi-language',       desc: 'Full English and Turkish support with device locale detection. More languages coming soon.' },
];

const TECH: Array<IconItem & { name: string; desc: string }> = [
  { icon: Atom, name: 'React Native + Expo', desc: 'Cross-platform mobile with file-based routing via Expo Router' },
  { icon: ServerCog, name: 'Django + DRF',   desc: 'REST API backend with JWT auth, PostgreSQL, and Docker' },
  { icon: Sparkles, name: 'Google Gemini',   desc: 'Gemini 2.5 Flash powers AI tour and quiz generation' },
  { icon: MapPinned, name: 'Google Maps',    desc: 'Live navigation, route metrics, and location services' },
];

const MISSION_CARDS: Array<IconItem & { title: string; desc: string }> = [
  { icon: Target, title: 'Purposeful Design',  desc: 'Every feature is built to deepen engagement with a place, not distract from it.' },
  { icon: Handshake, title: 'Community First', desc: 'Local experts and passionate travelers are the best tour guides. We give them the tools.' },
  { icon: Globe2, title: 'Built for Everyone', desc: 'Multi-language support, accessible UI, and tours for every pace and interest.' },
];

const SCREENSHOTS = [
  { src: '/img/app-route-progress.png', label: 'Route Progress', alt: 'Odyssey active route progress screen' },
  { src: '/img/app-following-feed.png', label: 'Following Feed', alt: 'Odyssey following feed screen' },
  { src: '/img/app-create-tour.png', label: 'Create Tour', alt: 'Odyssey tour creation method selection screen' },
  { src: '/img/app-profile.png', label: 'Profile', alt: 'Odyssey profile and badges screen' },
  { src: '/img/app-map-explore.png', label: 'Explore Map', alt: 'Odyssey map screen with nearby tours' },
  { src: '/img/app-tour-puzzle.png', label: 'Interactive Puzzle', alt: 'Odyssey puzzle challenge screen' },
  { src: '/img/app-discover-tours.png', label: 'Tour Discovery', alt: 'Odyssey Discover Tours screen' },
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
                <a href="#screenshots" className="lp-btn-primary"><Map className="lp-icon" />See the App</a>
                <a href="#about" className="lp-btn-ghost">Learn More →</a>
              </div>
              <div className="lp-hero-stats">
                <div><div className="lp-stat-val">AI</div><div className="lp-stat-label">Generated Tours</div></div>
                <div><div className="lp-stat-val">∞</div><div className="lp-stat-label">Unique Quests</div></div>
                <div><div className="lp-stat-val">2</div><div className="lp-stat-label">Languages</div></div>
                <div><div className="lp-stat-val"><Globe2 className="lp-icon" /></div><div className="lp-stat-label">Any City</div></div>
              </div>
            </div>

            {/* Phone screenshot cluster */}
            <div className="lp-hero-visual">
              <div className="lp-phone lp-phone-left">
                <img
                  className="lp-phone-image"
                  src={useBaseUrl('/img/app-tour-puzzle.png')}
                  alt="Odyssey puzzle screen preview"
                  loading="lazy"
                  decoding="async"
                  width={1290}
                  height={2796}
                />
              </div>

              <div className="lp-phone lp-phone-main">
                <img
                  className="lp-phone-image"
                  src={useBaseUrl('/img/app-discover-tours.png')}
                  alt="Odyssey discover tours screen preview"
                  loading="lazy"
                  decoding="async"
                  width={1290}
                  height={2796}
                />
              </div>

              <div className="lp-phone lp-phone-right">
                <img
                  className="lp-phone-image"
                  src={useBaseUrl('/img/app-following-feed.png')}
                  alt="Odyssey following feed screen preview"
                  loading="lazy"
                  decoding="async"
                  width={1290}
                  height={2796}
                />
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
              <div className="lp-ai-badge"><Sparkles className="lp-icon" />Powered by Gemini AI</div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--blue"><MapPinned className="lp-icon" /></div>
                <div>
                  <h4>AI Tour Generation</h4>
                  <p>Gemini 2.5 Flash generates unique, story-driven walking tours for any city in seconds.</p>
                </div>
              </div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--amber"><Trophy className="lp-icon" /></div>
                <div>
                  <h4>Gamification & Quizzes</h4>
                  <p>Complete challenges, answer location-based questions, and earn rewards at every stop.</p>
                </div>
              </div>
              <div className="lp-feature-row">
                <div className="lp-feature-icon lp-feature-icon--green"><Users className="lp-icon" /></div>
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
                  <div className="lp-feature-card-icon" style={{ background: f.bg }}><f.icon className="lp-icon" /></div>
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
              {SCREENSHOTS.map((screenshot) => (
                <div key={screenshot.src} className="lp-screenshot-item">
                  <div className="lp-screenshot-phone">
                    <img
                      className="lp-screenshot-image"
                      src={useBaseUrl(screenshot.src)}
                      alt={screenshot.alt}
                      loading="lazy"
                      decoding="async"
                      width={1290}
                      height={2796}
                    />
                  </div>
                  <div className="lp-screenshot-label">{screenshot.label}</div>
                </div>
              ))}
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
                    <span className="lp-report-icon"><r.icon className="lp-icon" /></span>
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
                    <BookOpenText className="lp-icon" />Read Weekly Logbook
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
              <div className="lp-mission-tag"><Compass className="lp-icon" />Our Mission</div>
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
                  <div className="lp-mission-card-icon"><c.icon className="lp-icon" /></div>
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
                  <div className="lp-tech-icon"><t.icon className="lp-icon" /></div>
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
