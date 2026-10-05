import React, { useState, useMemo } from 'react';
import type { MunicipioVoto, BairroVoto, ElectionFilter, MobileTab } from '../../types/election';
import { getElectionData, filterMunicipalities } from '../../services/electionService';
import { COLATINA_BAIRROS, COLATINA_TOTAL_VOTOS } from '../../data/colatinaBairros';
import { ElectionNavbar } from '../../components/ElectionMap/ElectionNavbar';
import { ElectionDrawer } from '../../components/ElectionMap/ElectionDrawer';
import { ElectionLeafletMap } from '../../components/ElectionMap/ElectionLeafletMap';
import './ElectionMapPage.css';

interface ElectionMapPageProps {
  onBackToHome?: () => void;
}

export const ElectionMapPage: React.FC<ElectionMapPageProps> = () => {
  // Carrega diretamente os dados consolidados já extraídos da eleição (sem chamadas à API em tempo real)
  const electionData = useMemo(() => getElectionData(), []);

  // Estado dos Filtros e Seleções
  const [filter, setFilter] = useState<ElectionFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [selectedBairroName, setSelectedBairroName] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('mapa');

  // Municípios filtrados para o mapa e drawer
  const filteredMunicipios = useMemo(() => {
    return filterMunicipalities(electionData.municipios, filter, searchTerm);
  }, [electionData.municipios, filter, searchTerm]);

  // Handler de seleção de município
  const handleSelectCity = (city: MunicipioVoto) => {
    setSelectedCityName(city.nome);
    setSelectedBairroName(null);
    // Se estiver no mobile na aba de lista/ranking, muda para o mapa para focar na cidade
    if (window.innerWidth <= 860) {
      setMobileTab('mapa');
    }
  };

  // Handler de seleção de bairro de Colatina
  const handleSelectBairro = (bairro: BairroVoto) => {
    setSelectedBairroName(bairro.nome);
    setSelectedCityName('Colatina');
    if (window.innerWidth <= 860) {
      setMobileTab('mapa');
    }
  };

  // Handler de troca de filtro
  const handleChangeFilter = (newFilter: ElectionFilter) => {
    setFilter(newFilter);
    if (newFilter === 'bairros_colatina') {
      setSelectedCityName('Colatina');
    }
  };

  return (
    <div className="election-page-root">
      {/* Barra de Navegação Superior Unificada */}
      <ElectionNavbar
        totais={electionData.totais}
        mobileTab={mobileTab}
        onSelectMobileTab={setMobileTab}
      />

      {/* Área Principal de Trabalho (Drawer Lateral + Mapa Leaflet) */}
      <div
        className={`election-page-workspace ${
          mobileTab === 'ranking' ? 'show-tab-ranking' : 'show-tab-mapa'
        }`}
      >
        {/* Painel Lateral / Drawer com Busca, Filtros e Lista */}
        <div className="election-drawer-area">
          <ElectionDrawer
            municipios={filteredMunicipios}
            bairros={COLATINA_BAIRROS}
            selectedCityName={selectedCityName}
            onSelectCity={handleSelectCity}
            selectedBairroName={selectedBairroName}
            onSelectBairro={handleSelectBairro}
            filter={filter}
            onChangeFilter={handleChangeFilter}
            searchTerm={searchTerm}
            onChangeSearch={setSearchTerm}
            totalComVotos={electionData.totais.cidadesComVoto}
            totalColatinaVotos={COLATINA_TOTAL_VOTOS}
          />
        </div>

        {/* Canvas do Mapa Interativo com as cores do termômetro */}
        <div className="election-map-area">
          <ElectionLeafletMap
            municipios={filteredMunicipios}
            selectedCityName={selectedCityName}
            onSelectCity={handleSelectCity}
            selectedBairroName={selectedBairroName}
            onSelectBairro={handleSelectBairro}
            isColatinaViewActive={filter === 'bairros_colatina'}
          />
        </div>
      </div>
    </div>
  );
};
