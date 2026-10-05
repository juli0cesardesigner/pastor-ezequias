import fs from 'node:fs';

const secoesVotos = JSON.parse(fs.readFileSync('src/data/votos_colatina_secoes_2026.json', 'utf8'));
const csvText = fs.readFileSync('src/data/locais_votacao_colatina.csv', 'utf8');

const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
console.log('Total linhas CSV:', lines.length - 1);

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

const secaoToBairro = new Map();
const secaoToLocal = new Map();
const secaoToEscola = new Map();

for (let i = 1; i < lines.length; i++) {
  const parts = parseCsvLine(lines[i]);
  if (parts.length < 8) continue;
  // Zona, Município, Número, Local de Votação, Seção, Endereço, CEP, Bairro, Qtd Aptos
  const secaoNum = parseInt(parts[4].replace(/"/g, '').trim(), 10);
  if (isNaN(secaoNum)) continue;
  const secaoStr = String(secaoNum).padStart(4, '0');
  const bairro = parts[7].replace(/"/g, '').trim();
  const local = parts[3].replace(/"/g, '').trim();

  secaoToBairro.set(secaoStr, bairro);
  secaoToLocal.set(secaoStr, local);
}

console.log('Seções mapeadas no CSV:', secaoToBairro.size);

const bairrosMap = {};
let matchedVotes = 0;
let unmatchedVotes = 0;
const unmatchedSecoes = [];

for (const sec of secoesVotos) {
  let bairro = secaoToBairro.get(sec.secao);
  
  // Se for seção agregada, herda o bairro da seção principal!
  if (!bairro && sec.agregadaA) {
    bairro = secaoToBairro.get(sec.agregadaA);
  }

  if (bairro) {
    if (!bairrosMap[bairro]) {
      bairrosMap[bairro] = {
        bairro,
        votos: 0,
        secoesCount: 0,
        secoes: [],
        locais: new Set()
      };
    }
    bairrosMap[bairro].votos += sec.votosEzequias;
    bairrosMap[bairro].secoesCount += 1;
    bairrosMap[bairro].secoes.push(sec.secao);
    if (secaoToLocal.get(sec.secao)) {
      bairrosMap[bairro].locais.add(secaoToLocal.get(sec.secao));
    }
    matchedVotes += sec.votosEzequias;
  } else {
    unmatchedVotes += sec.votosEzequias;
    unmatchedSecoes.push(sec);
  }
}

console.log('📊 Votos mapeados em bairros:', matchedVotes);
console.log('⚠️ Votos NÃO mapeados:', unmatchedVotes);
console.log('Seções não mapeadas no CSV:', unmatchedSecoes.length);
if (unmatchedSecoes.length > 0) {
  console.log('Seções não encontradas no CSV:', unmatchedSecoes);
}

const list = Object.values(bairrosMap).map(b => ({
  bairro: b.bairro,
  votos: b.votos,
  secoesCount: b.secoesCount,
  locais: Array.from(b.locais)
})).sort((a, b) => b.votos - a.votos);

console.log('\n🏆 Ranking por Bairros/Distritos de Colatina:');
console.table(list.map(l => ({ Bairro: l.bairro, Votos: l.votos, 'Qtd Seções': l.secoesCount })));
