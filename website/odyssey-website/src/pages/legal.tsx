import React, { JSX } from 'react';
import Layout from '@theme/Layout';

const LAST_UPDATED = 'May 1, 2026';

const sectionStyle: React.CSSProperties = {
  marginBottom: '48px',
};

const headingStyle: React.CSSProperties = {
  color: '#0284C7',
  fontSize: '1.4rem',
  marginBottom: '12px',
  marginTop: '32px',
};

const subheadingStyle: React.CSSProperties = {
  color: '#0369A1',
  fontSize: '1.1rem',
  marginBottom: '8px',
  marginTop: '24px',
};

const textStyle: React.CSSProperties = {
  color: '#334155',
  lineHeight: '1.8',
  marginBottom: '12px',
};

const listStyle: React.CSSProperties = {
  color: '#334155',
  lineHeight: '2',
  paddingLeft: '20px',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  border: 'none',
  background: active ? '#0284C7' : 'transparent',
  color: active ? '#fff' : '#64748B',
  transition: 'all 0.2s',
});

export default function Legal(): JSX.Element {
  const [tab, setTab] = React.useState<'terms' | 'privacy'>('terms');

  return (
    <Layout
      title="Legal — Terms of Use & Privacy Policy"
      description="Odyssey Terms of Use and Privacy Policy"
    >
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Legal
        </h1>
        <p style={{ color: '#64748B', marginBottom: '32px' }}>
          Last updated: {LAST_UPDATED}
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', background: '#E2E8F0', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
          <button style={tabStyle(tab === 'terms')} onClick={() => setTab('terms')}>
            Terms of Use
          </button>
          <button style={tabStyle(tab === 'privacy')} onClick={() => setTab('privacy')}>
            Privacy Policy
          </button>
        </div>

        {/* ── Terms of Use ── */}
        {tab === 'terms' && (
          <section style={sectionStyle}>
            <h2 style={{ color: '#0F172A', fontSize: '1.8rem', marginBottom: '8px' }}>Terms of Use</h2>
            <p style={textStyle}>
              By downloading, installing, or using the Odyssey mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using the app.
            </p>

            <h3 style={headingStyle}>1. Acceptance of Terms</h3>
            <p style={textStyle}>
              By accessing or using Odyssey, you confirm that you are at least 13 years of age and have the legal capacity to enter into these terms. If you are under 18, you must have parental or guardian consent.
            </p>

            <h3 style={headingStyle}>2. Use of the App</h3>
            <p style={textStyle}>
              Odyssey is designed to enhance your real-world exploration experience. You agree to use the app only for lawful purposes and in a manner that does not infringe the rights of others.
            </p>
            <p style={textStyle}>You agree not to:</p>
            <ul style={listStyle}>
              <li>Use the app while driving or in situations where your attention is required for safety</li>
              <li>Trespass on private property while following a tour route</li>
              <li>Upload content that is offensive, misleading, or infringes third-party rights</li>
              <li>Attempt to reverse engineer, hack, or disrupt the platform</li>
            </ul>

            <h3 style={headingStyle}>3. Safety Responsibility</h3>
            <p style={textStyle}>
              Odyssey is an outdoor exploration app. You are solely responsible for your personal safety while using it. Always remain aware of your surroundings, obey traffic laws, and do not use the app in dangerous environments. Odyssey and its team bear no liability for accidents, injuries, or losses incurred during app use.
            </p>

            <h3 style={headingStyle}>4. User-Generated Content</h3>
            <p style={textStyle}>
              Tours, reviews, and other content you create remain your intellectual property. However, by submitting content to Odyssey, you grant us a non-exclusive, worldwide, royalty-free licence to display and distribute that content within the platform.
            </p>
            <p style={textStyle}>
              We reserve the right to remove any content that violates these terms or community standards without prior notice.
            </p>

            <h3 style={headingStyle}>5. AI-Generated Content</h3>
            <p style={textStyle}>
              Some tours and quiz content are generated using Google Gemini. While we strive for accuracy, AI-generated content may occasionally contain errors or inaccuracies. Odyssey does not guarantee the historical or factual correctness of AI-generated tours.
            </p>

            <h3 style={headingStyle}>6. Account Termination</h3>
            <p style={textStyle}>
              We reserve the right to suspend or permanently terminate your account if you violate these terms, engage in fraudulent activity, or behave in a way that harms other users or the platform.
            </p>

            <h3 style={headingStyle}>7. Changes to Terms</h3>
            <p style={textStyle}>
              We may update these Terms of Use from time to time. Continued use of the app after changes are posted constitutes your acceptance of the revised terms. We will make reasonable efforts to notify users of significant changes.
            </p>

            <h3 style={headingStyle}>8. Contact</h3>
            <p style={textStyle}>
              For questions about these terms, contact us at <a href="mailto:odysseybilkent@gmail.com" style={{ color: '#0284C7' }}>odysseybilkent@gmail.com</a>.
            </p>
          </section>
        )}

        {/* ── Privacy Policy ── */}
        {tab === 'privacy' && (
          <section style={sectionStyle}>
            <h2 style={{ color: '#0F172A', fontSize: '1.8rem', marginBottom: '8px' }}>Privacy Policy</h2>
            <p style={textStyle}>
              Your privacy matters to us. This policy explains what data Odyssey collects, how it is used, and your rights regarding that data.
            </p>

            <h3 style={headingStyle}>1. Data We Collect</h3>

            <h4 style={subheadingStyle}>Account Information</h4>
            <p style={textStyle}>
              When you register, we collect your name, username, and email address. This is used to identify your account and personalise your experience.
            </p>

            <h4 style={subheadingStyle}>Location Data</h4>
            <p style={textStyle}>
              Odyssey uses your device location to show nearby tours, track progress along a route, and provide turn-by-turn guidance via Google Maps. Location data is processed on-device and is not stored on our servers beyond what is required to complete an active tour session.
            </p>

            <h4 style={subheadingStyle}>Usage Data</h4>
            <p style={textStyle}>
              We collect anonymised data about how you interact with the app — screens visited, tours started and completed, quiz answers — to improve the product and personalise recommendations.
            </p>

            <h4 style={subheadingStyle}>User-Generated Content</h4>
            <p style={textStyle}>
              Tours, reviews, and profile information you submit are stored on our servers to provide the core functionality of the platform.
            </p>

            <h3 style={headingStyle}>2. How We Use Your Data</h3>
            <ul style={listStyle}>
              <li>To operate and improve the Odyssey platform</li>
              <li>To personalise tour recommendations and content</li>
              <li>To send account-related notifications (no marketing without consent)</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>

            <h3 style={headingStyle}>3. Third-Party Services</h3>
            <p style={textStyle}>Odyssey integrates the following third-party services, each with their own privacy policies:</p>
            <ul style={listStyle}>
              <li><strong style={{ color: '#0F172A' }}>Google Maps</strong> — route display and location services</li>
              <li><strong style={{ color: '#0F172A' }}>Google Gemini</strong> — AI tour and quiz generation</li>
              <li><strong style={{ color: '#0F172A' }}>Azure</strong> — backend hosting and infrastructure</li>
            </ul>
            <p style={textStyle}>
              We do not sell your personal data to any third party.
            </p>

            <h3 style={headingStyle}>4. Data Retention</h3>
            <p style={textStyle}>
              Your account data is retained for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Anonymised usage data may be retained for analytical purposes.
            </p>

            <h3 style={headingStyle}>5. Security</h3>
            <p style={textStyle}>
              We use industry-standard measures including JWT authentication, encrypted storage, and HTTPS to protect your data. However, no system is completely secure, and we cannot guarantee absolute security.
            </p>

            <h3 style={headingStyle}>6. Children's Privacy</h3>
            <p style={textStyle}>
              Odyssey is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.
            </p>

            <h3 style={headingStyle}>7. Your Rights</h3>
            <p style={textStyle}>Depending on your jurisdiction, you may have the right to:</p>
            <ul style={listStyle}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Object to or restrict certain processing</li>
            </ul>
            <p style={textStyle}>
              To exercise any of these rights, contact us at <a href="mailto:odysseybilkent@gmail.com" style={{ color: '#0284C7' }}>odysseybilkent@gmail.com</a>.
            </p>

            <h3 style={headingStyle}>8. Changes to This Policy</h3>
            <p style={textStyle}>
              We may update this Privacy Policy periodically. We will notify users of material changes via the app or email. Continued use of Odyssey after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>
        )}

      </main>
    </Layout>
  );
}
