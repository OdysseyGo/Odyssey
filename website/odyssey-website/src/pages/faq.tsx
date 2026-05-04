import React, { JSX } from 'react';
import Layout from '@theme/Layout';

type FAQSection = {
  title: string;
  intro: string;
  items: { question: string; answer: string }[];
};

const faqSections: FAQSection[] = [
  {
    title: 'Getting Started',
    intro: 'Core information for first-time users.',
    items: [
      {
        question: 'How do I start using Odyssey?',
        answer:
          'Install and open the app, review the safety disclaimer, then continue as a guest or sign in for full features.',
      },
      {
        question: 'Can I use Odyssey without an account?',
        answer:
          'Yes. Guest mode lets you browse and explore. Create an account to save progress, collect profile rewards, and use social features.',
      },
      {
        question: 'Where can I get legal and privacy information?',
        answer:
          'Visit the Legal page from the website navbar to review Terms of Use and Privacy Policy.',
      },
    ],
  },
  {
    title: 'Tours and Navigation',
    intro: 'How to discover, start, and complete tours.',
    items: [
      {
        question: 'How do I find tours near me or in another location?',
        answer:
          'Use the map and search experience to discover tours by area, destination, and relevance. Tour cards display key details before you start.',
      },
      {
        question: 'How do I start a tour?',
        answer:
          'Open a tour detail page and tap Start Tour. Odyssey guides you through stops and story/puzzle progression.',
      },
      {
        question: 'How do I complete a tour?',
        answer:
          'Follow the stop flow and complete required story or puzzle steps. After completion, you can leave ratings or reviews when available.',
      },
      {
        question: 'What if there are no tours in my area?',
        answer:
          'Try searching a different map area, zooming out, or using destination-based search terms.',
      },
    ],
  },
  {
    title: 'Puzzle Solving Guide',
    intro: 'How to solve AR, compass, and picture-compare style challenges.',
    items: [
      {
        question: 'How do AR puzzles work and how do I solve them?',
        answer:
          'When an AR puzzle starts, allow camera/motion permissions if prompted, move your device slowly to scan the environment, and follow the on-screen markers until virtual clues lock in. Interact with highlighted AR objects and submit your answer from the puzzle action area once the required clue is found.',
      },
      {
        question: 'How do compass puzzles work?',
        answer:
          'Compass puzzles ask you to face or align to a target direction. Hold your phone upright, calibrate by moving it in a figure-eight motion if direction looks unstable, then rotate your body/device until the indicator aligns with the requested heading. Confirm once alignment is stable.',
      },
      {
        question: 'How do picture-compare puzzles work?',
        answer:
          'Picture-compare puzzles require matching your live camera view with a reference image. Move closer/farther and adjust angle until landmarks line up, then capture/submit from the puzzle screen. Better framing and lighting usually improve match quality.',
      },
      {
        question: 'What should I do if a puzzle seems inaccurate or won’t validate?',
        answer:
          'Pause briefly, re-center your position, and retry with better lighting and steadier movement. For compass issues, recalibrate and avoid magnetic interference. For AR/photo puzzles, ensure camera permission is enabled and your lens is clear before retrying.',
      },
    ],
  },
  {
    title: 'Account and Profile',
    intro: 'Managing sign-in, settings, and profile data.',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Use the Sign up flow from guest or authentication screens, complete account fields, and accept terms.',
      },
      {
        question: 'How do I sign in or reset password?',
        answer:
          'Use the Login page for sign-in and the Forgot Password flow to receive a verification code and set a new password.',
      },
      {
        question: 'How do I change language or app preferences?',
        answer:
          'Language can be changed from the authentication/guest language selector. Profile settings are available after sign-in.',
      },
      {
        question: 'Can I log out anytime?',
        answer: 'Yes. Open profile settings and choose Log out.',
      },
    ],
  },
  {
    title: 'Creation and Publishing',
    intro: 'For users who want to create tours.',
    items: [
      {
        question: 'Who can create tours?',
        answer:
          'Signed-in users can create tours through the creation flow and submit them for review/publishing.',
      },
      {
        question: 'What is the full tour creation process step by step?',
        answer:
          'Open the Create Tour flow, choose your creation method (manual or AI-assisted where available), fill in tour details (title, category, duration, and core context), add route locations/stops, write story and puzzle content for each stop, review the final summary screen, and submit the tour. After submission, your tour enters pending review. Once approved, it appears under published tours.',
      },
      {
        question: 'What is included in tour creation?',
        answer:
          'You can define route locations, tour details, and content elements such as story and puzzle steps depending on flow and permissions.',
      },
      {
        question: 'How should I prepare locations and stop content?',
        answer:
          'Pick a clear route order, keep stop descriptions concise, and add puzzles/stories that match each location. A coherent route and consistent narrative improves approval quality and user experience.',
      },
      {
        question: 'Can I edit a tour before submission?',
        answer:
          'Yes. During the creation flow you can go back between steps to update details, locations, and story content before final review and submission.',
      },
      {
        question: 'What do pending, published, and archived mean?',
        answer:
          'Pending tours are under review, published tours are visible to users, and archived tours are hidden from active discovery.',
      },
    ],
  },
  {
    title: 'Badges, XP, and Social',
    intro: 'Progression and community features.',
    items: [
      {
        question: 'What are XP and levels?',
        answer:
          'XP tracks your activity and completed experiences. Higher XP contributes to level progression shown in your profile.',
      },
      {
        question: 'How do badges work?',
        answer:
          'Badges are earned by completing milestone activities. Earned badges appear in your profile badge section.',
      },
      {
        question: 'How do I follow other users?',
        answer:
          'Use profile discovery/search to open a user profile and tap Follow. You can also manage followers/following from profile pages.',
      },
      {
        question: 'What is following feed?',
        answer:
          'It shows recent completed-tour activity from users you follow.',
      },
    ],
  },
  {
    title: 'Safety and Troubleshooting',
    intro: 'Best practices and common issues.',
    items: [
      {
        question: 'Is Odyssey safe to use while walking?',
        answer:
          'Use Odyssey responsibly, keep awareness of surroundings, obey local rules, and avoid unsafe environments.',
      },
      {
        question: 'What if map, search, or profile data does not load?',
        answer:
          'Check internet connectivity, retry from the app, and relaunch if needed. Temporary network issues can affect loading.',
      },
      {
        question: 'What if notifications are not working?',
        answer:
          'Ensure notification permission is granted in your device settings and app prompts.',
      },
      {
        question: 'How can I contact the team?',
        answer:
          'For legal/privacy or support-related concerns, use the contact information listed on the Legal page.',
      },
    ],
  },
];

