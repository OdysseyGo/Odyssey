import React, { JSX } from 'react';
import Layout from '@theme/Layout';

export default function Contact(): JSX.Element {
  return (
    <Layout title="Contact — Odyssey" description="Contact information for Odyssey">
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Contact
        </h1>
        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: '1.7' }}>
          For support, legal, privacy, or general Odyssey questions, reach out to us by email.
        </p>

        <section
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: '#F8FAFC',
          }}
        >
          <h2 style={{ color: '#0F172A', fontSize: '1.2rem', marginBottom: '8px' }}>Email</h2>
          <a
            href="mailto:odysseybilkent@gmail.com"
            style={{ color: '#0284C7', fontSize: '1.05rem', fontWeight: 600 }}
          >
            odysseybilkent@gmail.com
          </a>
        </section>
      </main>
    </Layout>
  );
}
