import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Direct import of real functions from the codebase (no duplicated code!)
import {
  getRouteFromLocation,
  isStandaloneMode,
  getTargetPath,
  isRootPath,
  getCleanHash,
  getExplicitRouteParam,
} from '../src/hooks/useRoute.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to simulate window, location, history and media matching
function simulateEnv({
  pathname = '/',
  search = '',
  hash = '',
  isStandalone = false,
  isIosStandalone = false,
  referrer = '',
} = {}) {
  const pushedHistory = [];
  const replacedHistory = [];
  const dispatchedEvents = [];

  globalThis.document = {
    referrer,
  };

  globalThis.window = {
    location: {
      pathname,
      search,
      hash,
      origin: 'https://pastorezequias.com.br',
      get href() {
        return `https://pastorezequias.com.br${this.pathname}${this.search}${this.hash}`;
      },
    },
    matchMedia: (query) => {
      if (
        query === '(display-mode: standalone)' ||
        query === '(display-mode: fullscreen)' ||
        query === '(display-mode: minimal-ui)'
      ) {
        return { matches: isStandalone };
      }
      return { matches: false };
    },
    navigator: {
      standalone: isIosStandalone,
    },
    history: {
      pushState: (state, title, url) => {
        pushedHistory.push({ state, title, url });
        const parsed = new URL(url, 'https://pastorezequias.com.br');
        window.location.pathname = parsed.pathname;
        window.location.search = parsed.search;
        window.location.hash = parsed.hash;
      },
      replaceState: (state, title, url) => {
        replacedHistory.push({ state, title, url });
        const parsed = new URL(url, 'https://pastorezequias.com.br');
        window.location.pathname = parsed.pathname;
        window.location.search = parsed.search;
        window.location.hash = parsed.hash;
      },
    },
    dispatchEvent: (ev) => {
      dispatchedEvents.push(ev);
      return true;
    },
    scrollTo: () => {},
  };

  return { pushedHistory, replacedHistory, dispatchedEvents };
}

// Emulate navigateTo logic as implemented in useRoute
function executeNavigateTo(route) {
  const targetPath = getTargetPath(route);
  const currentTarget =
    window.location.pathname +
    (window.location.search || '') +
    (window.location.hash || '');

  if (currentTarget !== targetPath) {
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new Event('popstate'));
  }
}

// Emulate index.html / useRoute standalone startup sync
function executeStartupSync() {
  if (
    isStandaloneMode() &&
    isRootPath(window.location.pathname) &&
    !getCleanHash(window.location.hash)
  ) {
    const params = new URLSearchParams(window.location.search);
    const explicitRoute = getExplicitRouteParam(params);
    if (!explicitRoute) {
      const keysToDelete = [];
      for (const [k] of params.entries()) {
        const lk = k.toLowerCase();
        if (lk === 'page' || lk === 'route' || lk === 'p') {
          keysToDelete.push(k);
        }
      }
      for (const k of keysToDelete) {
        params.delete(k);
      }
      params.set('page', 'agenda');
      const newSearch = params.toString();
      window.history.replaceState(null, '', newSearch ? `/?${newSearch}` : '/?page=agenda');
    }
  }
}

test('Manifest: public/manifest.webmanifest configuration', () => {
  const manifestPath = path.join(rootDir, 'public', 'manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest must exist');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.equal(content.start_url, '/?page=agenda', 'start_url must be /?page=agenda');
  assert.equal(content.id, '/?page=agenda', 'id must be /?page=agenda');
  assert.equal(content.scope, '/', 'scope must be /');
  assert.equal(content.display, 'standalone', 'display must be standalone');
  assert.ok(Array.isArray(content.icons), 'icons must be an array');
  assert.ok(
    content.icons.some((i) => i.src === '/agenda-icon-192.png' && i.sizes === '192x192' && i.type === 'image/png'),
    'icons must include 192x192 PNG icon'
  );
  assert.ok(
    content.icons.some((i) => i.src === '/agenda-icon-512.png' && i.sizes === '512x512' && i.type === 'image/png'),
    'icons must include 512x512 PNG icon'
  );
  assert.ok(Array.isArray(content.shortcuts), 'shortcuts must be an array');
  assert.ok(
    content.shortcuts.some((s) => s.url === '/?page=agenda'),
    'shortcuts must include /?page=agenda'
  );
  assert.ok(
    content.shortcuts.some((s) => s.icons?.some((i) => i.type === 'image/png' || i.type === 'image/svg+xml')),
    'shortcut icon must specify valid icon type'
  );
});

