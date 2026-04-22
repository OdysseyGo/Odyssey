import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Odyssey App"
      description="by team OdysseyGO">
      <main className="odyssey-container">
        
        <div className="odyssey-hero">
          <img src={useBaseUrl('/img/icon.jpeg')} alt="App Icon" className="odyssey-app-icon" />
          <h1 className="odyssey-title">Odyssey</h1>
          <h2 className="odyssey-title" style={{fontSize: '1.8rem'}}>Are you lost or seeking adventure?</h2>
          
          <div className="odyssey-intro-text">
            <p>
              Our app is for your needs. We are generating a story for each country which makes it so unique. 
              The boring city tours are our main source, but we make them become a <span className="odyssey-highlight">thriller</span>.
            </p>
            <p>
              As you are wandering around a city of unknowns, you will find clues, find puzzles, and find your way out. 
              These clues will guide you to the soul of the city with its real stories. 
              AI is used to create once-in-a-lifetime stories, which will make your tour an unforgettable experience.
            </p>
            <p>
              Moreover, our goal is to create a community that will create and share tours. 
              This community will be a source for generating new knowledge and new experiences. 
              We are developing a new form of exploration and guidance. Creating a new form of excitement and fun for everyone.
            </p>  
          </div>
        </div>
      </main>
    </Layout>
  );
}