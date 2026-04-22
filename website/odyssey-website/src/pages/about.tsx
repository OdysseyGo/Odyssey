import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function About(): JSX.Element {
  return (
    <Layout title="About Us" description="The story behind the Odyssey App">
      <main className="odyssey-container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: '#fff' }}>About Odyssey</h1>
        
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#4da3ff' }}>The Vision</h2>
          <p style={{ textAlign: 'justify', color: '#b0b0b0', lineHeight: '1.8' }}>
            We believe exploring a new city shouldn't mean following a rigid, uninspired itinerary. 
            Odyssey was born out of a desire to transform traditional sightseeing into an interactive, narrative-driven experience. 
            By blending real-world locations with AI-generated thriller storylines, we turn every street corner into a potential clue, 
            guiding you to the true soul of the city.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#4da3ff' }}>Under the Hood</h2>
          <p style={{ textAlign: 'justify', color: '#b0b0b0', lineHeight: '1.8' }}>
            Delivering a seamless, dynamic exploration experience requires a robust technical foundation. 
            Our responsive mobile interface communicates with a powerful backend handling complex user routing, 
            database migrations, and dynamic API requests to generate unique, once-in-a-lifetime puzzle scenarios on the fly.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#4da3ff' }}>Project Origins</h2>
          <p style={{ textAlign: 'justify', color: '#b0b0b0', lineHeight: '1.8' }}>
            Odyssey began as an ambitious senior design initiative aimed at redefining digital exploration and guidance. 
            Below, you can view our core presentation outlining the original scope, system architecture, and functional prototypes.
          </p>
          
          <h3 style={{ textAlign: 'justify', color: '#4da3ff' }}>First Demo Slides</h3>
          <iframe 
            src={useBaseUrl('/documents/cs491_demo_presentatio.pdf')}
            width="100%" 
            height="600px"
            style={{ border: '1px solid #333', borderRadius: '8px', marginTop: '15px' }}
            title="Odyssey Final Presentation">
          </iframe>
        </section>

      </main>
    </Layout>
  );
}