import React from 'react';
import './HomePage.css';

interface HomePageProps {
  onNavigate?: (route: any) => void;
}

export const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="under-construction-page">
      <span className="under-construction-text">em construção</span>
    </div>
  );
};
