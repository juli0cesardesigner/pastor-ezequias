import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Visita, VisitaInput, VisitasFilter } from '../../types/visitas';
import {
  fetchAllVisitas,
  createVisita,
  createBatchVisitas,
  updateVisita,
  toggleVisitaStatus,
  deleteVisita,
  getLocalVisitasCache,
} from '../../services/visitasService';
import { ESMap } from '../../components/Map/ESMap';
import { VisitModal } from '../../components/Visitas/VisitModal';
import { BatchVisitModal } from '../../components/Visitas/BatchVisitModal';
import { VisitCard } from '../../components/Visitas/VisitCard';
import './VisitasMapPage.css';

export const VisitasMapPage: React.FC = () => {
  const [visitas, setVisitas] = useState<Visita[]>(getLocalVisitasCache);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<VisitasFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitaId, setSelectedVisitaId] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'mapa' | 'lista'>('mapa');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState<Visita | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
    suggestedCity: string;
  } | null>(null);

  // Carrega visitas do Neon DB
  const loadVisitas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllVisitas();
      setVisitas(data);
    } catch (err) {
      console.error('Erro ao carregar visitas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitas();
  }, [loadVisitas]);

  // Garante recálculo das dimensões do mapa ao alternar abas no mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timer);
  }, [mobileTab]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = visitas.length;
    const visitados = visitas.filter((v) => v.status === 'visitado').length;
    const pendentes = total - visitados;
    const percentVisitados = total > 0 ? Math.round((visitados / total) * 100) : 0;
    const uniqueCities = new Set(visitas.map((v) => v.city.trim().toLowerCase())).size;

    return {
      total,
      visitados,
      pendentes,
      percentVisitados,
      uniqueCities,
    };
  }, [visitas]);

  // Lista filtrada
  const filteredVisitas = useMemo(() => {
    return visitas.filter((v) => {
      if (filter === 'visitado' && v.status !== 'visitado') return false;
      if (filter === 'pendente' && v.status !== 'pendente') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = v.contactName.toLowerCase().includes(query);
        const matchCity = v.city.toLowerCase().includes(query);
        const matchRole = v.role ? v.role.toLowerCase().includes(query) : false;
        const matchAddress = v.address ? v.address.toLowerCase().includes(query) : false;
        const matchPhone = v.phone ? v.phone.includes(query) : false;

        return matchName || matchCity || matchRole || matchAddress || matchPhone;
      }

      return true;
    });
  }, [visitas, filter, searchTerm]);

  // Handlers
  const handleOpenNewModal = () => {
    setEditingVisita(null);
    setClickedCoords(null);
    setIsModalOpen(true);
  };

  const handleMapClick = (coords: { lat: number; lng: number; suggestedCity: string }) => {
    setEditingVisita(null);
    setClickedCoords(coords);
    setIsModalOpen(true);
  };

  const handleEditVisita = (visita: Visita) => {
    setClickedCoords(null);
    setEditingVisita(visita);
    setIsModalOpen(true);
  };

  const handleSaveVisita = async (data: VisitaInput, editId?: number) => {
    if (editId) {
      await updateVisita(editId, data);
      setVisitas((prev) =>
        prev.map((v) => (v.id === editId ? { ...v, ...data, updatedAt: new Date().toISOString() } : v))
      );
    } else {
      const created = await createVisita(data);
      setVisitas((prev) => [created, ...prev]);
      setSelectedVisitaId(created.id);
    }
  };

  const handleSaveBatchVisitas = async (inputs: VisitaInput[]) => {
    const createdList = await createBatchVisitas(inputs);
    setVisitas((prev) => [...createdList, ...prev]);
    if (createdList.length > 0) {
      setSelectedVisitaId(createdList[0].id);
    }
  };

  const handleToggleStatus = async (visita: Visita) => {
    const nextStatus = await toggleVisitaStatus(visita.id, visita.status);
    setVisitas((prev) =>
      prev.map((v) => (v.id === visita.id ? { ...v, status: nextStatus } : v))
    );
  };

  const handleDeleteVisita = async (id: number) => {
    await deleteVisita(id);
    setVisitas((prev) => prev.filter((v) => v.id !== id));
    if (selectedVisitaId === id) {
      setSelectedVisitaId(null);
    }
  };

  const handleSelectFromList = (visita: Visita) => {
    setSelectedVisitaId(visita.id);
    // Em mobile, ao clicar em um card da lista, muda automaticamente para o mapa para ver o pino
    if (window.innerWidth <= 860) {
      setMobileTab('mapa');
    }
  };

  return (
    <div className="visitas-app-wrapper">
      {/* Compact Top Navigation Bar */}
      <header className="visitas-compact-navbar">
        <div className="navbar-left">
          <div className="navbar-brand">
            <span className="brand-dot"></span>
            <h1 className="navbar-title">Mapa de Visitas ES</h1>
          </div>

          {/* Inline Summary Stats Pill */}
          <div className="stats-inline-strip">
            <span className="stat-pill pill-total" title="Total cadastrado">
              📋 <strong>{stats.total}</strong>
            </span>
            <span className="stat-pill pill-green" title="Visitas concluídas">
              🟢 <strong>{stats.visitados}</strong>
            </span>
            <span className="stat-pill pill-orange" title="Visitas pendentes">
              🟠 <strong>{stats.pendentes}</strong>
            </span>
            <span className="stat-pill pill-blue" title="Cidades alcançadas no ES">
              📍 <strong>{stats.uniqueCities}/78</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="navbar-right">
          {/* Mobile View Switcher */}
          <div className="mobile-view-tabs">
            <button
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'mapa' ? 'active' : ''}`}
              onClick={() => setMobileTab('mapa')}
            >
              🗺️ Mapa
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'lista' ? 'active' : ''}`}
              onClick={() => setMobileTab('lista')}
            >
              📋 Lista ({visitas.length})
            </button>
          </div>

          <button
            type="button"
            className="nav-action-btn btn-subtle btn-batch-action"
            onClick={() => setIsBatchModalOpen(true)}
            title="Importar e cadastrar visitas em lote"
          >
            📦 <span className="btn-text-desktop">Em Lote</span>
          </button>

          <button className="nav-action-btn btn-add-visita" onClick={handleOpenNewModal}>
            + <span className="btn-text-desktop">Nova Visita</span>
          </button>
        </div>
      </header>

      {/* Main Full-Area Workspace */}
      <div className={`visitas-workspace ${mobileTab === 'lista' ? 'show-mobile-list' : 'show-mobile-map'}`}>
        {/* Left / Drawer Sidebar for Visitas List */}
        <aside className="visitas-sidebar-pane">
          {/* Search & Filter Header */}
          <div className="sidebar-filter-header">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-field"
                placeholder="Buscar contato, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-chips-row">
              <button
                type="button"
                className={`filter-chip ${filter === 'todos' ? 'active' : ''}`}
                onClick={() => setFilter('todos')}
              >
                Todos ({visitas.length})
              </button>
              <button
                type="button"
                className={`filter-chip chip-orange ${filter === 'pendente' ? 'active' : ''}`}
                onClick={() => setFilter('pendente')}
              >
                🟠 A Visitar ({stats.pendentes})
              </button>
              <button
                type="button"
                className={`filter-chip chip-green ${filter === 'visitado' ? 'active' : ''}`}
                onClick={() => setFilter('visitado')}
              >
                🟢 Visitados ({stats.visitados})
              </button>
            </div>
          </div>

          {/* Scrollable Card List */}
          <div className="visitas-scroll-list">
            {isLoading && visitas.length === 0 ? (
              <div className="list-status-box">
                <div className="mini-spinner"></div>
                <span>Sincronizando com Neon DB...</span>
              </div>
            ) : filteredVisitas.length === 0 ? (
              <div className="list-status-box">
                <span className="status-icon">📍</span>
                <p>
                  {searchTerm
                    ? 'Nenhum resultado para a busca.'
                    : 'Nenhuma visita cadastrada ainda.'}
                </p>
                <button type="button" className="btn-add-inline" onClick={handleOpenNewModal}>
                  + Cadastrar Visita
                </button>
              </div>
            ) : (
              filteredVisitas.map((visita) => (
                <VisitCard
                  key={visita.id}
                  visita={visita}
                  isSelected={visita.id === selectedVisitaId}
                  onSelect={handleSelectFromList}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEditVisita}
                  onDelete={handleDeleteVisita}
                />
              ))
            )}
          </div>
        </aside>

        {/* Map View Canvas */}
        <section className="visitas-map-pane">
          {/* Quick Floating Filter Bar on Top of Map */}
          <div className="map-floating-quick-filters">
            <button
              type="button"
              className={`map-filter-pill ${filter === 'todos' ? 'active' : ''}`}
              onClick={() => setFilter('todos')}
            >
              Todos ({visitas.length})
            </button>
            <button
              type="button"
              className={`map-filter-pill pill-orange ${filter === 'pendente' ? 'active' : ''}`}
              onClick={() => setFilter('pendente')}
            >
              🟠 A Visitar ({stats.pendentes})
            </button>
            <button
              type="button"
              className={`map-filter-pill pill-green ${filter === 'visitado' ? 'active' : ''}`}
              onClick={() => setFilter('visitado')}
            >
              🟢 Visitados ({stats.visitados})
            </button>
          </div>

          <ESMap
            visitas={filteredVisitas}
            selectedVisitaId={selectedVisitaId}
            onMapClick={handleMapClick}
            onSelectVisita={(v) => setSelectedVisitaId(v.id)}
            onToggleStatus={handleToggleStatus}
            onEditVisita={handleEditVisita}
            onDeleteVisita={handleDeleteVisita}
          />
        </section>
      </div>

      {/* Modal de Cadastro / Edição Individual */}
      <VisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVisita}
        initialData={editingVisita}
        clickedCoords={clickedCoords}
      />

      {/* Modal de Importação em Lote */}
      <BatchVisitModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveBatch={handleSaveBatchVisitas}
      />
    </div>
  );
};
