import { useState, useEffect, useCallback } from 'react';
import type { PageRoute } from '../types/navigation';

/**
 * Detecta se a aplicação está sendo executada no modo standalone (PWA instalado).
 * Compatível com Android/Desktop (display-mode: standalone), iOS Safari (navigator.standalone)
 * e Android TWA (Trusted Web Activity via referrer).
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneMedia =
      typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches);

    const isIosStandalone =
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;

    const isAndroidApp =
      typeof document !== 'undefined' &&
      typeof document.referrer === 'string' &&
      document.referrer.startsWith('android-app://');

    return Boolean(isStandaloneMedia || isIosStandalone || isAndroidApp);
  } catch {
    return false;
  }
}

/**
 * Normaliza e verifica se um pathname corresponde à rota raiz da SPA
 * (ex.: '', '/', '//', '/index.html', '/index.html/').
 */
export function isRootPath(pathname: string): boolean {
  const normalized = (pathname || '')
    .toLowerCase()
    .trim()
    .replace(/\/+/g, '/');
  return (
    normalized === '' ||
    normalized === '/' ||
    normalized === '/index.html' ||
    normalized === '/index.html/'
  );
}

/**
 * Limpa e extrai a rota do hash (suporta #agenda, #/agenda, #/agenda/, #!/agenda, etc.).
 */
export function getCleanHash(hash: string): string {
  return (hash || '')
    .toLowerCase()
    .replace(/^#[!/]*\/?/, '')
    .replace(/\/+$/, '')
    .split('?')[0]
    .trim();
}

/**
 * Obtém parâmetro explícito de rota a partir de query params (page, route, p),
 * ignorando valores vazios ou apenas espaços em branco, independente de caixa alta/baixa.
 */
export function getExplicitRouteParam(searchParams: URLSearchParams): string | null {
  for (const [key, value] of searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'page' || lowerKey === 'route' || lowerKey === 'p') {
      const trimmed = (value || '').trim().toLowerCase().replace(/\/+$/, '');
      if (trimmed) return trimmed;
    }
  }
  return null;
}

/**
 * Obtém a rota atual da aplicação com base na URL (pathname, hash e searchParams)
 * e no modo de execução (PWA standalone vs navegador web comum).
 */
export function getRouteFromLocation(): PageRoute {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname.toLowerCase().trim();
  const hash = getCleanHash(window.location.hash);
  const searchParams = new URLSearchParams(window.location.search);
  const pageParam = getExplicitRouteParam(searchParams);

  if (path === '/admin' || path.startsWith('/admin/') || hash === 'admin' || pageParam === 'admin') {
    return 'admin';
  }
  if (path === '/materiais' || path.startsWith('/materiais/') || hash === 'materiais' || pageParam === 'materiais') {
    return 'materiais';
  }
  if (
    path === '/visitas' ||
    path.startsWith('/visitas/') ||
    path === '/mapa' ||
    path.startsWith('/mapa/') ||
    hash === 'visitas' ||
    hash === 'mapa' ||
    pageParam === 'visitas' ||
    pageParam === 'mapa'
  ) {
    return 'visitas';
  }
  if (
    path === '/tp' ||
    path.startsWith('/tp/') ||
    path === '/ppt' ||
    path.startsWith('/ppt/') ||
    path === '/prompter' ||
    path.startsWith('/prompter/') ||
    path === '/teleprompter' ||
    path.startsWith('/teleprompter/') ||
    hash === 'tp' ||
    hash === 'ppt' ||
    hash === 'prompter' ||
    hash === 'teleprompter' ||
    pageParam === 'tp' ||
    pageParam === 'ppt' ||
    pageParam === 'prompter' ||
    pageParam === 'teleprompter'
  ) {
    return 'ppt';
  }
  if (
    path === '/agenda' ||
    path.startsWith('/agenda/') ||
    hash === 'agenda' ||
    pageParam === 'agenda'
  ) {
    return 'agenda';
  }
  if (
    path === '/videos' ||
    path.startsWith('/videos/') ||
    path === '/midias' ||
    path.startsWith('/midias/') ||
    hash === 'videos' ||
    hash === 'midias' ||
    pageParam === 'videos' ||
    pageParam === 'midias'
  ) {
    return 'videos';
  }
  if (
    path === '/votos' ||
    path.startsWith('/votos/') ||
    path === '/eleicoes' ||
    path.startsWith('/eleicoes/') ||
    path === '/apuracao' ||
    path.startsWith('/apuracao/') ||
    hash === 'votos' ||
    hash === 'eleicoes' ||
    hash === 'apuracao' ||
    pageParam === 'votos' ||
    pageParam === 'eleicoes' ||
    pageParam === 'apuracao'
  ) {
    return 'votos';
  }
  if (
    path === '/apoio' ||
    path.startsWith('/apoio/') ||
    hash === 'apoio' ||
    pageParam === 'apoio'
  ) {
    return 'apoio';
  }
  if (
    path === '/home' ||
    path.startsWith('/home/') ||
    hash === 'home' ||
    pageParam === 'home'
  ) {
    return 'home';
  }

  // Quando o app é aberto como PWA instalado (modo standalone) na raiz sem rota explícita,
  // restaura a última rota ativa salva no localStorage (ex: 'ppt' se estava usando o Teleprompter, ou 'agenda').
  if (isStandaloneMode() && isRootPath(path) && !hash && !pageParam) {
    try {
      const savedRoute = localStorage.getItem('pwa_last_active_route');
      if (savedRoute === 'ppt') {
        return 'ppt';
      }
    } catch {}
    return 'agenda';
  }

  // Acesso padrão via navegador web comum na URL raiz abre a HomePage.
  return 'home';
}

