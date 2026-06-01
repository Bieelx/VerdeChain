# VerdeChain

VerdeChain é uma experiência interativa de inteligência ESG para cadeia de suprimentos, combinando monitoramento terrestre, zonas lunares, operações marcianas e logística espacial em uma única central visual.

O projeto foi construído como uma aplicação React com visualizações 3D, painéis operacionais, indicadores de risco e geração de relatório ESG em PDF.

## Visão Geral

A interface apresenta quatro modos principais:

- **Terra**: monitora fornecedores, risco ESG, alertas ambientais, desmatamento, focos de calor, carbono estimado e recomendações de IA.
- **Lua**: acompanha zonas de extração lunar, risco de esgotamento de recursos, reservas, varreduras orbitais e alertas ativos.
- **Marte**: exibe habitats, mineração, energia, agricultura, água, logs de missão e riscos atmosféricos.
- **Lançamento**: mostra missões em trânsito, manifesto de carga, combustível, linha do tempo e impacto ambiental.

## Principais Recursos

- Globo 3D interativo para Terra, Lua e Marte.
- Painéis laterais com detalhes por fornecedor ou zona operacional.
- Indicadores de risco por cor, severidade e tendência.
- Dados simulados para demonstração de inteligência ESG.
- Visualização 3D de foguete com estados de lançamento, trânsito e órbita.
- Geração de relatório ESG em PDF.
- Interface traduzida para pt-BR.

## Stack

- React
- Vite
- Tailwind CSS
- Three.js
- React Three Fiber
- React Three Drei
- Globe.gl
- Recharts
- jsPDF
- html2canvas

## Requisitos

- Node.js
- npm

> O projeto já inclui `package-lock.json`, então prefira `npm install` para reproduzir as versões travadas.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Depois abra o endereço exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

## Build de Produção

```bash
npm run build
```

Os arquivos finais serão gerados em:

```text
dist/
```

## Preview do Build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Estrutura do Projeto

```text
VerdeChain/
├── public/
│   └── textures/          # Texturas usadas pelos globos 3D
├── src/
│   ├── components/        # Componentes visuais e painéis
│   ├── data/              # Dados simulados de fornecedores, zonas e missões
│   ├── utils/             # Utilitários, incluindo geração de relatório ESG
│   ├── App.jsx            # Composição principal da aplicação
│   ├── main.jsx           # Entrada React
│   ├── App.css            # Estilos específicos da aplicação
│   └── index.css          # Estilos globais e Tailwind
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Dados Simulados

Os dados ficam em `src/data/`:

- `suppliers.js`: fornecedores terrestres e métricas ESG.
- `lunarZones.js`: zonas lunares, recursos, reservas e alertas.
- `marsZones.js`: zonas marcianas, operações, logs e recomendações de IA.
- `missionData.js`: missões espaciais, carga, combustível, linha do tempo e impacto.

Esses dados são mockados para demonstração e podem ser substituídos por APIs reais no futuro.

## Relatório ESG

Na visão **Terra**, o botão **Gerar Relatório ESG** cria um PDF com:

- resumo executivo;
- distribuição de risco;
- detalhamento por fornecedor;
- recomendações de IA;
- estimativas de carbono e conformidade.

A geração é feita em `src/utils/esgReport.js` usando `jsPDF`.

## Personalização

Para alterar textos, dados e cenários:

- edite os arquivos em `src/data/`;
- ajuste labels de interface nos componentes em `src/components/`;
- altere cores e tokens visuais em `tailwind.config.js`, `src/index.css` e `src/App.css`.

## Observações

- O diretório `dist/` contém o build gerado e não deve ser editado manualmente.
- O diretório `node_modules/` não faz parte do código-fonte da aplicação.
- A aplicação usa dados fictícios para fins de protótipo, apresentação e demonstração.

## Licença

Este projeto é privado e não define uma licença pública no momento.
