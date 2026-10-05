export interface MunicipioVoto {
  nome: string;
  nomeTse: string;
  cdTse: string;
  cdIbge: string;
  region: string;
  lat: number;
  lng: number;
  votos: number;
  percentual: number;
  pvap: string;
  rankingMun: number;
  totalValidosMun: number;
}

export interface BairroVoto {
  id: string;
  nome: string;
  cidade: string;
  lat: number;
  lng: number;
  votos: number;
  percentualCidade: number; // % dos votos de Colatina (2.026) que vieram deste bairro
  principaisLocais?: string[]; // Locais/escolas de votação do bairro
  secoesCount?: number;
  secoes?: string[];
}

export interface ElectionCandidate {
  nome: string;
  nomeUrna: string;
  numero: string;
  cargo: string;
  partido: string;
  uf: string;
  eleicao: string;
  situacao: string;
}

export interface ElectionTotals {
  totalVotosEstado: number;
  totalMunicipios: number;
  cidadesComVoto: number;
  cidadesZeradas: number;
  maiorVotacaoMunicipio: string;
  maiorVotacaoVotos: number;
  atualizadoEm: string;
}

export interface ElectionData {
  candidato: ElectionCandidate;
  totais: ElectionTotals;
  municipios: MunicipioVoto[];
}

export type ElectionFilter = 'todos' | 'com_votos' | 'bairros_colatina' | 'zerados';

export type MobileTab = 'mapa' | 'ranking';

export interface ThermometerLevel {
  id: string;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  glowColor: string;
  textColor: string;
}
