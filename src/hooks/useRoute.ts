import { useState, useEffect, useCallback } from 'react';
import type { PageRoute } from '../types/navigation';

function getRouteFromLocation(): PageRoute {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  if (path === '/admin' || path === '/admin/' || path.startsWith('/admin') || hash === 'admin') {
    return 'admin';
  }
  if (path === '/materiais' || path === '/materiais/' || path.startsWith('/materiais') || hash === 'materiais') {
    return 'materiais';
  }
  if (path === '/apoio' || path === '/apoio/' || path.startsWith('/apoio') || hash === 'apoio') {
    return 'apoio';
  }
  return 'home';
}

export function useRoute() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(getRouteFromLocation);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(getRouteFromLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = useCallback((route: PageRoute) => {
    const targetPath = route === 'home' ? '/' : `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { currentRoute, navigateTo };
}
