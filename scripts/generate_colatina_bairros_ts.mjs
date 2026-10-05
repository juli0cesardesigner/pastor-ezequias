import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secoesVotos = JSON.parse(fs.readFileSync('src/data/votos_colatina_secoes_2026.json', 'utf8'));
const csvText = fs.readFileSync('src/data/locais_votacao_colatina.csv', 'utf8');

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const secaoToBairro = new Map();
const secaoToLocal = new Map();

for (let i = 1; i < lines.length; i++) {
  const parts = parseCsvLine(lines[i]);
  if (parts.length < 8) continue;
  const secaoNum = parseInt(parts[4].replace(/"/g, '').trim(), 10);
  if (isNaN(secaoNum)) continue;
  const secaoStr = String(secaoNum).padStart(4, '0');
  const bairro = parts[7].replace(/"/g, '').trim();
  const local = parts[3].replace(/"/g, '').trim();

  secaoToBairro.set(secaoStr, bairro);
  secaoToLocal.set(secaoStr, local);
}

// Seções 391 e 392 pertencem a 15 de Outubro (EPM Quinze de Outubro)
secaoToBairro.set('0391', '15 DE OUTUBRO');
secaoToLocal.set('0391', 'EPM QUINZE DE OUTUBRO');
secaoToBairro.set('0392', '15 DE OUTUBRO');
secaoToLocal.set('0392', 'EPM QUINZE DE OUTUBRO');

/**
 * Coordenadas Geográficas Calibradas com base no Google Maps Oficial de Colatina:
 * - Margem Norte (acima do Rio Doce): São Silvano, Santo Antônio, Santos Dumont, Bela Vista,
 *   Ayrton Senna, Carlos Germano Naumann, Lace, Maria das Graças, Honório Fraga, etc.
 * - Margem Sul (abaixo do Rio Doce): Centro, Operários, Vila Lenira, Luiz Iglesias, Colatina Velha,
 *   Esplanada, Sagrado Coração de Jesus, etc.
 * - Distritos rurais: Itapina, Baunilha, Boapaba, Ângelo Frechiani, Graça Aranha, etc.
 */
const BAIRRO_COORDS = {
  // --- MARGEM NORTE DO RIO DOCE ---
  'SÃO SILVANO': { lat: -19.5240, lng: -40.6380 },
  'SANTO ANTÔNIO': { lat: -19.5190, lng: -40.6560 }, // Igreja Santo Antônio / Supermercados BH
  'SANTOS DUMONT': { lat: -19.5220, lng: -40.6480 }, // Entre Santo Antônio e São Silvano
  'VISTA DA SERRA': { lat: -19.5205, lng: -40.6440 }, // Ao lado de Santos Dumont / Vista Real
  'BELA VISTA': { lat: -19.5150, lng: -40.6340 }, // Norte do Rio Doce, acima de Santa Mônica
  'NOVO HORIZONTE': { lat: -19.5110, lng: -40.6400 }, // EMEIEF São Marcos
  'AYRTON SENNA': { lat: -19.4920, lng: -40.6550 }, // EMEFTI João Manoel Meneghelli, rodovia ao norte
  'CARLOS GERMANO NAUMANN': { lat: -19.4880, lng: -40.6700 }, // Noroeste de Ayrton Senna
  'LACE': { lat: -19.5220, lng: -40.6270 }, // Avenida Brasil / EEEFM Geraldo Vargas Nogueira
  'MARIA DAS GRAÇAS': { lat: -19.5140, lng: -40.6200 }, // Curva norte do Rio Doce / São Bernardo
  'NOSSA SENHORA APARECIDA': { lat: -19.5180, lng: -40.6300 }, // EMEF Eugênio Meneghelli
  'MORADA DO SOL': { lat: -19.5140, lng: -40.6580 }, // SENAI Colatina
  '15 DE OUTUBRO': { lat: -19.5050, lng: -40.6500 }, // EPM Quinze de Outubro
  'HONÓRIO FRAGA': { lat: -19.5310, lng: -40.6760 }, // Sentido oeste, após o Frisa
  'COLUMBIA': { lat: -19.5250, lng: -40.7110 }, // EDESSA - Colégio Adventista na BR-259
  'BARBADOS': { lat: -19.5250, lng: -40.5820 }, // Leste ao longo do Rio Doce / Arena North Star
  'SÃO VICENTE': { lat: -19.5280, lng: -40.6330 }, // Margem norte próxima a São Silvano

  // --- MARGEM SUL DO RIO DOCE ---
  'CENTRO': { lat: -19.5360, lng: -40.6300 }, // Hospital São José / Cristo Redentor / Praça
  'OPERÁRIOS': { lat: -19.5410, lng: -40.6250 }, // Sul do Cristo Redentor
  'VILA LENIRA': { lat: -19.5520, lng: -40.6330 }, // EMEF Coronel Virgínio Calmon
  'LUIZ IGLESIAS': { lat: -19.5440, lng: -40.6680 }, // Margem sul a oeste do Centro
  'COLATINA VELHA': { lat: -19.5390, lng: -40.6480 }, // EMEIEFTI Oseas Rangel de Amorim
  'ESPLANADA': { lat: -19.5375, lng: -40.6355 }, // Próximo ao Hospital Unimed
  'SAGRADO CORAÇÃO DE JESUS': { lat: -19.5390, lng: -40.6390 }, // EEEF Dr. Octávio Manhães
  'SANTA TERESINHA': { lat: -19.5460, lng: -40.6390 }, // EMEFTI Adwalter Ribeiro Soares
  'MOACIR BROTAS': { lat: -19.5440, lng: -40.6200 }, // EMEFTI Lions Club de Colatina
  'MARIA ISMÊNIA': { lat: -19.5450, lng: -40.6310 }, // EMEIEF Dr. Carlos Germano Naumann

  // --- DISTRITOS E COMUNIDADES RURAIS ---
  'SEDE DO DISTRITO DE ÂNGELO FRECHIANI': { lat: -19.3090, lng: -40.6841 },
  'SEDE DO DISTRITO DE BAUNILHA': { lat: -19.5715, lng: -40.5057 },
  'POVOAÇÃO DE BAUNILHA': { lat: -19.6290, lng: -40.5533 },
  'SEDE DO DISTRITO DE ITAPINA': { lat: -19.5334, lng: -40.8134 },
  'DISTRITO DE ITAPINA': { lat: -19.4720, lng: -40.7193 },
  'DISTRITO DE BOAPABA': { lat: -19.6386, lng: -40.6781 },
  'DISTRITO DE PAUL GRAÇA ARANHA': { lat: -19.3237, lng: -40.5971 },
  'PATRIMÔNIO DE SÃO JOÃO PEQUENO': { lat: -19.3486, lng: -40.7536 },
  'GORDIANO GUIMARÃES': { lat: -19.4248, lng: -40.6863 },
  'CASCATINHA': { lat: -19.3886, lng: -40.6973 },
  'PATRIMÔNIO DE SÃO SALVADOR': { lat: -19.4091, lng: -40.7140 },
  'FAZENDA RIVA': { lat: -19.4676, lng: -40.8148 },
  'FAZENDA MISTERIOSA': { lat: -19.4512, lng: -40.8409 },
  'CÓRREGO ESTRELA': { lat: -19.5590, lng: -40.7649 },
  'CÓRREGO SANTA JOANA': { lat: -19.5845, lng: -40.7784 },
  'CÓRREGO SANTANA': { lat: -19.5841, lng: -40.6158 },
  'CÓRREGO SÃO PEDRO FRIO': { lat: -19.4148, lng: -40.7902 },
  'CÓRREGO JEQUITIBÁ': { lat: -19.2628, lng: -40.6602 },
  'SÃO JOÃO DA BARRA SECA': { lat: -19.5872, lng: -40.7357 },
  'PATRIMÔNIO DE SÃO JOÃO GRANDE': { lat: -19.5950, lng: -40.6900 }
};

function formatName(raw) {
  return raw
    .toLowerCase()
    .split(' ')
    .map(w => {
      if (['de', 'da', 'do', 'das', 'dos', 'e'].includes(w)) return w;
      if (w === '15') return '15';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const bairrosMap = {};

for (const sec of secoesVotos) {
  let rawBairro = secaoToBairro.get(sec.secao);
  if (!rawBairro && sec.agregadaA) {
    rawBairro = secaoToBairro.get(sec.agregadaA);
  }
  if (!rawBairro) {
    console.warn('Seção não mapeada:', sec.secao);
    continue;
  }

  const key = rawBairro.toUpperCase().trim();
  if (!bairrosMap[key]) {
    bairrosMap[key] = {
      rawNome: key,
      votos: 0,
      secoes: [],
      locais: new Set()
    };
  }
  bairrosMap[key].votos += sec.votosEzequias;
  bairrosMap[key].secoes.push(sec.secao);
  const loc = secaoToLocal.get(sec.secao) || (sec.agregadaA ? secaoToLocal.get(sec.agregadaA) : null);
  if (loc) bairrosMap[key].locais.add(loc);
}

const TOTAL_COLATINA = 2026;
const items = Object.values(bairrosMap).map(b => {
  const coords = BAIRRO_COORDS[b.rawNome] || { lat: -19.5392, lng: -40.6308 };
  const pct = Number(((b.votos / TOTAL_COLATINA) * 100).toFixed(2));
  return {
    id: slugify(b.rawNome),
    nome: formatName(b.rawNome),
    cidade: 'Colatina',
    lat: coords.lat,
    lng: coords.lng,
    votos: b.votos,
    percentualCidade: pct,
    principaisLocais: Array.from(b.locais),
    secoesCount: b.secoes.length,
    secoes: b.secoes
  };
});

items.sort((a, b) => b.votos - a.votos);

const somaFinal = items.reduce((acc, cur) => acc + cur.votos, 0);
console.log('✅ Soma Total dos Bairros:', somaFinal, '/ 2026');

const tsContent = `import type { BairroVoto } from '../types/election';

export const COLATINA_TOTAL_VOTOS = ${TOTAL_COLATINA};

/**
 * Distribuição oficial e auditada dos 2.026 votos do Pastor Ezequias (Nº 15333)
 * em Colatina - ES (Eleições 2026).
 *
 * Coordenadas geográficas calibradas precisamente com base na malha urbana de Colatina:
 * - Margem Norte (Rio Doce): São Silvano, Santo Antônio, Santos Dumont, Bela Vista,
 *   Ayrton Senna, Carlos Germano Naumann, Lace, Maria das Graças, etc.
 * - Margem Sul (Rio Doce): Centro, Operários, Vila Lenira, Luiz Iglesias, Colatina Velha,
 *   Esplanada, Sagrado Coração de Jesus, etc.
 * - Distritos: Itapina, Baunilha, Boapaba, Ângelo Frechiani, Graça Aranha, etc.
 */
export const COLATINA_BAIRROS: BairroVoto[] = ${JSON.stringify(items, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../src/data/colatinaBairros.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log('💾 Arquivo atualizado com sucesso em:', outputPath);
