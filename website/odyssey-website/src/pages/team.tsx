import React, { JSX } from 'react';
import Layout from '@theme/Layout';

export default function Team(): JSX.Element {
  return (
    <Layout title="Our Team" description="Meet the developers behind Odyssey">
      <main className="odyssey-container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* General Team Introduction */}
        <section style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '20px' }}>Meet the Team</h1>
          <p style={{ textAlign: 'justify' ,color: '#b0b0b0', fontSize: '1.1rem', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' }}>
            The Odyssey project is brought to life by a dedicated group of final-year Computer Science students at Bilkent University. 
            Built as our senior design initiative, the team collaborates across the entire modern tech stack—from developing the responsive React Native mobile interface to engineering the Django backend and integrating the dynamic AI generation pipelines. 
            Our shared goal is to push the boundaries of digital exploration and deliver a flawless, narrative-driven user experience.
          </p>
        </section>

        {/* Project Logbooks Grid */}
        <section>
          <h2 className="odyssey-section-title" style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
            Individual Logbooks
          </h2>
          <p style={{ color: '#888', marginBottom: '30px' }}>
            Track our weekly progress, technical challenges, and development milestones throughout the project lifecycle.
          </p>

          <div className="odyssey-grid">
            <div className="odyssey-card">
              <h3>Cem Tarkan Tekcan</h3>
              <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}></p>
              <a href="https://docs.google.com/document/d/e/2PACX-1vRmTFPUNB5G4rQAH3C_pDiPgRTgZtddu_ubVj7JhcHj55Qmx8XzMnbYA1Y0iFvo-45qNjcpT9nCKZxx/pub" target="_blank" rel="noopener noreferrer" className="odyssey-btn">Read Log</a>
            </div>

            <div className="odyssey-card">
              <h3>Can Kütükoğlu</h3>
              <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}></p>
              <a href="https://docs.google.com/document/d/e/2PACX-1vRRA9O22zoyJovYB8LB-Y9MExky8WKPLa7zCrPZ9_5zoCG79ARSHEJ62-hR-bN0K8UD1-qenpo32Rf5/pub" target="_blank" rel="noopener noreferrer" className="odyssey-btn">Read Log</a>
            </div>

            <div className="odyssey-card">
              <h3>Sami Bora Akoğuz</h3>
              <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}></p>
              <a href="https://docs.google.com/document/d/e/2PACX-1vTwHvdTFj3oMyYfgUO1TO9nJVimbXRoBYzjzwEdQfmGHvGmM0OwxZUv8gnsGC7TbkgX5ZEkwYSgzK_q/pub" target="_blank" rel="noopener noreferrer" className="odyssey-btn">Read Log</a>
            </div>

            <div className="odyssey-card">
              <h3>Mehmet Rodi Aydoğdu</h3>
              <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}></p>
              <a href="https://docs.google.com/document/d/e/2PACX-1vR19606XWW8aQ5tx8dDKzFS95B7G3KZPc7KWGUgKdR68qPwz_b9oKvoq2UGS8XCPO9JJgESI2lUf_oK/pub" target="_blank" rel="noopener noreferrer" className="odyssey-btn">Read Log</a>
            </div>

            <div className="odyssey-card">
              <h3>Ege Ertem</h3>
              <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}></p>
              <a href="#" target="_blank" rel="noopener noreferrer" className="odyssey-btn">Read Log</a>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}