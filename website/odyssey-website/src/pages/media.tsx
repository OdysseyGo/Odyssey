import React, { JSX } from 'react';
import Layout from '@theme/Layout';

const videoList = [
  {
    id: 'demo-1',
    title: 'Odyssey App Demo',
    description: 'See how we turn an ordinary city walk into a thrilling puzzle experience.',
    youtubeId: 'YOUR_FIRST_VIDEO_ID', 
  },
  {
    id: 'presentation-1',
    title: 'CS492 Final Presentation Recording',
    description: 'A deep dive into our AI storyline generation, Django backend, and React Native frontend.',
    youtubeId: 'YOUR_SECOND_VIDEO_ID',
  }
];

export default function Media(): JSX.Element {
  return (
    <Layout title="Media & Demos" description="Watch the Odyssey app in action">
      <main className="odyssey-container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '15px' }}>Media & Demos</h1>
          <p style={{ color: '#b0b0b0', fontSize: '1.1rem' }}>
            Explore our project updates, gameplay demonstrations, and technical presentations.
          </p>
        </div>

        {/* Video Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
          {videoList.map((video) => (
            <section key={video.id}>
              <h2 style={{ color: '#4da3ff', marginBottom: '10px' }}>{video.title}</h2>
              <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>{video.description}</p>
              
              <div style={{ 
                position: 'relative', 
                paddingBottom: '56.25%', 
                height: 0, 
                overflow: 'hidden', 
                borderRadius: '12px', 
                border: '1px solid #333',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <iframe 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  src={`https://www.youtube.com/embed/${video.youtubeId}`} 
                  title={video.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
            </section>
          ))}
        </div>

      </main>
    </Layout>
  );
}