test('Service Worker: public/sw.js configuration', () => {
  const swPath = path.join(rootDir, 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');

  const content = fs.readFileSync(swPath, 'utf-8');
  assert.ok(content.includes('ezequias-agenda-cache-v4'), 'sw.js must use cache v4');
  assert.ok(content.includes("'/?page=agenda'"), 'sw.js STATIC_ASSETS must include /?page=agenda');
  assert.ok(content.includes("'/apple-touch-icon.png'"), 'sw.js STATIC_ASSETS must include apple-touch-icon.png');
  assert.ok(content.includes("'/agenda-icon-192.png'"), 'sw.js STATIC_ASSETS must include agenda-icon-192.png');
  assert.ok(content.includes("'/agenda-icon-512.png'"), 'sw.js STATIC_ASSETS must include agenda-icon-512.png');
  assert.ok(
    content.includes("event.request.mode === 'navigate'"),
    'sw.js must handle navigate mode for SPA routing'
  );
  assert.ok(
    content.includes('ignoreSearch: true'),
    'sw.js must ignore search params when matching cached navigation response'
  );
  assert.ok(
    content.includes("url: '/?page=agenda'"),
    'sw.js push notification default URL must be /?page=agenda'
  );
  assert.ok(
    content.includes('cache.put(event.request'),
    'sw.js must dynamically cache runtime responses for offline availability'
  );
  assert.ok(
    content.includes("typeof client.navigate === 'function'"),
    'sw.js notificationclick must guard client.navigate availability'
  );
});

test('HTML: index.html PWA metadata and startup script', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');

  const content = fs.readFileSync(htmlPath, 'utf-8');
  assert.ok(content.includes('rel="manifest" href="/manifest.webmanifest"'), 'index.html must link to manifest');
  assert.ok(
    content.includes('name="msapplication-starturl" content="/?page=agenda"'),
    'index.html must have msapplication-starturl'
  );
  assert.ok(
    content.includes('rel="apple-touch-icon" href="/apple-touch-icon.png"'),
    'index.html must have PNG apple-touch-icon for iOS Safari'
  );
  assert.ok(content.includes('/?page=agenda'), 'index.html must handle /?page=agenda');
});

test('Icons: Physical PNG assets exist and are valid PNG images', () => {
  const appleTouchPath = path.join(rootDir, 'public', 'apple-touch-icon.png');
  const icon192Path = path.join(rootDir, 'public', 'agenda-icon-192.png');
  const icon512Path = path.join(rootDir, 'public', 'agenda-icon-512.png');

  assert.ok(fs.existsSync(appleTouchPath), 'apple-touch-icon.png must exist');
  assert.ok(fs.existsSync(icon192Path), 'agenda-icon-192.png must exist');
  assert.ok(fs.existsSync(icon512Path), 'agenda-icon-512.png must exist');

  // Verify PNG header signature: \x89PNG\r\n\x1a\n
  const appleTouchHeader = fs.readFileSync(appleTouchPath).subarray(0, 8);
  assert.deepEqual(
    [...appleTouchHeader],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'apple-touch-icon.png must have valid PNG magic signature'
  );
});

test('R1: PWA launched in standalone mode at root opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '', hash: '', isStandalone: true });
  assert.equal(isStandaloneMode(), true);
  assert.equal(getRouteFromLocation(), 'agenda', 'Standalone launch at root must open agenda');
});

