import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visita, VisitStatus } from '../../types/visitas';
import { findClosestESMunicipality } from '../../services/visitasService';
import './ESMap.css';

interface ESMapProps {
  visitas: Visita[];
  selectedVisitaId?: number | null;
  onMapClick: (coords: { lat: number; lng: number; suggestedCity: string }) => void;
  onSelectVisita: (visita: Visita) => void;
  onToggleStatus: (visita: Visita) => void;
  onEditVisita: (visita: Visita) => void;
  onDeleteVisita: (id: number) => void;
}

const ES_CENTER: L.LatLngExpression = [-19.65, -40.55];
const ES_DEFAULT_ZOOM = 8;

type TileLayerKey = 'dark' | 'streets' | 'satellite';

const TILE_LAYERS: Record<TileLayerKey, { name: string; url: string; subdomains?: string; attribution: string; maxZoom: number }> = {
  dark: {
    name: 'Escuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  streets: {
    name: 'Ruas',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

/**
 * Gera ícone SVG customizado com halo luminoso e badge colorido
 */
function createCustomPinIcon(status: VisitStatus, isSelected: boolean): L.DivIcon {
  const isVisitado = status === 'visitado';
  const color = isVisitado ? '#10b981' : '#f59e0b';
  const glowClass = isVisitado ? 'pin-glow-green' : 'pin-glow-orange';
  const selectClass = isSelected ? 'pin-selected' : '';

  const html = `
    <div class="custom-marker-wrapper ${glowClass} ${selectClass}">
      <div class="marker-pin" style="background-color: ${color};">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${
            isVisitado
              ? '<polyline points="20 6 9 17 4 12"></polyline>'
              : '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>'
          }
        </svg>
      </div>
      <div class="marker-pulse" style="border-color: ${color};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [36, 46],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
  });
}

export const ESMap: React.FC<ESMapProps> = ({
  visitas,
  selectedVisitaId,
  onMapClick,
  onSelectVisita,
  onToggleStatus,
  onEditVisita,
  onDeleteVisita,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

  const [activeLayer, setActiveLayer] = useState<TileLayerKey>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Inicialização do Mapa Leaflet com movimentação e zoom livres e fluidos
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: ES_CENTER,
      zoom: ES_DEFAULT_ZOOM,
      minZoom: 5,
      maxZoom: 19,
      zoomControl: false, // Usamos controles customizados estilizados
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      wheelDebounceTime: 40,
    });

    // Camada de Mapa Inicial
    const tileConfig = TILE_LAYERS.dark;
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Camada para os marcadores
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Evento de clique no mapa para registrar nova visita
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const closest = findClosestESMunicipality(lat, lng);
      onMapClick({ lat, lng, suggestedCity: closest.name });
    });

    // Garante renderização sem cortes e resposta a redimensionamentos
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  // Atualização dinâmica da camada de tiles (Dark / Ruas / Satélite)
  const handleChangeTileLayer = useCallback((layerKey: TileLayerKey) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = TILE_LAYERS[layerKey];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains || 'abc',
      maxZoom: config.maxZoom,
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
    setActiveLayer(layerKey);
    setShowLayerMenu(false);
  }, []);

  // Controles de Navegação Customizados
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterES = () => {
    mapInstanceRef.current?.flyTo(ES_CENTER, ES_DEFAULT_ZOOM, {
      duration: 1.0,
      easeLinearity: 0.25,
    });
  };

  const handleFitAllVisitas = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (visitas.length === 0) {
      handleCenterES();
      return;
    }

    const bounds = L.latLngBounds(visitas.map((v) => [v.latitude, v.longitude]));
    map.flyToBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
      duration: 1.2,
    });
  };

  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14, { duration: 1.2 });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocalização não disponível:', err);
        setIsLocating(false);
        alert('Não foi possível obter sua localização atual.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Atualização dos Marcadores no Mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersMapRef.current.clear();

    visitas.forEach((v) => {
      const isSelected = v.id === selectedVisitaId;
      const icon = createCustomPinIcon(v.status, isSelected);

      const marker = L.marker([v.latitude, v.longitude], { icon });
      markersMapRef.current.set(v.id, marker);

      // Monta conteúdo do Popup
      const isVisitado = v.status === 'visitado';
      const statusBadge = isVisitado
        ? '<span class="popup-badge badge-green">✓ Visitado</span>'
        : '<span class="popup-badge badge-orange">⏳ A Visitar</span>';

      const cleanPhone = v.phone ? v.phone.replace(/\D/g, '') : '';
      const whatsappLink = cleanPhone
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
            `Olá ${v.contactName}, a paz do Senhor! Sou da equipe do Pastor Ezequias.`
          )}`
        : '';

      const popupContent = document.createElement('div');
      popupContent.className = 'es-map-popup-card';
      popupContent.innerHTML = `
        <div class="popup-header">
          <div class="popup-title-group">
            <h4 class="popup-name">${v.contactName}</h4>
            <span class="popup-city">📍 ${v.city}</span>
          </div>
          ${statusBadge}
        </div>

        ${v.role ? `<div class="popup-role">👔 ${v.role}</div>` : ''}
        ${v.address ? `<div class="popup-address">🏠 ${v.address}</div>` : ''}
        ${v.visitDate ? `<div class="popup-date">📅 ${v.visitDate}</div>` : ''}
        ${v.notes ? `<div class="popup-notes">💬 ${v.notes}</div>` : ''}

        <div class="popup-actions">
          ${
            whatsappLink
              ? `<a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="popup-btn btn-wa">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  WhatsApp
                </a>`
              : ''
          }
          <button class="popup-btn btn-status-toggle" data-action="toggle">
            ${isVisitado ? 'Marcar Pendente' : 'Marcar Visitado'}
          </button>
          <button class="popup-btn btn-edit" data-action="edit" title="Editar">✏️</button>
          <button class="popup-btn btn-delete" data-action="delete" title="Excluir">🗑️</button>
        </div>
      `;

      // Eventos dos botões dentro do popup
      const toggleBtn = popupContent.querySelector('[data-action="toggle"]');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleStatus(v);
          map.closePopup();
        });
      }

      const editBtn = popupContent.querySelector('[data-action="edit"]');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onEditVisita(v);
          map.closePopup();
        });
      }

      const deleteBtn = popupContent.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.confirm(`Deseja remover a visita de ${v.contactName} (${v.city})?`)) {
            onDeleteVisita(v.id);
            map.closePopup();
          }
        });
      }

      marker.bindPopup(popupContent, { maxWidth: 300, className: 'es-leaflet-custom-popup' });

      marker.on('click', () => {
        onSelectVisita(v);
      });

      marker.addTo(layer);
    });
  }, [visitas, selectedVisitaId, onSelectVisita, onToggleStatus, onEditVisita, onDeleteVisita]);

  // Centraliza no marcador e abre o popup quando selecionado externamente
  useEffect(() => {
    if (!selectedVisitaId || !mapInstanceRef.current) return;
    const selected = visitas.find((v) => v.id === selectedVisitaId);
    if (selected) {
      const targetZoom = Math.max(mapInstanceRef.current.getZoom(), 13);
      mapInstanceRef.current.flyTo([selected.latitude, selected.longitude], targetZoom, {
        duration: 1.0,
      });

      const marker = markersMapRef.current.get(selectedVisitaId);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 350);
      }
    }
  }, [selectedVisitaId, visitas]);

  return (
    <div className="es-map-wrapper">
      <div id="es-leaflet-map" ref={mapContainerRef} className="es-leaflet-container" />

      {/* Floating Modern Map Controls */}
      <div className="es-map-floating-controls">
        {/* Zoom Controls */}
        <div className="map-ctrl-group">
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleZoomIn}
            title="Aproximar Zoom (+)"
            aria-label="Aproximar Zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleZoomOut}
            title="Afastar Zoom (-)"
            aria-label="Afastar Zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* View & Bounds Actions */}
        <div className="map-ctrl-group">
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleCenterES}
            title="Centralizar no Espírito Santo"
            aria-label="Centralizar Espírito Santo"
          >
            <span className="ctrl-btn-icon">🗺️</span>
            <span className="ctrl-btn-tooltip">Centralizar ES</span>
          </button>

          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleFitAllVisitas}
            title="Ajustar visualização para todas as visitas"
            aria-label="Ver todas as visitas"
          >
            <span className="ctrl-btn-icon">📍</span>
            <span className="ctrl-btn-tooltip">Ver Todas ({visitas.length})</span>
          </button>

          <button
            type="button"
            className={`map-ctrl-btn ${isLocating ? 'is-loading' : ''}`}
            onClick={handleLocateMe}
            title="Minha Localização Atual"
            aria-label="Minha Localização"
          >
            <span className="ctrl-btn-icon">{isLocating ? '⏳' : '🎯'}</span>
            <span className="ctrl-btn-tooltip">Meu Local</span>
          </button>
        </div>

        {/* Layer Switcher */}
        <div className="map-ctrl-group map-layer-ctrl-wrapper">
          <button
            type="button"
            className={`map-ctrl-btn ${showLayerMenu ? 'active' : ''}`}
            onClick={() => setShowLayerMenu((prev) => !prev)}
            title="Alterar Camada do Mapa"
            aria-label="Alterar Camada"
          >
            <span className="ctrl-btn-icon">🛰️</span>
            <span className="ctrl-btn-tooltip">Camadas</span>
          </button>

          {showLayerMenu && (
            <div className="map-layer-dropdown">
              <div className="layer-dropdown-title">Camadas do Mapa</div>
              {(Object.keys(TILE_LAYERS) as TileLayerKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`layer-option-btn ${activeLayer === key ? 'active' : ''}`}
                  onClick={() => handleChangeTileLayer(key)}
                >
                  <span className="layer-dot"></span>
                  <span>{TILE_LAYERS[key].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Hint */}
      <div className="es-map-hint">
        <span className="hint-icon">💡</span>
        <span>Clique em qualquer local no mapa para adicionar uma visita</span>
      </div>
    </div>
  );
};

