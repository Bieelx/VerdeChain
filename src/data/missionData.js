export const MISSIONS = [
  {
    id: 'vcl-01',
    name: 'Implantação de Monitoramento Lunar VerdeChain',
    shortName: 'VCL-01',
    origin: 'earth',
    destination: 'moon',
    phase: 'transit',
    missionDay: 3,
    distanceTraveled: 287450,
    totalDistance: 384400,
    fuelRemaining: 24,
    nextCommsWindow: '14:32 UTC',
    cargoIntegrity: 99.2,

    cargo: [
      {
        category: 'Equipamentos de monitoramento ambiental',
        icon: '📡',
        items: [
          { name: 'Satélites de sensores orbitais (×4)', weight: 1240, volume: 8.4, destination: 'Órbita lunar', priority: 'critical' },
          { name: 'Unidade de analisador espectrográfico', weight: 340, volume: 2.1, destination: 'Superfície lunar', priority: 'critical' },
          { name: 'Matriz de radar de penetração no solo', weight: 580, volume: 3.8, destination: 'Zona Shackleton', priority: 'standard' },
        ],
      },
      {
        category: 'Sistemas de implantação de satélites',
        icon: '🛰',
        items: [
          { name: 'Estrutura de implantação', weight: 420, volume: 5.2, destination: 'Órbita lunar', priority: 'critical' },
          { name: 'Unidades de controle de atitude (×4)', weight: 180, volume: 1.6, destination: 'Órbita lunar', priority: 'critical' },
        ],
      },
      {
        category: 'Reservas de combustível',
        icon: '⚗',
        items: [
          { name: 'Propelente do estágio de descida', weight: 8400, volume: 12.0, destination: 'Órbita lunar', priority: 'critical' },
          { name: 'Combustível dos propulsores RCS', weight: 260, volume: 0.8, destination: 'Em trânsito', priority: 'standard' },
        ],
      },
      {
        category: 'Equipamentos de suporte',
        icon: '🔧',
        items: [
          { name: 'Pacote de retransmissão de comunicação', weight: 145, volume: 1.2, destination: 'Superfície lunar', priority: 'standard' },
          { name: 'Kit de componentes sobressalentes', weight: 89, volume: 0.6, destination: 'Diversos', priority: 'optional' },
        ],
      },
    ],

    fuel: {
      type: 'Metano líquido (CH₄) + oxigênio líquido (LOX)',
      loaded: 1200000,
      consumed: 908000,
      burnRate: 0,
      energyCost: 4240,
      co2Emissions: 3420,
      treesToOffset: 171000,
      reuseReduction: 38,
      carbonCredits: 620,
    },

    timeline: [
      { id: 'launch-window', name: 'Janela de lançamento', est: '2026-05-28T14:32:00Z', actual: '2026-05-28T14:32:17Z', status: 'completed', details: 'Janela de lançamento aberta em T-0:00. Todos os sistemas nominais. Ignição confirmada nos 6 motores Raptor. Veículo deixou a torre em T+7s.' },
      { id: 'max-q', name: 'Max-Q', est: '2026-05-28T14:33:47Z', actual: '2026-05-28T14:33:52Z', status: 'completed', details: 'Pressão aerodinâmica máxima aos 83 segundos. Pressão dinâmica de 78,2 kPa. Cargas estruturais dentro dos parâmetros nominais. Redução e recuperação de aceleração confirmadas.' },
      { id: 'meco', name: 'Separação de estágio', est: '2026-05-28T14:36:00Z', actual: '2026-05-28T14:36:03Z', status: 'completed', details: 'Corte do motor principal e separação do primeiro estágio confirmados. Booster executando queima de retorno. Ignição nominal do Raptor Vacuum do estágio superior.' },
      { id: 'tli', name: 'Injeção translunar', est: '2026-05-28T16:45:00Z', actual: '2026-05-28T16:44:58Z', status: 'completed', details: 'Queima TLI concluída. Queima do estágio superior por 6 minutos. Energia C3: -1,86 km²/s². Trajetória confirmada para interceptação lunar em 72 horas.' },
      { id: 'mcc', name: 'Correção de meio curso', est: '2026-05-30T08:00:00Z', actual: null, status: 'in-progress', details: 'Pequena queima de ajuste de trajetória em andamento. Delta-V 4,2 m/s. Execução nominal. Desvio da trajetória nominal: 0,003°.' },
      { id: 'loi', name: 'Inserção orbital lunar', est: '2026-06-01T22:00:00Z', actual: null, status: 'upcoming', details: 'A queima LOI colocará o veículo em órbita lunar circular de 100 km. Duração da queima: ~18 min. Todos os sistemas de navegação nominais.' },
      { id: 'deployment', name: 'Implantação de satélites', est: '2026-06-02T10:00:00Z', actual: null, status: 'upcoming', details: 'Implantação sequencial de 4 satélites de monitoramento ambiental a partir do compartimento de carga em uma janela de 6 horas.' },
    ],

    impact: {
      co2Emissions: 3420,
      reuseReduction: 38,
      carbonCredits: 620,
      treesPlanted: 3000,
      netImpactScore: 71,
      forestProtected: 50000,
      previousMissionImprovement: -14,
      statement: 'Esta missão implanta infraestrutura de monitoramento que protegerá cerca de 50.000 hectares de zonas sensíveis de recursos lunares nos próximos 10 anos, fornecendo dados de referência críticos para uma política de extração responsável.',
    },
  },

  {
    id: 'vcm-02',
    name: 'Reabastecimento da Base Marciana VerdeChain',
    shortName: 'VCM-02',
    origin: 'earth',
    destination: 'mars',
    phase: 'transit',
    missionDay: 47,
    distanceTraveled: 82400000,
    totalDistance: 225000000,
    fuelRemaining: 61,
    nextCommsWindow: '09:14 UTC',
    cargoIntegrity: 97.8,

    cargo: [
      {
        category: 'Módulos de habitat',
        icon: '🏗',
        items: [
          { name: 'Módulo habitável pressurizado B2', weight: 12400, volume: 180, destination: 'Habitat Jezero', priority: 'critical' },
          { name: 'Cápsula de abrigo emergencial', weight: 2100, volume: 28, destination: 'Habitat Jezero', priority: 'critical' },
          { name: 'Unidade de extensão da câmara de ar', weight: 1840, volume: 22, destination: 'Habitat Jezero', priority: 'standard' },
        ],
      },
      {
        category: 'Equipamentos agrícolas',
        icon: '🌱',
        items: [
          { name: 'Matrizes de cultivo hidropônico (×6)', weight: 3200, volume: 45, destination: 'Habitat Jezero', priority: 'critical' },
          { name: 'Processador de água ISRU', weight: 1580, volume: 18, destination: 'Bacia Hellas', priority: 'critical' },
          { name: 'Sistema de correção de solo', weight: 940, volume: 12, destination: 'Habitat Jezero', priority: 'standard' },
        ],
      },
      {
        category: 'Equipamentos de monitoramento ambiental',
        icon: '📡',
        items: [
          { name: 'Sensores de poeira atmosférica (×12)', weight: 180, volume: 2.4, destination: 'Locais diversos', priority: 'critical' },
          { name: 'Matriz de detecção de metano', weight: 320, volume: 4.1, destination: 'Olympus Mons', priority: 'standard' },
        ],
      },
      {
        category: 'Suprimentos de alimento e água',
        icon: '🥫',
        items: [
          { name: 'Pacotes alimentares de longa duração (6 meses)', weight: 2400, volume: 32, destination: 'Habitat Jezero', priority: 'critical' },
          { name: 'Reservas de água (1000 L)', weight: 1000, volume: 1.2, destination: 'Habitat Jezero', priority: 'critical' },
          { name: 'Kit de suprimentos médicos', weight: 145, volume: 1.8, destination: 'Habitat Jezero', priority: 'standard' },
        ],
      },
    ],

    fuel: {
      type: 'Metano líquido (CH₄) + oxigênio líquido (LOX)',
      loaded: 1200000,
      consumed: 468000,
      burnRate: 0,
      energyCost: 4240,
      co2Emissions: 3420,
      treesToOffset: 171000,
      reuseReduction: 42,
      carbonCredits: 850,
    },

    timeline: [
      { id: 'launch-window', name: 'Janela de lançamento', est: '2026-04-15T06:00:00Z', actual: '2026-04-15T06:00:44Z', status: 'completed', details: 'Janela ideal de transferência para Marte. Massa de lançamento: 1.980 toneladas. Todos os 6 motores Raptor acenderam nominalmente. Carga útil máxima para configuração TMI.' },
      { id: 'max-q', name: 'Max-Q', est: '2026-04-15T06:01:52Z', actual: '2026-04-15T06:01:58Z', status: 'completed', details: 'Pico de pressão dinâmica de 82 kPa em T+78s, altitude de 13,2 km. Recuperação de aceleração confirmada. Todas as cargas estruturais dentro das margens.' },
      { id: 'meco', name: 'Separação de estágio', est: '2026-04-15T06:05:10Z', actual: '2026-04-15T06:05:12Z', status: 'completed', details: 'Primeiro estágio separado com sucesso e executando queima autônoma de pouso. Estágio superior confirmado em órbita de estacionamento.' },
      { id: 'tmi', name: 'Injeção transmarciana', est: '2026-04-15T09:20:00Z', actual: '2026-04-15T09:19:44Z', status: 'completed', details: 'Queima TMI de 8 min 42 s. Órbita heliocêntrica de transferência confirmada. Fase de cruzeiro iniciada. Matriz solar implantada.' },
      { id: 'mcc1', name: 'Correção MCC-1', est: '2026-04-22T12:00:00Z', actual: '2026-04-22T11:58:30Z', status: 'completed', details: 'Primeira queima de correção de meio curso. Trajetória refinada dentro do corredor-alvo de 12 km na chegada a Marte.' },
      { id: 'mcc2', name: 'Correção MCC-2', est: '2026-06-01T08:00:00Z', actual: null, status: 'in-progress', details: 'Segunda queima de correção de curso em execução. Delta-V 2,8 m/s. Solução de navegação estável.' },
      { id: 'moi', name: 'Inserção orbital marciana', est: '2026-10-02T14:30:00Z', actual: null, status: 'upcoming', details: 'A queima MOI fará a captura em órbita elíptica inicial de 250×100.000 km antes das manobras de circularização.' },
      { id: 'edl', name: 'Entrada / Descida / Pouso', est: '2026-10-08T22:15:00Z', actual: null, status: 'upcoming', details: 'Sequência EDL: entrada atmosférica a 5,8 km/s, aquecimento do aeroshell, retropropulsão supersônica e pouso motorizado em Jezero.' },
    ],

    impact: {
      co2Emissions: 3420,
      reuseReduction: 42,
      carbonCredits: 850,
      treesPlanted: 4000,
      netImpactScore: 68,
      forestProtected: 120000,
      previousMissionImprovement: -8,
      statement: 'Esta missão de reabastecimento viabiliza presença humana de longo prazo em Marte, apoiando operações de monitoramento ambiental que protegerão 120.000 hectares de formações geológicas marcianas sensíveis ao longo do ciclo de vida da missão.',
    },
  },

  {
    id: 'vco-03',
    name: 'Manutenção de Satélites VerdeChain',
    shortName: 'VCO-03',
    origin: 'moon',
    destination: 'moon',
    phase: 'orbital',
    missionDay: 12,
    distanceTraveled: 4820,
    totalDistance: 6280,
    fuelRemaining: 44,
    nextCommsWindow: '16:47 UTC',
    cargoIntegrity: 100,

    cargo: [
      {
        category: 'Ferramentas de manutenção de satélites',
        icon: '🔧',
        items: [
          { name: 'Braços robóticos de serviço (×2)', weight: 340, volume: 4.2, destination: 'Órbita', priority: 'critical' },
          { name: 'Kits de substituição de sensores (×6)', weight: 84, volume: 1.1, destination: 'VCL-SAT-01 a 04', priority: 'critical' },
          { name: 'Conjunto de substituição de painel solar', weight: 120, volume: 2.8, destination: 'VCL-SAT-02', priority: 'standard' },
        ],
      },
      {
        category: 'Ferramentas de extração de recursos',
        icon: '⛏',
        items: [
          { name: 'Contêineres de amostras de regolito (×24)', weight: 48, volume: 0.8, destination: 'Superfície lunar', priority: 'standard' },
          { name: 'Sonda de extração de gelo de água', weight: 210, volume: 1.6, destination: 'Zona Shackleton', priority: 'critical' },
        ],
      },
      {
        category: 'Reservas de combustível',
        icon: '⚗',
        items: [
          { name: 'Reabastecimento de propelente dos satélites', weight: 280, volume: 0.9, destination: 'Constelação VCL-SAT', priority: 'critical' },
          { name: 'Reserva de inserção orbital', weight: 140, volume: 0.4, destination: 'Em órbita', priority: 'standard' },
        ],
      },
    ],

    fuel: {
      type: 'Hidrazina (N₂H₄) + tetróxido de nitrogênio (NTO)',
      loaded: 8200,
      consumed: 4592,
      burnRate: 0.8,
      energyCost: 142,
      co2Emissions: 82,
      treesToOffset: 4100,
      reuseReduction: 0,
      carbonCredits: 100,
    },

    timeline: [
      { id: 'loi', name: 'Inserção em órbita lunar', est: '2026-05-20T08:15:00Z', actual: '2026-05-20T08:14:58Z', status: 'completed', details: 'Transferência da órbita de preparação Terra-Lua L1 para órbita lunar circular de 100 km. Queima de inserção nominal.' },
      { id: 'rendezvous-1', name: 'Encontro SAT-01', est: '2026-05-21T14:30:00Z', actual: '2026-05-21T14:31:15Z', status: 'completed', details: 'Operações de proximidade com VCL-SAT-01. Captura nominal. Braço robótico de serviço implantado com sucesso.' },
      { id: 'service-1', name: 'Serviço SAT-01', est: '2026-05-22T06:00:00Z', actual: '2026-05-22T05:48:22Z', status: 'completed', details: '3 módulos de sensores substituídos. Pacote de baterias recarregado via umbilical. Todos os sistemas restaurados para desempenho nominal.' },
      { id: 'rendezvous-2', name: 'Encontro SAT-02', est: '2026-05-24T10:00:00Z', actual: '2026-05-24T10:02:44Z', status: 'completed', details: 'Manobra de fase concluída. SAT-02 capturado. Degradação do painel solar confirmada, substituição em andamento.' },
      { id: 'service-2', name: 'Serviço SAT-02', est: '2026-05-25T08:00:00Z', actual: null, status: 'in-progress', details: 'Substituição do painel solar em andamento. Novos painéis instalados. Verificação de desempenho do sistema de energia em curso.' },
      { id: 'service-34', name: 'Serviço SAT-03/04', est: '2026-06-02T08:00:00Z', actual: null, status: 'upcoming', details: 'Passagem combinada de serviço para SAT-03 e SAT-04. Transferência de propelente e sequência completa de calibração de sensores.' },
      { id: 'deorbit', name: 'Missão concluída / Desorbitar', est: '2026-06-04T16:00:00Z', actual: null, status: 'upcoming', details: 'Queima de desorbitação mirando zona de recuperação para resgate futuro. Constelação deixada em estado totalmente operacional.' },
    ],

    impact: {
      co2Emissions: 82,
      reuseReduction: 0,
      carbonCredits: 100,
      treesPlanted: 200,
      netImpactScore: 88,
      forestProtected: 50000,
      previousMissionImprovement: 6,
      statement: 'Ao manter a constelação de satélites VerdeChain em desempenho máximo, esta missão estende a vida operacional da rede de monitoramento em 4 anos, protegendo 50.000 hectares de florestas rastreadas e zonas de recursos contra perturbações não detectadas.',
    },
  },
]

export function getMissionById(id) {
  return MISSIONS.find((m) => m.id === id)
}

export const PHASE_LABELS = {
  'pre-launch': 'Pré-lançamento',
  transit: 'Trânsito',
  orbital: 'Orbital',
  landed: 'Pousada',
}

export const PHASE_COLORS = {
  'pre-launch': '#ffd700',
  transit: '#0066ff',
  orbital: '#00d4ff',
  landed: '#00ff88',
}