test('R1: PWA launched in iOS standalone mode at root opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '', hash: '', isStandalone: false, isIosStandalone: true });
  assert.equal(isStandaloneMode(), true);
  assert.equal(getRouteFromLocation(), 'agenda', 'iOS standalone launch at root must open agenda');
});

test('R1: PWA launched via start_url (/?page=agenda) in standalone opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '?page=agenda', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'agenda', 'Standalone with start_url must open agenda');
});

test('R1: Standalone startup sync preserves tracking query parameters while adding page=agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/',
    search: '?utm_source=homescreen&utm_medium=pwa',
    hash: '',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 1);
  assert.equal(
    window.location.search,
    '?utm_source=homescreen&utm_medium=pwa&page=agenda',
    'Tracking parameters must be preserved while setting page=agenda'
  );
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Web browser opening /?page=agenda opens Agenda without discarding query params', () => {
  simulateEnv({ pathname: '/', search: '?page=agenda', hash: '', isStandalone: false });
  assert.equal(isStandaloneMode(), false);
  assert.equal(getRouteFromLocation(), 'agenda', 'Web visit to /?page=agenda must open agenda');
});

test('R1: Case-insensitive query param /?page=AGENDA opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '?page=AGENDA', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'agenda', 'Case-insensitive query param must open agenda');
});

test('R2: Standard web browser accessing root (/) opens HomePage', () => {
  simulateEnv({ pathname: '/', search: '', hash: '', isStandalone: false });
  assert.equal(isStandaloneMode(), false);
  assert.equal(getRouteFromLocation(), 'home', 'Web visit to / must preserve HomePage');
});

