import React from 'react';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { HomePage } from './pages/Home/HomePage';
import { PhotoGeneratorPage } from './pages/PhotoGenerator/PhotoGeneratorPage';
import { useRoute } from './hooks/useRoute';
import './App.css';

export const App: React.FC = () => {
  const { currentRoute } = useRoute();

  if (currentRoute === 'home') {
    return <HomePage />;
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <PhotoGeneratorPage />
      </main>
      <Footer />
    </div>
  );
};

export default App;
