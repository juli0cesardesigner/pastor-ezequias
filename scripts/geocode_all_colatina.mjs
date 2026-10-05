import fs from 'node:fs';

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

// Extrai cada bairro com seu primeiro endereço, CEP e local
const bairrosInfo = new Map();

for (let i = 1; i < lines.length; i++) {
  const parts = parseCsvLine(lines[i]);
  if (parts.length < 8) continue;
  // 3: Local de Votação
  // 5: Endereço
  // 6: CEP
  // 7: Bairro
  const local = parts[3];
  const endereco = parts[5];
  const cep = parts[6];
  const bairro = parts[7];

  if (!bairrosInfo.has(bairro)) {
    bairrosInfo.set(bairro, {
      bairro,
      local,
      endereco,
      cep
    });
  }
}

console.log('Total de bairros/distritos únicos:', bairrosInfo.size);

async function run() {
  const results = {};
  for (const [nome, info] of bairrosInfo.entries()) {
    console.log(`Buscando coordenadas de: ${nome}...`);
    
    // Tenta primeiro: "Bairro, Colatina, ES"
    let q = `${nome}, Colatina, ES`;
    let url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1';
    let res = await fetch(url, { headers: { 'User-Agent': 'ColatinaElectionMap/1.0' } });
    let data = await res.json();

    if (!data || !data[0]) {
      // Tenta por CEP
      if (info.cep) {
        url = `https://nominatim.openstreetmap.org/search?postalcode=${info.cep}&country=Brazil&format=json&limit=1`;
        res = await fetch(url, { headers: { 'User-Agent': 'ColatinaElectionMap/1.0' } });
        data = await res.json();
      }
    }

    if (!data || !data[0]) {
      // Tenta por Endereço
      const rua = info.endereco.split(',')[0].replace(/\bN\.\s*\d+/i, '').trim();
      q = `${rua}, Colatina, ES`;
      url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1';
      res = await fetch(url, { headers: { 'User-Agent': 'ColatinaElectionMap/1.0' } });
      data = await res.json();
    }

    if (data && data[0]) {
      results[nome] = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
      console.log(`  ✅ ${nome}: ${data[0].lat}, ${data[0].lon}`);
    } else {
      console.log(`  ❌ ${nome}: NÃO ENCONTRADO`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync('src/data/geocoded_bairros_colatina.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Salvo em src/data/geocoded_bairros_colatina.json');
}

run();