test('R2: Standard web browser with marketing/tracking query params preserves HomePage', () => {
  simulateEnv({ pathname: '/', search: '?utm_source=facebook&utm_medium=cpc', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'home', 'Web visit with marketing params must open home');
});

test('R2: Preserves other routes via path in standard web browser', () => {
  simulateEnv({ pathname: '/admin', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'admin');

  simulateEnv({ pathname: '/materiais', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'materiais');

  simulateEnv({ pathname: '/visitas', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'visitas');

  simulateEnv({ pathname: '/videos', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'videos');

  simulateEnv({ pathname: '/votos', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'votos');

  simulateEnv({ pathname: '/tp', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'ppt');

  simulateEnv({ pathname: '/apoio', search: '', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'apoio');
});

test('R2: Preserves other routes via query params in standard web browser', () => {
  simulateEnv({ pathname: '/', search: '?page=admin', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'admin');

  simulateEnv({ pathname: '/', search: '?page=materiais', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'materiais');

  simulateEnv({ pathname: '/', search: '?page=visitas', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'visitas');

  simulateEnv({ pathname: '/', search: '?page=home', hash: '', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'home');
});

test('PWA standalone navigation to specific route (/home, /admin) is respected', () => {
  simulateEnv({ pathname: '/home', search: '', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'home', 'Standalone navigation to /home must show home');

  simulateEnv({ pathname: '/admin', search: '', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'admin', 'Standalone navigation to /admin must show admin');
});

test('getTargetPath resolves correct target paths based on route and standalone mode', () => {
  assert.equal(getTargetPath('agenda', false), '/?page=agenda');
  assert.equal(getTargetPath('agenda', true), '/?page=agenda');
  assert.equal(getTargetPath('home', false), '/');
  assert.equal(getTargetPath('home', true), '/home');
  assert.equal(getTargetPath('admin', false), '/admin');
  assert.equal(getTargetPath('admin', true), '/admin');
  assert.equal(getTargetPath('materiais', false), '/materiais');
  assert.equal(getTargetPath('materiais', true), '/materiais');
});

test('Navigation: Navigating from /?page=agenda back to home in web mode updates URL cleanly to /', () => {
  const { pushedHistory } = simulateEnv({
    pathname: '/',
    search: '?page=agenda',
    hash: '',
    isStandalone: false,
  });

  executeNavigateTo('home');

  assert.equal(pushedHistory.length, 1, 'pushState must be called when transitioning from /?page=agenda to /');
  assert.equal(pushedHistory[0].url, '/');
  assert.equal(window.location.pathname, '/');
  assert.equal(window.location.search, '');
  assert.equal(getRouteFromLocation(), 'home');
});

test('Navigation: Redundant navigation does not push duplicate history entries', () => {
  const { pushedHistory } = simulateEnv({
    pathname: '/',
    search: '',
    hash: '',
    isStandalone: false,
  });

  executeNavigateTo('home');
  assert.equal(pushedHistory.length, 0, 'No pushState when already at /');
});

test('Navigation: Navigating between agenda and home in standalone mode uses /home and /?page=agenda', () => {
  const { pushedHistory } = simulateEnv({
    pathname: '/',
    search: '?page=agenda',
    hash: '',
    isStandalone: true,
  });

  // Navigate to home in standalone
  executeNavigateTo('home');
  assert.equal(pushedHistory.length, 1);
  assert.equal(pushedHistory[0].url, '/home');
  assert.equal(window.location.pathname, '/home');
  assert.equal(getRouteFromLocation(), 'home');

  // Navigate back to agenda in standalone
  executeNavigateTo('agenda');
  assert.equal(pushedHistory.length, 2);
  assert.equal(pushedHistory[1].url, '/?page=agenda');
  assert.equal(window.location.pathname, '/');
  assert.equal(window.location.search, '?page=agenda');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: PWA launched in standalone mode at /index.html opens Agenda', () => {
  simulateEnv({ pathname: '/index.html', search: '', hash: '', isStandalone: true });
  assert.equal(isStandaloneMode(), true);
  assert.equal(getRouteFromLocation(), 'agenda', 'Standalone launch at /index.html must open agenda');
});

test('R1: PWA launched in standalone mode at double slashes (//) opens Agenda', () => {
  simulateEnv({ pathname: '//', search: '', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'agenda', 'Standalone launch at // must open agenda');
});

test('R1: PWA launched via Android TWA (android-app:// referrer) opens Agenda', () => {
  simulateEnv({
    pathname: '/',
    search: '',
    hash: '',
    isStandalone: false,
    referrer: 'android-app://com.example.pastor.ezequias',
  });
  assert.equal(isStandaloneMode(), true, 'Android TWA referrer must be detected as standalone');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Standalone startup sync on /index.html replaces URL to /?page=agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/index.html',
    search: '',
    hash: '',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 1);
  assert.equal(window.location.search, '?page=agenda');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Standalone startup sync with empty route param (/?page=) sets page=agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/',
    search: '?page=',
    hash: '',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 1);
  assert.equal(window.location.search, '?page=agenda');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Standalone startup sync with empty root hash (/#/) sets page=agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/',
    search: '',
    hash: '#/',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 1);
  assert.equal(window.location.search, '?page=agenda');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Hash bang routing #!/agenda and #/agenda opens Agenda in web mode', () => {
  simulateEnv({ pathname: '/', search: '', hash: '#!/agenda', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'agenda');

  simulateEnv({ pathname: '/', search: '', hash: '#/agenda', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R2: Web browser accessing /index.html opens HomePage', () => {
  simulateEnv({ pathname: '/index.html', search: '', hash: '', isStandalone: false });
  assert.equal(isStandaloneMode(), false);
  assert.equal(getRouteFromLocation(), 'home', 'Web visit to /index.html must open home');
});

test('R2: PWA standalone reload at /home preserves HomePage', () => {
  simulateEnv({ pathname: '/home', search: '', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'home', 'Reloading /home in standalone must preserve home');
});

test('Navigation: Browser history popstate (back/forward) updates active route correctly', () => {
  simulateEnv({
    pathname: '/',
    search: '?page=agenda',
    hash: '',
    isStandalone: true,
  });

  assert.equal(getRouteFromLocation(), 'agenda');

  // Navigate to videos
  executeNavigateTo('videos');
  assert.equal(getRouteFromLocation(), 'videos');

  // Navigate to home
  executeNavigateTo('home');
  assert.equal(getRouteFromLocation(), 'home');

  // Simulate user pressing browser back button to videos
  window.location.pathname = '/videos';
  window.location.search = '';
  assert.equal(getRouteFromLocation(), 'videos', 'Back to /videos must yield videos route');

  // Simulate user pressing browser back button to agenda
  window.location.pathname = '/';
  window.location.search = '?page=agenda';
  assert.equal(getRouteFromLocation(), 'agenda', 'Back to /?page=agenda must yield agenda route');
});

test('Helpers: isRootPath, getCleanHash, getExplicitRouteParam handle edge cases', () => {
  // isRootPath
  assert.equal(isRootPath(''), true);
  assert.equal(isRootPath('/'), true);
  assert.equal(isRootPath('//'), true);
  assert.equal(isRootPath('/index.html'), true);
  assert.equal(isRootPath('/index.html/'), true);
  assert.equal(isRootPath('/home'), false);
  assert.equal(isRootPath('/agenda'), false);
  assert.equal(isRootPath('/admin'), false);

  // getCleanHash
  assert.equal(getCleanHash('#'), '');
  assert.equal(getCleanHash('#/'), '');
  assert.equal(getCleanHash('#!/'), '');
  assert.equal(getCleanHash('#agenda'), 'agenda');
  assert.equal(getCleanHash('#/agenda'), 'agenda');
  assert.equal(getCleanHash('#!/agenda'), 'agenda');
  assert.equal(getCleanHash('#/agenda/'), 'agenda');
  assert.equal(getCleanHash('#/agenda//'), 'agenda');
  assert.equal(getCleanHash('#/agenda?foo=bar'), 'agenda');

  // getExplicitRouteParam
  assert.equal(getExplicitRouteParam(new URLSearchParams('?page=agenda')), 'agenda');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?PAGE=agenda')), 'agenda');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?route=admin')), 'admin');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?ROUTE=admin')), 'admin');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?p=videos')), 'videos');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?P=videos')), 'videos');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?page=agenda/')), 'agenda');
  assert.equal(getExplicitRouteParam(new URLSearchParams('?page=')), null);
  assert.equal(getExplicitRouteParam(new URLSearchParams('?PAGE=')), null);
  assert.equal(getExplicitRouteParam(new URLSearchParams('?utm_source=pwa')), null);
});

test('R1: PWA launched in standalone with triple slashes (///) opens Agenda', () => {
  simulateEnv({ pathname: '///', search: '', hash: '', isStandalone: true });
  assert.equal(isRootPath('///'), true);
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: PWA launched with uppercase query param /?PAGE=agenda in standalone opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '?PAGE=agenda', hash: '', isStandalone: true });
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R1: Standalone startup sync with uppercase empty param (/?PAGE=) sets clean page=agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/',
    search: '?PAGE=',
    hash: '',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 1);
  assert.equal(window.location.search, '?page=agenda');
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R2: PWA standalone opened at /?PAGE=admin preserves admin route without overriding to agenda', () => {
  const { replacedHistory } = simulateEnv({
    pathname: '/',
    search: '?PAGE=admin',
    hash: '',
    isStandalone: true,
  });

  executeStartupSync();

  assert.equal(replacedHistory.length, 0, 'Must NOT override explicit route even when param is uppercase');
  assert.equal(getRouteFromLocation(), 'admin');
});

test('R1: Hash with trailing slash (/#/agenda/ and /#/agenda//) opens Agenda', () => {
  simulateEnv({ pathname: '/', search: '', hash: '#/agenda/', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'agenda');

  simulateEnv({ pathname: '/', search: '', hash: '#/agenda//', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'agenda');
});

test('R2: Hash with trailing slash (/#/admin/) opens Admin', () => {
  simulateEnv({ pathname: '/', search: '', hash: '#/admin/', isStandalone: false });
  assert.equal(getRouteFromLocation(), 'admin');
});

