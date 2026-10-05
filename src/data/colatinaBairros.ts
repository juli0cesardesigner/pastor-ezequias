import type { BairroVoto } from '../types/election';

export const COLATINA_TOTAL_VOTOS = 2026;

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
export const COLATINA_BAIRROS: BairroVoto[] = [
  {
    "id": "sao_silvano",
    "nome": "São Silvano",
    "cidade": "Colatina",
    "lat": -19.524,
    "lng": -40.638,
    "votos": 198,
    "percentualCidade": 9.77,
    "principaisLocais": [
      "EEEFM HONÓRIO FRAGA",
      "CEIM CARLOS ROBERTO MENEGATTI",
      "EMEF MARIA DA LUZ GOTTI"
    ],
    "secoesCount": 33,
    "secoes": [
      "0075",
      "0076",
      "0077",
      "0078",
      "0079",
      "0080",
      "0081",
      "0082",
      "0083",
      "0084",
      "0085",
      "0086",
      "0087",
      "0089",
      "0091",
      "0092",
      "0093",
      "0094",
      "0095",
      "0096",
      "0097",
      "0098",
      "0099",
      "0230",
      "0291",
      "0294",
      "0321",
      "0340",
      "0346",
      "0353",
      "0522",
      "0523",
      "0547"
    ]
  },
  {
    "id": "centro",
    "nome": "Centro",
    "cidade": "Colatina",
    "lat": -19.536,
    "lng": -40.63,
    "votos": 154,
    "percentualCidade": 7.6,
    "principaisLocais": [
      "CEEFMTI CONDE DE LINHARES",
      "SESC SERVIÇO SOCIAL DO COMÉRCIO"
    ],
    "secoesCount": 24,
    "secoes": [
      "0473",
      "0474",
      "0475",
      "0476",
      "0477",
      "0478",
      "0479",
      "0480",
      "0481",
      "0482",
      "0483",
      "0484",
      "0490",
      "0491",
      "0492",
      "0493",
      "0494",
      "0495",
      "0496",
      "0497",
      "0498",
      "0499",
      "0500",
      "0501"
    ]
  },
  {
    "id": "bela_vista",
    "nome": "Bela Vista",
    "cidade": "Colatina",
    "lat": -19.515,
    "lng": -40.634,
    "votos": 131,
    "percentualCidade": 6.47,
    "principaisLocais": [
      "EMEIEF LUIZ DALLA BERNARDINA",
      "EMEFTI BELMIRO TEIXEIRA PIMENTA"
    ],
    "secoesCount": 9,
    "secoes": [
      "0460",
      "0461",
      "0462",
      "0463",
      "0464",
      "0465",
      "0466",
      "0528",
      "0566"
    ]
  },
  {
    "id": "ayrton_senna",
    "nome": "Ayrton Senna",
    "cidade": "Colatina",
    "lat": -19.492,
    "lng": -40.655,
    "votos": 116,
    "percentualCidade": 5.73,
    "principaisLocais": [
      "EMEFTI JOÃO MANOEL MENEGHELLI"
    ],
    "secoesCount": 11,
    "secoes": [
      "0283",
      "0308",
      "0332",
      "0358",
      "0377",
      "0387",
      "0516",
      "0532",
      "0540",
      "0554",
      "0561"
    ]
  },
  {
    "id": "santos_dumont",
    "nome": "Santos Dumont",
    "cidade": "Colatina",
    "lat": -19.522,
    "lng": -40.648,
    "votos": 112,
    "percentualCidade": 5.53,
    "principaisLocais": [
      "EMEIEF MATILDE GUERRA COMÉRIO"
    ],
    "secoesCount": 9,
    "secoes": [
      "0331",
      "0356",
      "0375",
      "0385",
      "0515",
      "0534",
      "0541",
      "0556",
      "0564"
    ]
  },
  {
    "id": "sao_vicente",
    "nome": "São Vicente",
    "cidade": "Colatina",
    "lat": -19.528,
    "lng": -40.633,
    "votos": 100,
    "percentualCidade": 4.94,
    "principaisLocais": [
      "EMEIEF CLERES MARTINS MOREIRA"
    ],
    "secoesCount": 9,
    "secoes": [
      "0410",
      "0411",
      "0412",
      "0413",
      "0414",
      "0415",
      "0416",
      "0531",
      "0557"
    ]
  },
  {
    "id": "morada_do_sol",
    "nome": "Morada do Sol",
    "cidade": "Colatina",
    "lat": -19.514,
    "lng": -40.658,
    "votos": 97,
    "percentualCidade": 4.79,
    "principaisLocais": [
      "SENAI COLATINA"
    ],
    "secoesCount": 10,
    "secoes": [
      "0100",
      "0101",
      "0221",
      "0259",
      "0263",
      "0267",
      "0276",
      "0314",
      "0382",
      "0521"
    ]
  },
  {
    "id": "colatina_velha",
    "nome": "Colatina Velha",
    "cidade": "Colatina",
    "lat": -19.539,
    "lng": -40.648,
    "votos": 90,
    "percentualCidade": 4.44,
    "principaisLocais": [
      "EMEIEFTI OSEAS RANGEL DE AMORIM"
    ],
    "secoesCount": 9,
    "secoes": [
      "0433",
      "0434",
      "0435",
      "0436",
      "0437",
      "0438",
      "0439",
      "0440",
      "0537"
    ]
  },
  {
    "id": "honorio_fraga",
    "nome": "Honório Fraga",
    "cidade": "Colatina",
    "lat": -19.531,
    "lng": -40.676,
    "votos": 86,
    "percentualCidade": 4.24,
    "principaisLocais": [
      "EEEFM PROFESSORA NÉA MONTEIRO COSTA",
      "CEIM NOSSA SENHORA DA PENHA"
    ],
    "secoesCount": 17,
    "secoes": [
      "0117",
      "0118",
      "0119",
      "0121",
      "0123",
      "0237",
      "0248",
      "0258",
      "0265",
      "0275",
      "0309",
      "0320",
      "0339",
      "0368",
      "0384",
      "0527",
      "0549"
    ]
  },
  {
    "id": "maria_das_gracas",
    "nome": "Maria das Graças",
    "cidade": "Colatina",
    "lat": -19.514,
    "lng": -40.62,
    "votos": 71,
    "percentualCidade": 3.5,
    "principaisLocais": [
      "EMEF DR. RAUL GIUBERTI",
      "EMEF JOSÉ FACHETTI"
    ],
    "secoesCount": 16,
    "secoes": [
      "0069",
      "0071",
      "0072",
      "0074",
      "0226",
      "0250",
      "0268",
      "0303",
      "0322",
      "0338",
      "0352",
      "0360",
      "0366",
      "0369",
      "0370",
      "0568"
    ]
  },
  {
    "id": "lace",
    "nome": "Lace",
    "cidade": "Colatina",
    "lat": -19.522,
    "lng": -40.627,
    "votos": 70,
    "percentualCidade": 3.46,
    "principaisLocais": [
      "EEEFM GERALDO VARGAS NOGUEIRA"
    ],
    "secoesCount": 16,
    "secoes": [
      "0062",
      "0063",
      "0064",
      "0065",
      "0066",
      "0067",
      "0295",
      "0319",
      "0333",
      "0365",
      "0386",
      "0520",
      "0536",
      "0552",
      "0559",
      "0565"
    ]
  },
  {
    "id": "operarios",
    "nome": "Operários",
    "cidade": "Colatina",
    "lat": -19.541,
    "lng": -40.625,
    "votos": 67,
    "percentualCidade": 3.31,
    "principaisLocais": [
      "CEIM LUIZA DE MARILAC",
      "EMEF HUMBERTO DE CAMPOS"
    ],
    "secoesCount": 10,
    "secoes": [
      "0425",
      "0426",
      "0427",
      "0428",
      "0509",
      "0510",
      "0511",
      "0512",
      "0535",
      "0551"
    ]
  },
  {
    "id": "moacir_brotas",
    "nome": "Moacir Brotas",
    "cidade": "Colatina",
    "lat": -19.544,
    "lng": -40.62,
    "votos": 66,
    "percentualCidade": 3.26,
    "principaisLocais": [
      "EMEFTI LIONS CLUB DE COLATINA"
    ],
    "secoesCount": 10,
    "secoes": [
      "0417",
      "0418",
      "0419",
      "0420",
      "0421",
      "0422",
      "0423",
      "0424",
      "0518",
      "0538"
    ]
  },
  {
    "id": "carlos_germano_naumann",
    "nome": "Carlos Germano Naumann",
    "cidade": "Colatina",
    "lat": -19.488,
    "lng": -40.67,
    "votos": 64,
    "percentualCidade": 3.16,
    "principaisLocais": [
      "EMEF FERRÚCIO FORRECHI",
      "EMEF PROF. JOÃO ELIAS PANCOTO"
    ],
    "secoesCount": 15,
    "secoes": [
      "0111",
      "0112",
      "0113",
      "0115",
      "0232",
      "0249",
      "0261",
      "0271",
      "0299",
      "0310",
      "0372",
      "0380",
      "0519",
      "0533",
      "0562"
    ]
  },
  {
    "id": "vista_da_serra",
    "nome": "Vista da Serra",
    "cidade": "Colatina",
    "lat": -19.5205,
    "lng": -40.644,
    "votos": 60,
    "percentualCidade": 2.96,
    "principaisLocais": [
      "CEIM VISTA DA SERRA"
    ],
    "secoesCount": 3,
    "secoes": [
      "0400",
      "0401",
      "0544"
    ]
  },
  {
    "id": "barbados",
    "nome": "Barbados",
    "cidade": "Colatina",
    "lat": -19.525,
    "lng": -40.582,
    "votos": 52,
    "percentualCidade": 2.57,
    "principaisLocais": [
      "EMEF GODOFREDO CHAVES BAIÃO"
    ],
    "secoesCount": 3,
    "secoes": [
      "0454",
      "0455",
      "0558"
    ]
  },
  {
    "id": "santo_antonio",
    "nome": "Santo Antônio",
    "cidade": "Colatina",
    "lat": -19.519,
    "lng": -40.656,
    "votos": 51,
    "percentualCidade": 2.52,
    "principaisLocais": [
      "EMEIEF AMÉLIO FORECHI"
    ],
    "secoesCount": 6,
    "secoes": [
      "0307",
      "0326",
      "0359",
      "0513",
      "0539",
      "0563"
    ]
  },
  {
    "id": "15_de_outubro",
    "nome": "15 de Outubro",
    "cidade": "Colatina",
    "lat": -19.505,
    "lng": -40.65,
    "votos": 50,
    "percentualCidade": 2.47,
    "principaisLocais": [
      "EPM QUINZE DE OUTUBRO"
    ],
    "secoesCount": 4,
    "secoes": [
      "0330",
      "0390",
      "0391",
      "0392"
    ]
  },
  {
    "id": "santa_teresinha",
    "nome": "Santa Teresinha",
    "cidade": "Colatina",
    "lat": -19.546,
    "lng": -40.639,
    "votos": 48,
    "percentualCidade": 2.37,
    "principaisLocais": [
      "EMEFTI ADWALTER RIBEIRO SOARES"
    ],
    "secoesCount": 10,
    "secoes": [
      "0441",
      "0442",
      "0443",
      "0444",
      "0445",
      "0446",
      "0447",
      "0448",
      "0529",
      "0553"
    ]
  },
  {
    "id": "nossa_senhora_aparecida",
    "nome": "Nossa Senhora Aparecida",
    "cidade": "Colatina",
    "lat": -19.518,
    "lng": -40.63,
    "votos": 45,
    "percentualCidade": 2.22,
    "principaisLocais": [
      "EMEF EUGÊNIO MENEGHELLI"
    ],
    "secoesCount": 11,
    "secoes": [
      "0102",
      "0103",
      "0104",
      "0105",
      "0106",
      "0107",
      "0108",
      "0109",
      "0110",
      "0233",
      "0301"
    ]
  },
  {
    "id": "novo_horizonte",
    "nome": "Novo Horizonte",
    "cidade": "Colatina",
    "lat": -19.511,
    "lng": -40.64,
    "votos": 36,
    "percentualCidade": 1.78,
    "principaisLocais": [
      "EMEIEF SÃO MARCOS"
    ],
    "secoesCount": 5,
    "secoes": [
      "0304",
      "0337",
      "0373",
      "0526",
      "0567"
    ]
  },
  {
    "id": "columbia",
    "nome": "Columbia",
    "cidade": "Colatina",
    "lat": -19.525,
    "lng": -40.711,
    "votos": 34,
    "percentualCidade": 1.68,
    "principaisLocais": [
      "COLÉGIO ADVENTISTA DO ESPÍRITO SANTO -  EDESSA"
    ],
    "secoesCount": 10,
    "secoes": [
      "0284",
      "0312",
      "0325",
      "0347",
      "0361",
      "0381",
      "0514",
      "0530",
      "0543",
      "0555"
    ]
  },
  {
    "id": "vila_lenira",
    "nome": "Vila Lenira",
    "cidade": "Colatina",
    "lat": -19.552,
    "lng": -40.633,
    "votos": 31,
    "percentualCidade": 1.53,
    "principaisLocais": [
      "EMEF CORONEL VIRGÍNIO CALMON"
    ],
    "secoesCount": 7,
    "secoes": [
      "0502",
      "0503",
      "0504",
      "0505",
      "0506",
      "0507",
      "0524"
    ]
  },
  {
    "id": "esplanada",
    "nome": "Esplanada",
    "cidade": "Colatina",
    "lat": -19.5375,
    "lng": -40.6355,
    "votos": 28,
    "percentualCidade": 1.38,
    "principaisLocais": [
      "EEEFM RUBENS RANGEL"
    ],
    "secoesCount": 10,
    "secoes": [
      "0402",
      "0403",
      "0404",
      "0405",
      "0406",
      "0407",
      "0408",
      "0409",
      "0546",
      "0560"
    ]
  },
  {
    "id": "maria_ismenia",
    "nome": "Maria Ismênia",
    "cidade": "Colatina",
    "lat": -19.545,
    "lng": -40.631,
    "votos": 18,
    "percentualCidade": 0.89,
    "principaisLocais": [
      "EMEIEF DR. CARLOS GERMANO NAUMANN"
    ],
    "secoesCount": 5,
    "secoes": [
      "0485",
      "0486",
      "0487",
      "0488",
      "0489"
    ]
  },
  {
    "id": "sagrado_coracao_de_jesus",
    "nome": "Sagrado Coração de Jesus",
    "cidade": "Colatina",
    "lat": -19.539,
    "lng": -40.639,
    "votos": 17,
    "percentualCidade": 0.84,
    "principaisLocais": [
      "EEEF DR. OCTÁVIO MANHÃES DE ANDRADE"
    ],
    "secoesCount": 7,
    "secoes": [
      "0394",
      "0395",
      "0396",
      "0397",
      "0398",
      "0399",
      "0548"
    ]
  },
  {
    "id": "sede_do_distrito_de_angelo_frechiani",
    "nome": "Sede do Distrito de Ângelo Frechiani",
    "cidade": "Colatina",
    "lat": -19.309,
    "lng": -40.6841,
    "votos": 16,
    "percentualCidade": 0.79,
    "principaisLocais": [
      "EMCOR PADRE FULGÊNCIO DO MENINO JESUS"
    ],
    "secoesCount": 4,
    "secoes": [
      "0179",
      "0180",
      "0227",
      "0545"
    ]
  },
  {
    "id": "luiz_iglesias",
    "nome": "Luiz Iglesias",
    "cidade": "Colatina",
    "lat": -19.544,
    "lng": -40.668,
    "votos": 15,
    "percentualCidade": 0.74,
    "principaisLocais": [
      "EPM ROTARY CLUB"
    ],
    "secoesCount": 3,
    "secoes": [
      "0429",
      "0430",
      "0542"
    ]
  },
  {
    "id": "distrito_de_boapaba",
    "nome": "Distrito de Boapaba",
    "cidade": "Colatina",
    "lat": -19.6386,
    "lng": -40.6781,
    "votos": 14,
    "percentualCidade": 0.69,
    "principaisLocais": [
      "EMUCOR BARRA SECA",
      "EMEIEF ERNESTO CORRADI"
    ],
    "secoesCount": 6,
    "secoes": [
      "0393",
      "0449",
      "0450",
      "0451",
      "0452",
      "0525"
    ]
  },
  {
    "id": "fazenda_riva",
    "nome": "Fazenda Riva",
    "cidade": "Colatina",
    "lat": -19.4676,
    "lng": -40.8148,
    "votos": 13,
    "percentualCidade": 0.64,
    "principaisLocais": [
      "EMUCOR FAZENDA RIVA"
    ],
    "secoesCount": 1,
    "secoes": [
      "0238"
    ]
  },
  {
    "id": "patrimonio_de_sao_joao_pequeno",
    "nome": "Patrimônio de São João Pequeno",
    "cidade": "Colatina",
    "lat": -19.3486,
    "lng": -40.7536,
    "votos": 11,
    "percentualCidade": 0.54,
    "principaisLocais": [
      "EMCOR SÃO JOÃO PEQUENO"
    ],
    "secoesCount": 3,
    "secoes": [
      "0189",
      "0191",
      "0257"
    ]
  },
  {
    "id": "sede_do_distrito_de_itapina",
    "nome": "Sede do Distrito de Itapina",
    "cidade": "Colatina",
    "lat": -19.5334,
    "lng": -40.8134,
    "votos": 10,
    "percentualCidade": 0.49,
    "principaisLocais": [
      "EMEIEF MARIA ORTIZ"
    ],
    "secoesCount": 4,
    "secoes": [
      "0456",
      "0457",
      "0458",
      "0459"
    ]
  },
  {
    "id": "fazenda_misteriosa",
    "nome": "Fazenda Misteriosa",
    "cidade": "Colatina",
    "lat": -19.4512,
    "lng": -40.8409,
    "votos": 9,
    "percentualCidade": 0.44,
    "principaisLocais": [
      "EMUCOR FAZENDA MISTERIOSA"
    ],
    "secoesCount": 1,
    "secoes": [
      "0241"
    ]
  },
  {
    "id": "corrego_jequitiba",
    "nome": "Córrego Jequitibá",
    "cidade": "Colatina",
    "lat": -19.2628,
    "lng": -40.6602,
    "votos": 8,
    "percentualCidade": 0.39,
    "principaisLocais": [
      "EMUCOR AURÉLIO PRETTI"
    ],
    "secoesCount": 1,
    "secoes": [
      "0253"
    ]
  },
  {
    "id": "patrimonio_de_sao_salvador",
    "nome": "Patrimônio de São Salvador",
    "cidade": "Colatina",
    "lat": -19.4091,
    "lng": -40.714,
    "votos": 7,
    "percentualCidade": 0.35,
    "principaisLocais": [
      "EMUCOR SÃO SALVADOR"
    ],
    "secoesCount": 1,
    "secoes": [
      "0192"
    ]
  },
  {
    "id": "corrego_sao_pedro_frio",
    "nome": "Córrego São Pedro Frio",
    "cidade": "Colatina",
    "lat": -19.4148,
    "lng": -40.7902,
    "votos": 7,
    "percentualCidade": 0.35,
    "principaisLocais": [
      "EMPCOR CABECEIRA DE SÃO PEDRO"
    ],
    "secoesCount": 1,
    "secoes": [
      "0252"
    ]
  },
  {
    "id": "sede_do_distrito_de_baunilha",
    "nome": "Sede do Distrito de Baunilha",
    "cidade": "Colatina",
    "lat": -19.5715,
    "lng": -40.5057,
    "votos": 6,
    "percentualCidade": 0.3,
    "principaisLocais": [
      "EMEIEF PROFESSORA  LUIZA CREMA"
    ],
    "secoesCount": 5,
    "secoes": [
      "0467",
      "0468",
      "0469",
      "0470",
      "0550"
    ]
  },
  {
    "id": "distrito_de_paul_graca_aranha",
    "nome": "Distrito de Paul Graça Aranha",
    "cidade": "Colatina",
    "lat": -19.3237,
    "lng": -40.5971,
    "votos": 4,
    "percentualCidade": 0.2,
    "principaisLocais": [
      "EMEIEF GRAÇA ARANHA"
    ],
    "secoesCount": 3,
    "secoes": [
      "0193",
      "0194",
      "0195"
    ]
  },
  {
    "id": "distrito_de_itapina",
    "nome": "Distrito de Itapina",
    "cidade": "Colatina",
    "lat": -19.472,
    "lng": -40.7193,
    "votos": 4,
    "percentualCidade": 0.2,
    "principaisLocais": [
      "IFES - INSTITUTO FEDERAL DO ESPÍRITO SANTO CAMPUS ITAPINA"
    ],
    "secoesCount": 2,
    "secoes": [
      "0388",
      "0389"
    ]
  },
  {
    "id": "sao_joao_da_barra_seca",
    "nome": "São João da Barra Seca",
    "cidade": "Colatina",
    "lat": -19.5872,
    "lng": -40.7357,
    "votos": 4,
    "percentualCidade": 0.2,
    "principaisLocais": [
      "EMCOR FAZENDA PINOTTI"
    ],
    "secoesCount": 2,
    "secoes": [
      "0431",
      "0432"
    ]
  },
  {
    "id": "patrimonio_de_sao_joao_grande",
    "nome": "Patrimônio de São João Grande",
    "cidade": "Colatina",
    "lat": -19.595,
    "lng": -40.69,
    "votos": 2,
    "percentualCidade": 0.1,
    "principaisLocais": [
      "EMUCOR JOSÉ FAQUINOTTI"
    ],
    "secoesCount": 2,
    "secoes": [
      "0136",
      "0292"
    ]
  },
  {
    "id": "gordiano_guimaraes",
    "nome": "Gordiano Guimarães",
    "cidade": "Colatina",
    "lat": -19.4248,
    "lng": -40.6863,
    "votos": 2,
    "percentualCidade": 0.1,
    "principaisLocais": [
      "EPM PONTE DO PANCAS"
    ],
    "secoesCount": 2,
    "secoes": [
      "0305",
      "0517"
    ]
  },
  {
    "id": "corrego_santana",
    "nome": "Córrego Santana",
    "cidade": "Colatina",
    "lat": -19.5841,
    "lng": -40.6158,
    "votos": 1,
    "percentualCidade": 0.05,
    "principaisLocais": [
      "EMPCOR FAZENDA NOSSA SENHORA APARECIDA"
    ],
    "secoesCount": 1,
    "secoes": [
      "0254"
    ]
  },
  {
    "id": "povoacao_de_baunilha",
    "nome": "Povoação de Baunilha",
    "cidade": "Colatina",
    "lat": -19.629,
    "lng": -40.5533,
    "votos": 1,
    "percentualCidade": 0.05,
    "principaisLocais": [
      "EMUCOR POVOAÇÃO DE BAUNILHA"
    ],
    "secoesCount": 2,
    "secoes": [
      "0471",
      "0472"
    ]
  },
  {
    "id": "cascatinha",
    "nome": "Cascatinha",
    "cidade": "Colatina",
    "lat": -19.3886,
    "lng": -40.6973,
    "votos": 0,
    "percentualCidade": 0,
    "principaisLocais": [
      "EMUCOR CASCATINHA"
    ],
    "secoesCount": 1,
    "secoes": [
      "0256"
    ]
  },
  {
    "id": "corrego_santa_joana",
    "nome": "Córrego Santa Joana",
    "cidade": "Colatina",
    "lat": -19.5845,
    "lng": -40.7784,
    "votos": 0,
    "percentualCidade": 0,
    "principaisLocais": [
      "EMUCOR NOSSA SENHORA DAS GRAÇAS"
    ],
    "secoesCount": 1,
    "secoes": [
      "0453"
    ]
  },
  {
    "id": "corrego_estrela",
    "nome": "Córrego Estrela",
    "cidade": "Colatina",
    "lat": -19.559,
    "lng": -40.7649,
    "votos": 0,
    "percentualCidade": 0,
    "principaisLocais": [
      "CENTRO COMUNITÁRIO KNAAK"
    ],
    "secoesCount": 1,
    "secoes": [
      "0508"
    ]
  }
];
