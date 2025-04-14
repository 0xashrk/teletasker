import React from 'react';
import './App.css';
import Hero from './components/Hero';
import Waitlist from './components/Waitlist';
import Mockup from './components/Mockup';
import SocialProof from './components/SocialProof';

function App() {
  return (
    <div className="App">
      <Hero />
      <Mockup />
      <Waitlist />
      <SocialProof />
    </div>
  );
}

export default App;
