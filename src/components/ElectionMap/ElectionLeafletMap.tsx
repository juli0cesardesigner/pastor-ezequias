import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MunicipioVoto, BairroVoto } from '../../types/election';
import { COLATINA_BAIRROS, COLATINA_TOTAL_VOTOS } from '../../data/colatinaBairros';
import {
  getVoteColorConfig,
  formatVotesBR,
} from '../../utils/electionColors';
import './ElectionLeafletMap.css';

interface ElectionLeafletMapProps {
  municipios: MunicipioVoto[];
  selectedCityName?: string | null;
  onSelectCity: (city: MunicipioVoto) => void;
  selectedBairroName?: string | null;
  onSelectBairro?: (bairro: BairroVoto) => void;
  isColatinaViewActive?: boolean;
}

const ES_CENTER: L.LatLngExpression = [-19.65, -40.55];
const COLATINA_COORDS: L.LatLngExpression = [-19.5392, -40.6308];

const LIDERANCAS_POR_CIDADE: Record<string, string[]> = {
  'Cariacica': ['Gustavo', 'Leide', 'Sula'],
  'Itaguaçu': ['Mário João', 'Pr. Adalto'],
  'Linhares': ['Erika'],
  'Nova Venécia': ['Pr. Flavio'],
  'Pinheiros': ['Ev. Adebio'],
  'Ponto Belo': ['Pr. Elisnelson'],
  'Rio Bananal': ['Douglas', 'Pr. Welington', 'Sidezandes', 'Lucas', 'Sizenandes', 'Pr. Luciano'],
  'São Domingos do Norte': ['Pr. Reginaldo'],
  'São Gabriel da Palha': ['Pr. Brás'],
  'Vila Velha': ['Pedro', 'Pr. Aldemar', 'Pr. Flavio Coelho'],
  'Vitória': ['Pr. Aquilino', 'Pr. Geziel'],
  'São Roque do Canaã': ['Pr. Reuler'],
  'Marilândia': ['Pr. Ariston e Irmã Josiane'],
  'Jaguaré': ['Pr. Elcio'],
  'Serra': ['Eliabe'],
};

type TileLayerKey = 'dark' | 'streets' | 'satellite';

const TILE_LAYERS: Record<
  TileLayerKey,
  { name: string; url: string; subdomains?: string; attribution: string; maxZoom: number }
