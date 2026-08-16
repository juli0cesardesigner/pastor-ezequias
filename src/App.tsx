import React from 'react';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { HomePage } from './pages/Home/HomePage';
import { PhotoGeneratorPage } from './pages/PhotoGenerator/PhotoGeneratorPage';
import { AdminPage } from './pages/Admin/AdminPage';
import { useRoute } from './hooks/useRoute';
import './App.css';

export const App: React.FC = () => {
  const { currentRoute, navigateTo } = useRoute();

  if (currentRoute === 'home') {
    return <HomePage />;
  }

  if (currentRoute === 'admin') {
    return (
      <div className="app-container">
        <main className="main-content admin-main">
          <AdminPage onBackToSite={() => navigateTo('apoio')} />
        </main>
        <Footer />
      </div>
    );
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