export default function Faq(): JSX.Element {
  const [pressedCategory, setPressedCategory] = React.useState<string | null>(null);
  const getSectionId = (title: string) => title.toLowerCase().replace(/\s+/g, '-');

  const handleCategoryClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionTitle: string) => {
    event.preventDefault();
    const sectionId = getSectionId(sectionTitle);
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${sectionId}`);
  };

  return (
    <Layout
      title="FAQ — Odyssey"
      description="Frequently asked questions for Odyssey basic features and usage."
    >
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: '#64748B', marginBottom: '28px', lineHeight: '1.7' }}>
          This guide covers essential Odyssey functionality, account management, creation flow,
          progression systems, and troubleshooting.
        </p>

        <nav
          aria-label="FAQ sections"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '22px',
          }}
        >
          {faqSections.map((section) => (
            <a
              key={section.title}
              href={`#${getSectionId(section.title)}`}
              onClick={(event) => handleCategoryClick(event, section.title)}
              onMouseDown={() => setPressedCategory(section.title)}
              onMouseUp={() => setPressedCategory(null)}
              onMouseLeave={() => setPressedCategory(null)}
              onTouchStart={() => setPressedCategory(section.title)}
              onTouchEnd={() => setPressedCategory(null)}
              style={{
                fontSize: '0.9rem',
                color: '#0369A1',
                textDecoration: 'none',
                border: '1px solid #BAE6FD',
                padding: '6px 10px',
                borderRadius: '999px',
                backgroundColor: pressedCategory === section.title ? '#DBEAFE' : '#F0F9FF',
                transform: pressedCategory === section.title ? 'scale(0.95)' : 'scale(1)',
                boxShadow:
                  pressedCategory === section.title
                    ? '0 2px 8px rgba(2, 132, 199, 0.26)'
                    : '0 1px 3px rgba(2, 132, 199, 0.12)',
                transition:
                  'transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease',
              }}
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div style={{ display: 'grid', gap: '16px' }}>
          {faqSections.map((section) => (
            <section
              key={section.title}
              id={getSectionId(section.title)}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '18px',
                backgroundColor: '#FFFFFF',
                scrollMarginTop: '88px',
              }}
            >
              <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem' }}>{section.title}</h2>
              <p style={{ marginTop: '8px', color: '#64748B', lineHeight: '1.7' }}>{section.intro}</p>

              <div style={{ display: 'grid', gap: '10px' }}>
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <summary style={{ cursor: 'pointer', color: '#0F172A', fontWeight: 700 }}>
                      {item.question}
                    </summary>
                    <p style={{ margin: '10px 0 2px', color: '#334155', lineHeight: '1.75' }}>
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