/**
 * Retorna o caminho de destino esperado para uma rota, considerando o modo standalone.
 */
export function getTargetPath(route: PageRoute, standalone = isStandaloneMode()): string {
  if (route === 'home') {
    return standalone ? '/home' : '/';
  }
  if (route === 'agenda') {
    return '/?page=agenda';
  }
  return `/${route}`;
}

export function useRoute() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(getRouteFromLocation);

  useEffect(() => {
    // Salva a rota ativa no localStorage para permitir que o PWA standalone reabra na mesma aplicação
    try {
      if (currentRoute === 'ppt') {
        localStorage.setItem('pwa_last_active_route', 'ppt');
      } else if (currentRoute === 'agenda') {
        localStorage.setItem('pwa_last_active_route', 'agenda');
      }
    } catch {}

    // Se o PWA foi iniciado em modo standalone na raiz sem query params de rota,
    // sincroniza a URL respeitando a última rota ativa para evitar desviar indevidamente para o login da Agenda.
    if (
      isStandaloneMode() &&
      isRootPath(window.location.pathname) &&
      !getCleanHash(window.location.hash)
    ) {
      const searchParams = new URLSearchParams(window.location.search);
      const explicitRoute = getExplicitRouteParam(searchParams);
      if (!explicitRoute) {
        let savedRoute = 'agenda';
        try {
          savedRoute = localStorage.getItem('pwa_last_active_route') || 'agenda';
        } catch {}

        if (savedRoute === 'ppt') {
          window.history.replaceState({}, '', '/tp');
          setCurrentRoute('ppt');
        } else {
          const keysToDelete: string[] = [];
          for (const [k] of searchParams.entries()) {
            const lk = k.toLowerCase();
            if (lk === 'page' || lk === 'route' || lk === 'p') {
              keysToDelete.push(k);
            }
          }
          for (const k of keysToDelete) {
            searchParams.delete(k);
          }
          searchParams.set('page', 'agenda');
          const newSearch = searchParams.toString();
          window.history.replaceState({}, '', newSearch ? `/?${newSearch}` : '/?page=agenda');
        }
      }
    }

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
    const targetPath = getTargetPath(route);
    const currentTarget =
      window.location.pathname +
      (window.location.search || '') +
      (window.location.hash || '');

    if (currentTarget !== targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setCurrentRoute(route);
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return { currentRoute, navigateTo };
}

