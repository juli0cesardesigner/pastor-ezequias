# 🛡️ GUIA UNIVERSAL DE REGRAS DE ARQUITETURA E CLEAN CODE (ANTI-MONÓLITO)

## 1. PRINCÍPIO DA RESPONSABILIDADE ÚNICA E TAMANHO DE ARQUIVO
- **Limite estrito por arquivo:** Nenhum arquivo de código deve ultrapassar **150 a 200 linhas**.
- **Refatoração imediata:** Se um arquivo ou componente começar a crescer além desse limite, você DEVE interromper e decompô-lo em arquivos, funções ou subcomponentes menores.
- **Uma função/componente = Um propósito:** Cada arquivo deve ter apenas um motivo para mudar.

## 2. SEPARAÇÃO RÍGIDA DE CAMADAS (SEPARATION OF CONCERNS)
O código DEVE ser estritamente dividido nas seguintes camadas independentes:
- **Camada de Apresentação (UI/Views):** Componentes visuais devem apenas receber dados (props) e renderizar a interface. NENHUMA regra de negócio complexa ou chamada direta de banco de dados deve ficar no arquivo visual.
- **Camada de Regra de Negócio (State/Hooks/Controllers):** A lógica do cliente, manipulação de estado complexo e gerenciamento de eventos devem residir em Custom Hooks, Controllers ou Services isolados.
- **Camada de Dados e Comunicação (API/Services/Queries):** Chamadas de API, consultas de banco de dados e rotas de servidor devem estar em arquivos ou serviços dedicados à integração.
- **Camada de Tipagem/Contratos (Types/Models):** Tipos, interfaces, schemas e enums devem ser centralizados na pasta de tipos/modelos do projeto. NUNCA declare tipos inline dentro dos arquivos visuais.

## 3. MODULARIZAÇÃO DE COMPONENTES E INTERFACES
- **Decomposição Atômica:** Componentes visuais grandes (como mapas, dashboards, tabelas complexas ou páginas) DEVEM ser faturados em pequenos subcomponentes focados (ex: Container, Item, Controls, Modais/Popups, Filters).
- **Formulários Estruturados:** Formulários com mais de 5 campos DEVEM ser divididos em subseções funcionais ou etapas (steps) separadas em arquivos próprios.
- **Reutilização Primeiro:** Sempre verifique e prefira usar componentes de UI reutilizáveis da biblioteca do projeto em vez de criar elementos do zero ou aplicar estilos inline/hacks.

## 4. PADRÕES DE QUALIDADE E CLEAN CODE
- **Constantes e Mágicas:** Proibido o uso de "Magic Numbers" ou strings soltas no código. Centralize mensagens, configurações e valores estáticos em arquivos de constantes.
- **Nomes Significativos e Intuitivos:** Variáveis e funções devem indicar claramente sua intenção em inglês (ou no idioma padrão do projeto). Ex: `fetchUserProfile` em vez de `getData`.
- **Tratamento Elegante de Erros:** Todas as operações assíncronas, chamadas de API e manipulações de dados devem conter tratamento de exceções (try/catch, encadeamento de erros e estados de fallback na UI).

## 5. INSTRUÇÕES PERMANENTES PARA A INTELIGÊNCIA ARTIFICIAL
Ao gerar ou refatorar código:
1. **NÃO crie soluções em arquivo único.** Prefira sempre criar uma nova pasta/arquivo para isolar lógicas do que expandir um arquivo existente que já esteja grande.
2. **Forneça arquivos completos ou Diffs claros.** Nunca deixe placeholders do tipo `// TODO: implementar resto` ou `// ... código anterior continua aqui` se isso for quebrar o projeto.
3. **Mantenha a coerência arquitetural.** Antes de criar algo novo, siga o padrão estrutural já estabelecido nas outras pastas do projeto.