> = {
  dark: {
    name: '🌙 Escuro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
  },
  streets: {
    name: '🗺️ Ruas',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: '🛰️ Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

/**
 * Marcador padrão de Município
 */
function createElectionMarkerIcon(
  municipio: MunicipioVoto,
  isSelected: boolean
): L.DivIcon {
  const isZero = municipio.votos === 0;
  const colorCfg = getVoteColorConfig(municipio.votos);

  // Todas as bolinhas no modo "estado inteiro" possuem o mesmo tamanho exato (32px)
  const size = 32;
  const radius = 16;
  const isTopCity = municipio.votos >= 500;

  const bg = isZero ? '#334155' : colorCfg.color;
  const glow = isZero ? 'rgba(0, 0, 0, 0.3)' : colorCfg.glowColor;
  const label = isZero ? '0' : formatVotesBR(municipio.votos);
  const pulseClass = isTopCity ? 'has-pulse' : '';
  const fontSize = label.length >= 5 ? '9px' : label.length >= 3 ? '10px' : '11px';
  const textColor = isZero ? '#cbd5e1' : '#ffffff';

  const innerContent = `
    <div 
      class="marker-vote-bubble ${pulseClass}" 
      style="
        width: ${size}px; 
        height: ${size}px; 
        background-color: ${bg}; 
        border: 2px solid #ffffff; 
        font-size: ${fontSize};
        font-weight: 800;
        box-shadow: 0 0 8px ${glow};
        color: ${textColor};
      "
    >
      ${label}
    </div>
  `;

  const selectHalo = isSelected
    ? 'border: 3px solid #38bdf8; border-radius: 50%; box-shadow: 0 0 16px #38bdf8;'
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html: `
      <div class="election-marker-container" style="${selectHalo} width: ${size}px; height: ${size}px;">
        ${innerContent}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [radius, radius],
    popupAnchor: [0, -radius - 6],
  });
}

/**
 * Marcador especial de Bairro de Colatina
 */
function createBairroMarkerIcon(bairro: BairroVoto, isEditMode: boolean = false): L.DivIcon {
  const colorCfg = getVoteColorConfig(bairro.votos);
  const radius = Math.max(12, Math.min(22, Math.round(Math.sqrt(bairro.votos) * 1.05) + 6));
  const size = radius * 2;

  const html = `
    <div class="bairro-marker-wrapper ${isEditMode ? 'is-draggable-mode' : ''}" style="width: ${size + 48}px;">
      <div 
        class="bairro-bubble" 
        style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${colorCfg.color}; 
          box-shadow: 0 0 ${radius}px ${colorCfg.glowColor};
          font-size: ${radius >= 16 ? '11px' : '9px'};
          ${isEditMode ? 'border: 2px dashed #f59e0b; outline: 2px solid rgba(245, 158, 11, 0.6);' : ''}
        "
      >
        ${formatVotesBR(bairro.votos)}
      </div>
      <span class="bairro-name-tag">
        ${isEditMode ? '🖐️ ' : ''}${bairro.nome}
      </span>
    </div>
  `;

  return L.divIcon({
    className: 'bairro-leaflet-marker',
    html,
    iconSize: [size + 48, size + 20],
    iconAnchor: [(size + 48) / 2, radius],
    popupAnchor: [0, -radius - 6],
  });
}

/**
 * HTML do Popup de Município
 */
function generateCityPopupHTML(municipio: MunicipioVoto): string {
  const isZero = municipio.votos === 0;
  const colorCfg = getVoteColorConfig(municipio.votos);

  const isColatina = municipio.nome.toLowerCase() === 'colatina';

  return `
    <div class="city-popup-card">
      <div class="city-popup-header">
        <h4 class="city-popup-title">${municipio.nome}</h4>
        <span class="city-popup-sub">📍 Região ${municipio.region}</span>
      </div>

      <div class="city-popup-stats">
        <div class="city-popup-main-stat">
          <span 
            class="city-popup-votes-number" 
            style="color: ${isZero ? '#94a3b8' : colorCfg.textColor};"
          >
            ${formatVotesBR(municipio.votos)}
          </span>
          <span class="city-popup-votes-label">
            ${municipio.votos === 1 ? 'voto' : 'votos nominais'}
          </span>
        </div>

        <div class="city-popup-row">
          <span>% dos Votos Válidos:</span>
          <strong>${isZero ? '0,00%' : `${municipio.pvap}%`}</strong>
        </div>

        ${
          municipio.rankingMun > 0
            ? `
          <div class="city-popup-row">
            <span>Posição no Município:</span>
            <strong>#${municipio.rankingMun}º lugar</strong>
          </div>
        `
            : ''
        }

        ${
          isColatina
            ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15); font-size: 0.73rem; color: #f59e0b; text-align: center; font-weight: 600;">
            🔍 Aproxime o zoom para ver a distribuição por bairros!
          </div>
        `
            : ''
        }
        
        ${
          LIDERANCAS_POR_CIDADE[municipio.nome]
            ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15);">
            <div style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 4px;">🤝 Lideranças / Contatos:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${LIDERANCAS_POR_CIDADE[municipio.nome].map(nome => `<span style="background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${nome}</span>`).join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * HTML do Popup de Bairro de Colatina
 */
function generateBairroPopupHTML(bairro: BairroVoto): string {
  const colorCfg = getVoteColorConfig(bairro.votos);
  const secoesText = bairro.secoesCount
    ? `${bairro.secoesCount} ${bairro.secoesCount === 1 ? 'seção eleitoral' : 'seções eleitorais'}`
    : '';

  return `
    <div class="city-popup-card">
      <div class="city-popup-header">
        <h4 class="city-popup-title">${bairro.nome}</h4>
        <span class="city-popup-bairro-tag">🏘️ Bairro/Distrito de Colatina • ES</span>
      </div>

      <div class="city-popup-stats">
        <div class="city-popup-main-stat">
          <span class="city-popup-votes-number" style="color: ${colorCfg.textColor};">
            ${formatVotesBR(bairro.votos)}
          </span>
          <span class="city-popup-votes-label">${bairro.votos === 1 ? 'voto nominal' : 'votos nominais'}</span>
        </div>

        <div class="city-popup-row">
          <span>Participação em Colatina:</span>
          <strong>${bairro.percentualCidade}%</strong>
        </div>

        ${
          secoesText
            ? `
          <div class="city-popup-row">
            <span>Urnas / Seções:</span>
            <strong>${secoesText}</strong>
          </div>
        `
            : ''
        }

        <div class="city-popup-row">
          <span>Total de Colatina:</span>
          <strong>${formatVotesBR(COLATINA_TOTAL_VOTOS)} votos</strong>
        </div>

        ${
          bairro.principaisLocais && bairro.principaisLocais.length > 0
            ? `
          <div class="city-popup-locais">
            <span class="locais-label">🏫 Locais de Votação:</span>
            <span>${bairro.principaisLocais.join(' • ')}</span>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

const LOCAL_STORAGE_COORDS_KEY = 'colatina_bairros_coords_override';

function loadInitialBairros(): BairroVoto[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_COORDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar coordenadas salvas de Colatina:', err);
  }
  return COLATINA_BAIRROS;
}

function generateTSFileContent(list: BairroVoto[]): string {
  return `import type { BairroVoto } from '../types/election';

export const COLATINA_TOTAL_VOTOS = ${COLATINA_TOTAL_VOTOS};

/**
 * Distribuição oficial e auditada dos 2.026 votos do Pastor Ezequias (Nº 15333)
 * em Colatina - ES (Eleições 2026).
 * Coordenadas ajustadas e validadas interativamente no mapa.
 */
export const COLATINA_BAIRROS: BairroVoto[] = ${JSON.stringify(list, null, 2)};
`;
}

export const ElectionLeafletMap: React.FC<ElectionLeafletMapProps> = ({
  municipios,
  selectedCityName,
  onSelectCity,
  selectedBairroName,
  onSelectBairro,
  isColatinaViewActive,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const municipalMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const bairrosMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const bairrosMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<TileLayerKey>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isColatinaZoomed, setIsColatinaZoomed] = useState(false);

  // Estados do Modo Edição
  // Estados do Modo Edição (Oculto por padrão, ativado via Ctrl+Shift+E ou triplo clique no selo COLATINA ou ?edit=1)
  const [bairrosList, setBairrosList] = useState<BairroVoto[]>(loadInitialBairros);
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const q = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return q.includes('edit=1') || q.includes('edit=true') || h.includes('edit');
    }
    return false;
  });
  const [lastMoved, setLastMoved] = useState<{ nome: string; lat: number; lng: number } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSavingDisk, setIsSavingDisk] = useState<boolean>(false);

  // Triple-click secreto no selo "COLATINA" do banner
  const secretClickCountRef = useRef<number>(0);
  const secretClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretBadgeClick = () => {
    secretClickCountRef.current += 1;
    if (secretClickTimerRef.current) {
      clearTimeout(secretClickTimerRef.current);
    }
    if (secretClickCountRef.current >= 3) {
      secretClickCountRef.current = 0;
      handleToggleEditMode();
      return;
    }
    secretClickTimerRef.current = setTimeout(() => {
      secretClickCountRef.current = 0;
    }, 1200);
  };

  const triggerFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  // Atalho de teclado secreto: Ctrl + Shift + E para abrir/fechar, e Esc para sair
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        handleToggleEditMode();
      }
      if (e.key === 'Escape' && isEditMode) {
        setIsEditMode(false);
        triggerFeedback('Modo Edição finalizado.', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode]);

  // Fechar menu de camadas se clicar fora
  useEffect(() => {
    if (!showLayerMenu) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-group')) {
        setShowLayerMenu(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [showLayerMenu]);

  // Inicialização do Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialZoom = window.innerWidth <= 860 ? 7.3 : 8;

    const map = L.map(mapContainerRef.current, {
      center: ES_CENTER,
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 20,
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      wheelDebounceTime: 40,
    });

    // Camada inicial Ruas (streets)
    const tileConfig = TILE_LAYERS.streets;
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abcd',
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);

    tileLayer.bringToBack();
    currentTileLayerRef.current = tileLayer;

    // LayerGroups
    const municipalLayer = L.layerGroup().addTo(map);
    const bairrosLayer = L.layerGroup().addTo(map);
    municipalMarkersLayerRef.current = municipalLayer;
    bairrosMarkersLayerRef.current = bairrosLayer;
    mapInstanceRef.current = map;

    // Listener de zoom e movimento para detectar foco em Colatina (expande apenas com zoom bem próximo)
    const checkColatinaFocus = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      // Distância em graus até o centro de Colatina (-19.5392, -40.6308)
      // Reduzido para 0.08 para não pegar cidades vizinhas (Marilândia fica a ~0.15, São Roque a ~0.21)
      const dist = Math.hypot(center.lat - (-19.5392), center.lng - (-40.6308));
      const shouldShowBairros = zoom >= 13 && dist < 0.08;
      setIsColatinaZoomed(shouldShowBairros);
    };

    map.on('zoomend moveend', checkColatinaFocus);

    // ResizeObserver para manter dimensões fluidas no mobile
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      map.off('zoomend moveend', checkColatinaFocus);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Troca de Camadas (Dark / Satélite / Ruas)
  const handleChangeLayer = useCallback((key: TileLayerKey) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = TILE_LAYERS[key];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains || 'abcd',
      maxZoom: config.maxZoom,
    });

    newLayer.addTo(map);
    newLayer.bringToBack();

    currentTileLayerRef.current = newLayer;
    setActiveLayer(key);
    setShowLayerMenu(false);
  }, []);

  // Ações de Zoom e Centralização
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleCenterES = () => {
    const zoom = window.innerWidth <= 860 ? 7.3 : 8;
    mapInstanceRef.current?.flyTo(ES_CENTER, zoom, { duration: 1.0 });
  };

  const handleFlyToColatinaBairros = () => {
    mapInstanceRef.current?.flyTo(COLATINA_COORDS, 13.5, { duration: 1.2 });
  };

  const handleToggleEditMode = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (next) {
        triggerFeedback('🛠️ Modo Edição ativado! (Atalho: Ctrl+Shift+E ou Esc para sair)', 'info');
      } else {
        triggerFeedback('Modo Edição finalizado. Suas posições estão salvas!', 'success');
      }
      return next;
    });
  };

  // Salvar no disco via endpoint do vite
  const handleSaveToDisk = async () => {
    setIsSavingDisk(true);
    try {
      const content = generateTSFileContent(bairrosList);
      const res = await fetch('/api/save-bairros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        triggerFeedback('Salvo com sucesso em src/data/colatinaBairros.ts!', 'success');
      } else {
        triggerFeedback('Erro ao salvar no arquivo: ' + (data.error || 'Falha'), 'error');
      }
    } catch {
      handleDownloadUpdatedTS();
      triggerFeedback('Arquivo TS baixado! Salve em src/data/colatinaBairros.ts', 'info');
    } finally {
      setIsSavingDisk(false);
    }
  };

  // Baixar arquivo colatinaBairros.ts
  const handleDownloadUpdatedTS = () => {
    const content = generateTSFileContent(bairrosList);
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'colatinaBairros.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerFeedback('Arquivo colatinaBairros.ts baixado!', 'success');
  };

  // Copiar código TS
  const handleCopyTS = async () => {
    const content = generateTSFileContent(bairrosList);
    try {
      await navigator.clipboard.writeText(content);
      triggerFeedback('Código TypeScript copiado para a área de transferência!', 'success');
    } catch {
      triggerFeedback('Não foi possível copiar automaticamente.', 'error');
    }
  };

  // Resetar coordenadas
  const handleResetCoords = () => {
    if (window.confirm('Deseja restaurar as coordenadas padrão dos 47 bairros de Colatina?')) {
      localStorage.removeItem(LOCAL_STORAGE_COORDS_KEY);
      setBairrosList(COLATINA_BAIRROS);
      setLastMoved(null);
      triggerFeedback('Coordenadas restauradas para o padrão inicial.', 'info');
    }
  };

  // Renderização e Atualização dos Marcadores no Mapa
  useEffect(() => {
    const munLayer = municipalMarkersLayerRef.current;
    const bairrosLayer = bairrosMarkersLayerRef.current;
    if (!munLayer || !bairrosLayer) return;

    munLayer.clearLayers();
    bairrosLayer.clearLayers();
    markersMapRef.current.clear();
    bairrosMarkersMapRef.current.clear();

    // 1. Marcadores Municipais
    municipios.forEach((m) => {
      const isColatina = m.nome.toLowerCase() === 'colatina';

      // Se estamos em modo detalhado de Colatina ou em Modo Edição, oculta a bolha única municipal de Colatina
      if (isColatina && (isColatinaZoomed || isEditMode)) {
        return;
      }

      const isSelected = selectedCityName === m.nome;
      const icon = createElectionMarkerIcon(m, isSelected);
      const marker = L.marker([m.lat, m.lng], { icon });

      marker.bindPopup(generateCityPopupHTML(m), {
        maxWidth: 280,
        className: 'city-leaflet-popup',
      });

      marker.on('click', () => {
        onSelectCity(m);
        if (isColatina) {
          mapInstanceRef.current?.flyTo(COLATINA_COORDS, 13.5, { duration: 1.2 });
        }
      });

      marker.addTo(munLayer);
      markersMapRef.current.set(m.nome, marker);
    });

    // 2. Marcadores dos Bairros de Colatina (quando aproximado OU em modo edição)
    if (isColatinaZoomed || isEditMode) {
      bairrosList.forEach((bairro) => {
        const icon = createBairroMarkerIcon(bairro, isEditMode);
        const marker = L.marker([bairro.lat, bairro.lng], {
          icon,
          draggable: isEditMode,
          autoPan: isEditMode,
        });

        if (isEditMode) {
          marker.on('dragstart', () => {
            marker.closePopup();
          });

          marker.on('dragend', (e) => {
            const markerTarget = e.target as L.Marker;
            const newLatLng = markerTarget.getLatLng();
            const roundedLat = parseFloat(newLatLng.lat.toFixed(6));
            const roundedLng = parseFloat(newLatLng.lng.toFixed(6));

            setBairrosList((prev) => {
              const updated = prev.map((item) =>
                item.nome === bairro.nome
                  ? { ...item, lat: roundedLat, lng: roundedLng }
                  : item
              );
              try {
                localStorage.setItem(LOCAL_STORAGE_COORDS_KEY, JSON.stringify(updated));
              } catch (err) {
                console.warn('Erro ao salvar no localStorage:', err);
              }
              return updated;
            });

            setLastMoved({
              nome: bairro.nome,
              lat: roundedLat,
              lng: roundedLng,
            });
          });
        } else {
          marker.bindPopup(generateBairroPopupHTML(bairro), {
            maxWidth: 290,
            className: 'city-leaflet-popup',
          });

          marker.on('click', () => {
            if (onSelectBairro) {
              onSelectBairro(bairro);
            }
          });
        }

        bairrosMarkersMapRef.current.set(bairro.nome.toLowerCase(), marker);
        marker.addTo(bairrosLayer);
      });
    }
  }, [municipios, selectedCityName, isColatinaZoomed, isEditMode, bairrosList, onSelectCity, onSelectBairro]);

  // Ativa automaticamente visão focada em Colatina se o filtro de bairros estiver ativo
  useEffect(() => {
    if (isColatinaViewActive && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(COLATINA_COORDS, 13, { duration: 1.0 });
      setIsColatinaZoomed(true);
    }
  }, [isColatinaViewActive]);

  // Sincroniza seleção externa de bairro (ex: clicou no card de bairro no drawer)
  useEffect(() => {
    if (!selectedBairroName || !mapInstanceRef.current) return;
    const match = bairrosList.find(
      (b) => b.nome.toLowerCase() === selectedBairroName.toLowerCase()
    );
    if (!match) return;

    mapInstanceRef.current.flyTo([match.lat, match.lng], 15, {
      duration: 1.0,
    });

    const marker = bairrosMarkersMapRef.current.get(match.nome.toLowerCase());
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  }, [selectedBairroName, bairrosList]);

  // Sincroniza seleção externa de cidade (ex: clicou no card de município no drawer)
  useEffect(() => {
    if (!selectedCityName || !mapInstanceRef.current) return;
    const match = municipios.find((m) => m.nome === selectedCityName);
    if (!match) return;

    const isColatina = match.nome.toLowerCase() === 'colatina';
    const targetZoom = isColatina ? 13.5 : Math.max(mapInstanceRef.current.getZoom(), 11);

    mapInstanceRef.current.flyTo([match.lat, match.lng], targetZoom, {
      duration: 1.0,
    });

    if (!isColatina) {
      const marker = markersMapRef.current.get(selectedCityName);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 350);
      }
    }
  }, [selectedCityName, municipios]);

  return (
    <div className="election-map-canvas-wrapper">
      <div ref={mapContainerRef} className="election-leaflet-element" />

      {/* Banner Informativo quando em Modo Bairros de Colatina ou Modo Edição */}
      {(isColatinaZoomed || isEditMode) && (
        <div className={`colatina-bairros-banner ${isEditMode ? 'banner-edit-active' : ''}`}>
          <span
            className="banner-badge-colatina"
            onClick={handleSecretBadgeClick}
            title={isEditMode ? 'Modo Edição Ativo (clique 3x para alternar)' : 'Colatina'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {isEditMode ? '🛠️ EDIÇÃO' : 'COLATINA'}
          </span>
          <span className="banner-text-info">
            {isEditMode ? (
              <>Modo Edição Secreto: <strong>Arraste os pontos</strong> para ajustar</>
            ) : (
              <>Votos em <strong>{bairrosList.length} bairros e localidades</strong> ({formatVotesBR(COLATINA_TOTAL_VOTOS)} total)</>
            )}
          </span>
          <div className="banner-btn-group">
            {isEditMode ? (
              <button
                type="button"
                className="btn-banner-edit-toggle active"
                onClick={handleToggleEditMode}
                title="Sair do Modo Edição (Ctrl+Shift+E ou Esc)"
              >
                ✅ Concluir
              </button>
            ) : (
              <button
                type="button"
                className="btn-banner-reset-zoom"
                onClick={handleCenterES}
                title="Afastar para ver o estado inteiro"
              >
                ↩️ Ver Estado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dock Inferior do Modo Edição */}
      {isEditMode && (
        <div className="map-edit-mode-dock">
          <div className="edit-dock-header">
            <div className="edit-dock-title-row">
              <span className="edit-dock-badge">MODO EDIÇÃO ATIVO</span>
              <span className="edit-dock-hint">
                🖐️ Arraste qualquer ponto no mapa para reposicionar. Atalho: <strong>Ctrl + Shift + E</strong> (ou Esc para sair).
              </span>
            </div>
            {lastMoved ? (
              <div className="edit-dock-status">
                <span className="status-pin">📍</span>
                <span className="status-name">{lastMoved.nome}</span>
                <span className="status-coords">
                  [{lastMoved.lat.toFixed(6)}, {lastMoved.lng.toFixed(6)}]
                </span>
                <span className="status-saved">Salvo no navegador ✓</span>
              </div>
            ) : (
              <div className="edit-dock-status is-idle">
                💡 Clique e arraste qualquer ponto no mapa para mudar sua localização.
              </div>
            )}
          </div>

          <div className="edit-dock-actions">
            <button
              type="button"
              className="btn-edit-action primary"
              onClick={handleSaveToDisk}
              disabled={isSavingDisk}
              title="Salvar alterações diretamente no arquivo src/data/colatinaBairros.ts"
            >
              {isSavingDisk ? '⏳ Salvando...' : '💾 Salvar no Código'}
            </button>

            <button
              type="button"
              className="btn-edit-action secondary"
              onClick={handleDownloadUpdatedTS}
              title="Baixar arquivo colatinaBairros.ts atualizado"
            >
              📥 Baixar TS
            </button>

            <button
              type="button"
              className="btn-edit-action secondary"
              onClick={handleCopyTS}
              title="Copiar código TypeScript com todas as coordenadas atualizadas"
            >
              📋 Copiar Código
            </button>

            <button
              type="button"
              className="btn-edit-action warning"
              onClick={handleResetCoords}
              title="Restaurar coordenadas padrão originais"
            >
              🔄 Restaurar Padrão
            </button>

            <button
              type="button"
              className="btn-edit-action success"
              onClick={handleToggleEditMode}
              title="Fechar modo de edição"
            >
              ✅ Concluir
            </button>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`map-feedback-toast toast-${feedbackMsg.type}`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Floating Controls */}
      <div className="map-floating-panel">
        <div className="map-control-btn-group">
          <button
            type="button"
            className="map-action-btn"
            onClick={handleZoomIn}
            title="Aproximar (+)"
          >
            +
          </button>
          <button
            type="button"
            className="map-action-btn"
            onClick={handleZoomOut}
            title="Afastar (-)"
          >
            −
          </button>
        </div>

        <div className="map-control-btn-group">
          <button
            type="button"
            className="map-action-btn"
            onClick={handleCenterES}
            title="Centralizar no Espírito Santo"
          >
            🗺️
          </button>
          <button
            type="button"
            className={`map-action-btn ${isColatinaZoomed ? 'active' : ''}`}
            onClick={handleFlyToColatinaBairros}
            title="Aproximar nos bairros de Colatina (2.026 votos)"
          >
            ⭐
          </button>
          {/* O botão ✏️ só aparece quando o modo edição secreto já estiver ativo */}
          {isEditMode && (
            <button
              type="button"
              className="map-action-btn active"
              onClick={handleToggleEditMode}
              title="Sair do Modo Edição (Ctrl+Shift+E ou Esc)"
            >
              ✏️
            </button>
          )}
        </div>

        <div className="map-control-btn-group dropdown-group" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`map-action-btn ${showLayerMenu ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowLayerMenu((prev) => !prev);
            }}
            title="Alterar camada visual (Escuro / Ruas / Satélite)"
          >
            🛰️
          </button>

          {showLayerMenu && (
            <div className="map-layers-menu">
              {(Object.keys(TILE_LAYERS) as TileLayerKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`map-layer-opt ${activeLayer === k ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeLayer(k);
                  }}
                >
                  {TILE_LAYERS[k].name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

