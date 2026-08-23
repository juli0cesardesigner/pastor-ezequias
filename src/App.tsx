import React from 'react';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { HomePage } from './pages/Home/HomePage';
import { PhotoGeneratorPage } from './pages/PhotoGenerator/PhotoGeneratorPage';
import { MaterialRequestPage } from './pages/MaterialRequest/MaterialRequestPage';
import { AdminPage } from './pages/Admin/AdminPage';
import { VisitasMapPage } from './pages/VisitasMap/VisitasMapPage';
import { useRoute } from './hooks/useRoute';
import './App.css';

export const App: React.FC = () => {
  const { currentRoute, navigateTo } = useRoute();

  if (currentRoute === 'home') {
    return <HomePage onNavigate={navigateTo} />;
  }

  if (currentRoute === 'visitas') {
    return (
      <div className="app-container">
        <main className="main-content visitas-main">
          <VisitasMapPage />
        </main>
        <Footer />
      </div>
    );
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

  if (currentRoute === 'materiais') {
    return (
      <div className="app-container">
        <Header subtitle="Solicite Seus Materiais Físicos" />
        <main className="main-content">
          <MaterialRequestPage />
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
