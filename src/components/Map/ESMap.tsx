import React, { useEffect, useRef } from 'react';
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

// Limites geográficos estritos do Espírito Santo (com margem de segurança suave)
const ES_BOUNDS: L.LatLngBoundsExpression = [
  [-21.45, -42.0], // Sudoeste
  [-17.8, -39.5],  // Nordeste
];

const ES_CENTER: L.LatLngExpression = [-19.65, -40.55];

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

  // Inicialização do Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: ES_CENTER,
      zoom: 8,
      minZoom: 7,
      maxZoom: 17,
      maxBounds: ES_BOUNDS,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
    });

    // Controle de Zoom posicionado no canto superior direito
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Camada de Mapa Moderna (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Camada para os marcadores
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Evento de clique no mapa para pinar visita
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const closest = findClosestESMunicipality(lat, lng);
      onMapClick({ lat, lng, suggestedCity: closest.name });
    });

    // Garante renderização fluida e carregamento total de tiles
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  // Atualização dos Marcadores no Mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    visitas.forEach((v) => {
      const isSelected = v.id === selectedVisitaId;
      const icon = createCustomPinIcon(v.status, isSelected);

      const marker = L.marker([v.latitude, v.longitude], { icon });

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

  // Centraliza no marcador quando selecionado externamente
  useEffect(() => {
    if (!selectedVisitaId || !mapInstanceRef.current) return;
    const selected = visitas.find((v) => v.id === selectedVisitaId);
    if (selected) {
      mapInstanceRef.current.flyTo([selected.latitude, selected.longitude], 13, {
        duration: 1.2,
      });
    }
  }, [selectedVisitaId, visitas]);

  return (
    <div className="es-map-wrapper">
      <div id="es-leaflet-map" ref={mapContainerRef} className="es-leaflet-container" />
      <div className="es-map-hint">
        <span className="hint-icon">💡</span>
        <span>Clique em qualquer lugar no mapa do ES para pinar uma nova visita</span>
      </div>
    </div>
  );
};
