// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coordenadas e regiões oficiais dos 78 municípios do ES
const ES_MUNICIPALITIES_DATA = [
  { name: 'Afonso Cláudio', lat: -20.0778, lng: -41.1347, region: 'Central Serrana' },
  { name: 'Água Doce do Norte', lat: -18.5469, lng: -40.9794, region: 'Noroeste' },
  { name: 'Águia Branca', lat: -18.9839, lng: -40.7408, region: 'Noroeste' },
  { name: 'Alegre', lat: -20.7631, lng: -41.5331, region: 'Caparaó' },
  { name: 'Alfredo Chaves', lat: -20.6364, lng: -40.7497, region: 'Central Sul' },
  { name: 'Alto Rio Novo', lat: -19.0578, lng: -41.0181, region: 'Noroeste' },
  { name: 'Anchieta', lat: -20.8058, lng: -40.6453, region: 'Litoral Sul' },
  { name: 'Apiacá', lat: -21.1542, lng: -41.5681, region: 'Sul' },
  { name: 'Aracruz', lat: -19.8203, lng: -40.2733, region: 'Rio Doce' },
  { name: 'Atílio Vivácqua', lat: -20.9147, lng: -41.1989, region: 'Central Sul' },
  { name: 'Baixo Guandu', lat: -19.5186, lng: -41.0153, region: 'Central Oeste' },
  { name: 'Barra de São Francisco', lat: -18.7553, lng: -40.8906, region: 'Noroeste' },
  { name: 'Boa Esperança', lat: -18.5408, lng: -40.2953, region: 'Nordeste' },
  { name: 'Bom Jesus do Norte', lat: -21.1111, lng: -41.6706, region: 'Caparaó' },
  { name: 'Brejetuba', lat: -20.1469, lng: -41.2917, region: 'Sudoeste Serrana' },
  { name: 'Cachoeiro de Itapemirim', lat: -20.8489, lng: -41.1128, region: 'Central Sul' },
  { name: 'Cariacica', lat: -20.2639, lng: -40.42, region: 'Metropolitana' },
  { name: 'Castelo', lat: -20.6039, lng: -41.2036, region: 'Central Sul' },
  { name: 'Colatina', lat: -19.5392, lng: -40.6308, region: 'Central Oeste' },
  { name: 'Conceição da Barra', lat: -18.5933, lng: -39.7322, region: 'Nordeste' },
  { name: 'Conceição do Castelo', lat: -20.3683, lng: -41.2439, region: 'Sudoeste Serrana' },
  { name: 'Divino de São Lourenço', lat: -20.6206, lng: -41.6853, region: 'Caparaó' },
  { name: 'Domingos Martins', lat: -20.3633, lng: -40.6589, region: 'Sudoeste Serrana' },
  { name: 'Dores do Rio Preto', lat: -20.6892, lng: -41.8456, region: 'Caparaó' },
  { name: 'Ecoporanga', lat: -18.3733, lng: -40.8306, region: 'Noroeste' },
  { name: 'Fundão', lat: -19.9333, lng: -40.4042, region: 'Metropolitana' },
  { name: 'Governador Lindenberg', lat: -19.2789, lng: -40.4778, region: 'Central Oeste' },
  { name: 'Guaçuí', lat: -20.7756, lng: -41.6792, region: 'Caparaó' },
  { name: 'Guarapari', lat: -20.6706, lng: -40.4975, region: 'Metropolitana' },
  { name: 'Ibatiba', lat: -20.2339, lng: -41.5108, region: 'Caparaó' },
  { name: 'Ibiraçu', lat: -19.8319, lng: -40.3697, region: 'Rio Doce' },
  { name: 'Ibitirama', lat: -20.5408, lng: -41.6669, region: 'Caparaó' },
  { name: 'Iconha', lat: -20.7931, lng: -40.8108, region: 'Litoral Sul' },
  { name: 'Irupi', lat: -20.3447, lng: -41.6406, region: 'Caparaó' },
  { name: 'Itaguaçu', lat: -19.8017, lng: -40.8558, region: 'Central Serrana' },
  { name: 'Itapemirim', lat: -21.0111, lng: -40.8339, region: 'Litoral Sul' },
  { name: 'Itarana', lat: -19.8739, lng: -40.8753, region: 'Central Serrana' },
  { name: 'Iúna', lat: -20.3458, lng: -41.5358, region: 'Caparaó' },
  { name: 'Jaguaré', lat: -18.9056, lng: -40.0761, region: 'Nordeste' },
  { name: 'Jerônimo Monteiro', lat: -20.7897, lng: -41.3961, region: 'Caparaó' },
  { name: 'João Neiva', lat: -19.7578, lng: -40.3861, region: 'Rio Doce' },
  { name: 'Laranja da Terra', lat: -19.8986, lng: -41.0569, region: 'Central Serrana' },
  { name: 'Linhares', lat: -19.3911, lng: -40.0722, region: 'Rio Doce' },
  { name: 'Mantenópolis', lat: -18.8622, lng: -41.1228, region: 'Noroeste' },
  { name: 'Marataízes', lat: -21.0433, lng: -40.8244, region: 'Litoral Sul' },
  { name: 'Marechal Floriano', lat: -20.4131, lng: -40.6831, region: 'Sudoeste Serrana' },
  { name: 'Marilândia', lat: -19.4136, lng: -40.5414, region: 'Central Oeste' },
  { name: 'Mimoso do Sul', lat: -21.0642, lng: -41.3283, region: 'Sul' },
  { name: 'Montanha', lat: -18.1269, lng: -40.3633, region: 'Nordeste' },
  { name: 'Mucurici', lat: -18.0933, lng: -40.5156, region: 'Nordeste' },
  { name: 'Muniz Freire', lat: -20.4642, lng: -41.4131, region: 'Caparaó' },
  { name: 'Muqui', lat: -20.9519, lng: -41.3458, region: 'Sul' },
  { name: 'Nova Venécia', lat: -18.7106, lng: -40.4006, region: 'Noroeste' },
  { name: 'Pancas', lat: -19.2247, lng: -40.8514, region: 'Central Oeste' },
  { name: 'Pedro Canário', lat: -18.0297, lng: -40.1492, region: 'Nordeste' },
  { name: 'Pinheiros', lat: -18.4239, lng: -40.2189, region: 'Nordeste' },
  { name: 'Piúma', lat: -20.8339, lng: -40.7244, region: 'Litoral Sul' },
  { name: 'Ponto Belo', lat: -18.1247, lng: -40.5369, region: 'Nordeste' },
  { name: 'Presidente Kennedy', lat: -21.0964, lng: -41.0486, region: 'Litoral Sul' },
  { name: 'Rio Bananal', lat: -19.2656, lng: -40.3331, region: 'Rio Doce' },
  { name: 'Rio Novo do Sul', lat: -20.8631, lng: -40.9364, region: 'Litoral Sul' },
  { name: 'Santa Leopoldina', lat: -20.1006, lng: -40.5297, region: 'Central Serrana' },
  { name: 'Santa Maria de Jetibá', lat: -20.0406, lng: -40.7461, region: 'Central Serrana' },
  { name: 'Santa Teresa', lat: -19.9356, lng: -40.6006, region: 'Central Serrana' },
  { name: 'São Domingos do Norte', lat: -19.1417, lng: -40.5847, region: 'Central Oeste' },
  { name: 'São Gabriel da Palha', lat: -19.0169, lng: -40.5361, region: 'Central Oeste' },
  { name: 'São José do Calçado', lat: -20.9806, lng: -41.6542, region: 'Caparaó' },
  { name: 'São Mateus', lat: -18.7161, lng: -39.8589, region: 'Nordeste' },
  { name: 'São Roque do Canaã', lat: -19.7389, lng: -40.6558, region: 'Central Oeste' },
  { name: 'Serra', lat: -20.1286, lng: -40.3078, region: 'Metropolitana' },
  { name: 'Sooretama', lat: -19.1969, lng: -40.0911, region: 'Rio Doce' },
  { name: 'Vargem Alta', lat: -20.6722, lng: -41.0083, region: 'Central Sul' },
  { name: 'Venda Nova do Imigrante', lat: -20.3297, lng: -41.1347, region: 'Sudoeste Serrana' },
  { name: 'Viana', lat: -20.3906, lng: -40.4958, region: 'Metropolitana' },
  { name: 'Vila Pavão', lat: -18.6144, lng: -40.6106, region: 'Noroeste' },
  { name: 'Vila Valério', lat: -18.9989, lng: -40.3889, region: 'Central Oeste' },
  { name: 'Vila Velha', lat: -20.3297, lng: -40.2925, region: 'Metropolitana' },
  { name: 'Vitória', lat: -20.3155, lng: -40.3128, region: 'Metropolitana' },
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function fetchElectionData() {
  console.log('🔄 Conectando à API Oficial do TSE (Eleições 2026)...');
  const cmUrl = 'https://resultados.tse.jus.br/oficial/ele2026/6259/config/mun-e006259-cm.json';
  const res = await fetch(cmUrl);
  if (!res.ok) {
    throw new Error(`Erro ao baixar lista de municípios do TSE: HTTP ${res.status}`);
  }

  const configData = await res.json();
  const es = configData.abr?.find((a) => a.cd?.toLowerCase() === 'es');
  if (!es || !es.mu) {
    throw new Error('Estado do Espírito Santo não localizado no config do TSE');
  }

  const muList = es.mu;
  console.log(`📍 ${muList.length} municípios do Espírito Santo encontrados no TSE. Baixando apuração...`);

  const municipalResults = [];

  // Busca em lotes de 10 requisições simultâneas
  for (let i = 0; i < muList.length; i += 10) {
    const batch = muList.slice(i, i + 10);
    const promises = batch.map(async (mu) => {
      const munUrl = `https://resultados.tse.jus.br/oficial/ele2026/6259/dados/es/es${mu.cd}-c0007-e006259-u.json`;
      try {
        const mRes = await fetch(munUrl);
        if (!mRes.ok) {
          return {
            nomeOficialTse: mu.nm,
            cdTse: mu.cd,
            cdIbge: mu.cdi,
            votos: 0,
            percentual: 0,
            pvap: '0,00',
            totalValidos: 0,
            rankingMun: 0,
          };
        }
        const mData = await mRes.json();
        let votos = 0;
        let pvap = '0,00';
        let rankingMun = 0;
        const totalValidos = parseInt(mData.v?.vv || mData.v?.vvc || '0', 10);

        mData.carg?.forEach((c) => {
          c.agr?.forEach((a) => {
            a.par?.forEach((p) => {
              p.cand?.forEach((cd) => {
                if (cd.n === '15333') {
                  votos = parseInt(cd.vap, 10) || 0;
                  pvap = cd.pvap || '0,00';
                  rankingMun = parseInt(cd.seq, 10) || 0;
                }
              });
            });
          });
        });

        const percentualNum = parseFloat(pvap.replace(',', '.')) || 0;

        return {
          nomeOficialTse: mu.nm,
          cdTse: mu.cd,
          cdIbge: mu.cdi,
          votos,
          percentual: percentualNum,
          pvap,
          totalValidos,
          rankingMun,
        };
      } catch (err) {
        console.warn(`Aviso ao processar ${mu.nm}:`, err.message);
        return {
          nomeOficialTse: mu.nm,
          cdTse: mu.cd,
          cdIbge: mu.cdi,
          votos: 0,
          percentual: 0,
          pvap: '0,00',
          totalValidos: 0,
          rankingMun: 0,
        };
      }
    });

    const batchResults = await Promise.all(promises);
    municipalResults.push(...batchResults);
  }

  // Cruze com as coordenadas e regiões do app
  const enrichedMunicipalities = municipalResults.map((tseMun) => {
    const normTse = normalizeText(tseMun.nomeOficialTse);
    const localMatch = ES_MUNICIPALITIES_DATA.find((m) => normalizeText(m.name) === normTse);

    return {
      nome: localMatch ? localMatch.name : tseMun.nomeOficialTse,
      nomeTse: tseMun.nomeOficialTse,
      cdTse: tseMun.cdTse,
      cdIbge: tseMun.cdIbge,
      region: localMatch ? localMatch.region : 'Geral',
      lat: localMatch ? localMatch.lat : -20.3155,
      lng: localMatch ? localMatch.lng : -40.3128,
      votos: tseMun.votos,
      percentual: tseMun.percentual,
      pvap: tseMun.pvap,
      rankingMun: tseMun.rankingMun,
      totalValidosMun: tseMun.totalValidos,
    };
  });

  // Ordena por votos decrescente
  enrichedMunicipalities.sort((a, b) => b.votos - a.votos);

  const totalVotosEstado = enrichedMunicipalities.reduce((acc, cur) => acc + cur.votos, 0);
  const cidadesComVoto = enrichedMunicipalities.filter((m) => m.votos > 0).length;
  const cidadesZeradas = enrichedMunicipalities.filter((m) => m.votos === 0).length;

  const payload = {
    candidato: {
      nome: 'EZEQUIAS ALBERTO SOUSA',
      nomeUrna: 'PASTOR EZEQUIAS',
      numero: '15333',
      cargo: 'Deputado Estadual',
      partido: 'MDB',
      uf: 'ES',
      eleicao: 'Eleições Gerais 2026 - 1º Turno',
      situacao: 'Suplente',
    },
    totais: {
      totalVotosEstado,
      totalMunicipios: enrichedMunicipalities.length,
      cidadesComVoto,
      cidadesZeradas,
      maiorVotacaoMunicipio: enrichedMunicipalities[0]?.nome || '',
      maiorVotacaoVotos: enrichedMunicipalities[0]?.votos || 0,
      atualizadoEm: new Date().toISOString(),
    },
    municipios: enrichedMunicipalities,
  };

  const outputDir = path.resolve(__dirname, '../src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'votos_ezequias_es_2026.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`\n✅ Sucesso! Dados oficiais salvos em: ${outputPath}`);
  console.log(`📊 Total Votos no ES: ${totalVotosEstado}`);
  console.log(`📍 Cidades com Voto: ${cidadesComVoto}/${enrichedMunicipalities.length}`);
  console.log(`⚪ Cidades Zeradas: ${cidadesZeradas}`);
  console.log(`🥇 Top 1: ${enrichedMunicipalities[0].nome} (${enrichedMunicipalities[0].votos} votos)`);
}

fetchElectionData().catch((err) => {
  console.error('❌ Falha ao processar dados da eleição:', err);
  process.exit(1);
});
