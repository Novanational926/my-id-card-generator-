/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedTemplate, CardConfig } from './types';

// Initial base default config structure
const baseDefaultConfig: CardConfig = {
  schoolNamePre: 'DOBOKA',
  schoolNameSuf: 'SR.',
  schoolNameLine2Pre: 'SEC. SCH',
  schoolNameLine2Suf: 'OOL',
  schoolLogo: '',
  principalName: 'principal sign',
  principalSign: '',
  session: '2026-2027',
  defaultClass: 'XII',
  estd: '2013',
  motto: 'LEARN LIKE A PRO SCORE LIKE A LEGEND',
  themeColor: '#D32F2F',
  gridBackground: true,
  draftGridType: 'fine-grid' as any,
  terms: [
    {
      id: 'term-1',
      label: 'Identification',
      text: 'Student must carry this card at all times inside campus and confirm identity.',
    },
    {
      id: 'term-2',
      label: 'Transferable',
      text: 'This card is strictly non-transferable and remains school property.',
    }
  ],
  schoolTitleLines: [
    { id: 'l1', text: 'DOBOKA SENIOR SECONDARY SCHOOL', fontSize: 16, bold: true, color: '#D32F2F', fontFamily: 'Inter' },
    { id: 'l2', text: 'AFFILIATED TO STATE EDUCATION BOARD', fontSize: 11, bold: false, color: '#475569', fontFamily: 'JetBrains Mono' }
  ],
  customTextBoxes: []
};

function clone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export const TEMPLATE_LIBRARY_DATA: SavedTemplate[] = [
  // SECTION 1: CLASSIC ACADEMIC (7 Layouts)
  {
    id: 'acad-crimson',
    name: 'Doboka Custom Crimson (Academic Frontrunner)',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#D32F2F',
      draftGridType: 'graph',
      schoolTitleLines: [
        { id: 'l1', text: 'DOBOKA SR. SEC. SCHOOL', fontSize: 17, bold: true, color: '#D32F2F', fontFamily: 'Inter', letterSpacing: 'wide' },
        { id: 'l2', text: 'ESTD 2013 | GOVERNMENT RECOGNIZED', fontSize: 10, bold: false, color: '#1e293b', fontFamily: 'JetBrains Mono', letterSpacing: 'normal' }
      ]
    }
  },
  {
    id: 'acad-oxford',
    name: 'Oxford Royal Navy Scholar',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#1e3a8a',
      draftGridType: 'double-rule',
      schoolTitleLines: [
        { id: 'l1', text: 'OXFORD RESIDENTIAL ACADEMY', fontSize: 16, bold: true, color: '#1e3a8a', fontFamily: 'Inter', letterSpacing: 'wide' },
        { id: 'l2', text: 'LEARNING FOR INTEGRITY & LEADERSHIP', fontSize: 9, bold: true, italic: true, color: '#64748b', fontFamily: 'Inter' }
      ],
      textStyles: {
        studentName: { bold: true, color: '#1E3A8A' }
      }
    }
  },
  {
    id: 'acad-forest',
    name: 'Forest Hill Boarding Green',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#0f5132',
      draftGridType: 'bounds',
      schoolTitleLines: [
        { id: 'l1', text: 'FOREST HILL PUBLIC SCHOOL', fontSize: 16, bold: true, color: '#0f5132', fontFamily: 'Inter' },
        { id: 'l2', text: 'ESTABLISHED 1984 | CHERRAPUNJI', fontSize: 10, color: '#334155', fontFamily: 'JetBrains Mono' }
      ],
      textStyles: {
        studentName: { bold: true, color: '#0f5132' }
      }
    }
  },
  {
    id: 'acad-amber',
    name: 'Warm Autumn Gold High School',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#d97706',
      draftGridType: 'radial',
      schoolTitleLines: [
        { id: 'l1', text: 'WESTMINSTER PREPARATORY', fontSize: 17, bold: true, color: '#d97706', fontFamily: 'Inter' },
        { id: 'l2', text: 'EXCELLENCE IN ART & SCIENCES', fontSize: 10, italic: true, color: '#78350f', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'acad-maroon',
    name: 'Imperial Burgundy Cambridge Varsity',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#800000',
      draftGridType: 'golden',
      schoolTitleLines: [
        { id: 'l1', text: 'CAMBRIDGE UNION SEMINARY', fontSize: 18, bold: true, color: '#800000', fontFamily: 'Inter' },
        { id: 'l2', text: 'HONORIS CAUSA | CLASS OF 2026', fontSize: 9, color: '#475569', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'acad-clara',
    name: 'Santa Clara Montessori Gold',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#b45309',
      draftGridType: 'crosshair',
      schoolTitleLines: [
        { id: 'l1', text: 'SANTA CLARA MONTESSORI', fontSize: 16, bold: true, color: '#b45309', fontFamily: 'Inter' },
        { id: 'l2', text: 'NURTURING CURIOSITY SINCE 2010', fontSize: 10, italic: true, color: '#451a03', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'acad-slate',
    name: 'Modernist Tech & Polytechnic Inst.',
    category: 'Classic Academic',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#334155',
      draftGridType: 'blueprint',
      schoolTitleLines: [
        { id: 'l1', text: 'APEX BENTO POLYTECHNIC', fontSize: 17, bold: true, color: '#334155', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'PRACTICAL DESIGN & FAULT CALCULUS', fontSize: 9, color: '#64748b', fontFamily: 'JetBrains Mono' }
      ]
    }
  },

  // SECTION 2: FUTURISTIC CYBER (7 Layouts)
  {
    id: 'cyber-neon-green',
    name: 'Matrix Cybernetic Core Node',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#10b981',
      draftGridType: 'matrix',
      schoolTitleLines: [
        { id: 'l1', text: 'CYBER-METROPOLIS ACADEMY', fontSize: 15, bold: true, color: '#10b981', fontFamily: 'JetBrains Mono', letterSpacing: 'widest' },
        { id: 'l2', text: 'SYSTEM NODE OVERRIDE 0x7FF', fontSize: 9, bold: true, color: '#047857', fontFamily: 'JetBrains Mono' }
      ],
      customTextBoxes: [
        { id: 'b1', label: 'BIO-SYNC CAP', value: 'APPROVED', side: 'front', offsetX: 10, offsetY: 300, fontSize: 10, color: '#10b981', bold: true, fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'cyber-neon-pink',
    name: 'Synthwave Nightride 2090 Pass',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#f43f5e',
      draftGridType: 'blueprint',
      schoolTitleLines: [
        { id: 'l1', text: 'KALEIDOSCOPE MUSIC SUBGRID', fontSize: 16, bold: true, color: '#f43f5e', fontFamily: 'Inter', letterSpacing: 'wide' },
        { id: 'l2', text: 'SONIC AUDIO DRAFT LABS', fontSize: 10, color: '#ec4899', fontFamily: 'JetBrains Mono' }
      ],
      customTextBoxes: [
        { id: 'b1', label: 'FREQUENCY', value: '142.8 MHz', side: 'front', offsetX: -10, offsetY: 310, fontSize: 11, color: '#db2777', bold: true }
      ]
    }
  },
  {
    id: 'cyber-deep-space',
    name: 'Interstellar Starflight Alliance',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#0ea5e9',
      draftGridType: 'radial',
      schoolTitleLines: [
        { id: 'l1', text: 'STARFLIGHT SPACE COMMAND', fontSize: 15, bold: true, color: '#0ea5e9', fontFamily: 'Inter' },
        { id: 'l2', text: 'ORBITAL PATROL SECTOR 9', fontSize: 9, color: '#38bdf8', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'cyber-android',
    name: 'Antigravity Robotics Vault Access',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#8b5cf6',
      draftGridType: 'isometric',
      schoolTitleLines: [
        { id: 'l1', text: 'AI SYNERGIES QUANTUM LABS', fontSize: 16, bold: true, color: '#8b5cf6', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'ANTIGRAVITY CORE CONTROLLER', fontSize: 10, color: '#a78bfa', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'cyber-solar',
    name: 'Helios Solar Fusion Station',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#f59e0b',
      draftGridType: 'golden',
      schoolTitleLines: [
        { id: 'l1', text: 'HELIOS ENERGY CONSORTIUM', fontSize: 16, bold: true, color: '#f59e0b', fontFamily: 'Inter' },
        { id: 'l2', text: 'MEGAWATT DECK GRID REPAIR', fontSize: 10, color: '#d97706', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'cyber-quantum',
    name: 'Sub-Atomic Quantum Telemetry',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#06b6d4',
      draftGridType: 'crosshair',
      schoolTitleLines: [
        { id: 'l1', text: 'QUANTUM PARTICLES DEPT', fontSize: 17, bold: true, color: '#06b6d4', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'PARTICLE ALIGNMENT ACCELERATOR', fontSize: 9, color: '#0891b2', fontFamily: 'JetBrains Mono' }
      ],
      customTextBoxes: [
        { id: 'b1', label: 'DECAY RATE', value: '1.43 ms', side: 'front', offsetX: 0, offsetY: 290, fontSize: 11, color: '#0891b2', bold: true }
      ]
    }
  },
  {
    id: 'cyber-abyssal',
    name: 'DeepSea Oceanographic Depths',
    category: 'Futuristic Cyber',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#14b8a6',
      draftGridType: 'blue-grid' as any,
      schoolTitleLines: [
        { id: 'l1', text: 'ABYSSAL RESEARCH INITIATIVE', fontSize: 16, bold: true, color: '#14b8a6', fontFamily: 'Inter' },
        { id: 'l2', text: 'MARINE LIFE SPECIMEN STATION', fontSize: 9, color: '#0d9488', fontFamily: 'JetBrains Mono' }
      ]
    }
  },

  // SECTION 3: CORPORATE MINIMAL (7 Layouts)
  {
    id: 'corp-swiss',
    name: 'Zurich Swiss Helvetica Tech',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#18181b',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'ZURICH ANALYTICS LABS', fontSize: 18, bold: true, color: '#18181b', fontFamily: 'Inter', letterSpacing: 'tight' },
        { id: 'l2', text: 'DATA ENGINEERING DEPT.', fontSize: 11, color: '#71717a', fontFamily: 'Inter' }
      ],
      textStyles: {
        studentName: { bold: true, color: '#18181b' }
      }
    }
  },
  {
    id: 'corp-nordic',
    name: 'Nordic Clean Pale Platinum',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#475569',
      draftGridType: 'graph',
      schoolTitleLines: [
        { id: 'l1', text: 'NORDIC HOUSING COOPERATIVE', fontSize: 15, bold: true, color: '#475569', fontFamily: 'Inter' },
        { id: 'l2', text: 'ARCHITECTS COMMITTEE MEMBER', fontSize: 10, color: '#64748b', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'corp-tokyo',
    name: 'Tokyo Zen Crimson Carbon',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#b91c1c',
      draftGridType: 'double-rule',
      schoolTitleLines: [
        { id: 'l1', text: 'TOKYO SEISMIC LOGIC INC', fontSize: 16, bold: true, color: '#b91c1c', fontFamily: 'Inter' },
        { id: 'l2', text: 'GEOLOGICAL IMPACT TEAM', fontSize: 9, color: '#4b5563', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'corp-charcoal',
    name: 'Matte Charcoal Tech Exec',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#27272a',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'MATTE POLYMERS CORP', fontSize: 17, bold: true, color: '#27272a', fontFamily: 'Inter' },
        { id: 'l2', text: 'EXECUTIVE COMMITTEE BOARD MEMBER', fontSize: 9, color: '#71717a', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'corp-medical',
    name: 'Surgical Hospital Blue-Green',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#0d9488',
      draftGridType: 'bounds',
      schoolTitleLines: [
        { id: 'l1', text: 'METRO MEDICARE GENERAL', fontSize: 16, bold: true, color: '#0d9488', fontFamily: 'Inter' },
        { id: 'l2', text: 'CARDIOLOGY & SURGERY STAFF', fontSize: 10, color: '#0f766e', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'corp-legal',
    name: 'Lexington Legal & Notary Seal',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#78350f',
      draftGridType: 'golden',
      schoolTitleLines: [
        { id: 'l1', text: 'LEXINGTON ATTORNEYS CO', fontSize: 17, bold: true, color: '#78350f', fontFamily: 'Inter' },
        { id: 'l2', text: 'SENIOR ASSOCIATE COUNSELOR', fontSize: 10, italic: true, color: '#451a03', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'corp-royal',
    name: 'Royal Heritage Real Estate',
    category: 'Corporate Minimal',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#047857',
      draftGridType: 'crosshair',
      schoolTitleLines: [
        { id: 'l1', text: 'ROYAL HERITAGE ESTATE COUNCIL', fontSize: 15, bold: true, color: '#047857', fontFamily: 'Inter' },
        { id: 'l2', text: 'PREMIUM LAND ACQUISITIONS', fontSize: 9, color: '#065f46', fontFamily: 'Inter' }
      ]
    }
  },

  // SECTION 4: NEON BRUTALIST (7 Layouts)
  {
    id: 'brut-toxic',
    name: 'Toxic Cybernetic Acid Neon',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#84cc16',
      draftGridType: 'matrix',
      schoolTitleLines: [
        { id: 'l1', text: 'TOXIC RESIDUE INCUBATOR', fontSize: 18, bold: true, color: '#27272a', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'BIOHAZARD RECOVERY AGENT', fontSize: 11, bold: true, color: '#ef4444', fontFamily: 'JetBrains Mono' }
      ],
      customTextBoxes: [
        { id: 'b1', label: 'RAD-LEVEL', value: 'FATAL (MAX)', side: 'front', offsetX: 10, offsetY: 300, fontSize: 11, color: '#ef4444', bold: true, fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-caution',
    name: 'High-Voltage Construction Danger',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#eab308',
      draftGridType: 'double-rule',
      schoolTitleLines: [
        { id: 'l1', text: 'HIGH VOLTAGE POWER NODE', fontSize: 17, bold: true, color: '#18181b', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'Authorized Sub-station Guard', fontSize: 10, color: '#18181b', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-pink',
    name: 'Fuchsia Hyper-Pop Sound Clash',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#d946ef',
      draftGridType: 'graph',
      schoolTitleLines: [
        { id: 'l1', text: 'FUCHSIA CLUB INFERNO', fontSize: 18, bold: true, color: '#d946ef', fontFamily: 'Inter' },
        { id: 'l2', text: 'SOUNDSTAGE VIP PASS 100% RAW', fontSize: 10, color: '#a21caf', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-cobalt',
    name: 'Brutalist Raw Blue-Gold',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#2563eb',
      draftGridType: 'isometric',
      schoolTitleLines: [
        { id: 'l1', text: 'COBALT HEAVY CASTINGS', fontSize: 17, bold: true, color: '#2563eb', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'STRUCTURAL REINFORCEMENT DIVISION', fontSize: 9, color: '#b45309', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-volcano',
    name: 'Volcanic Basalt Ash Melt',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#ea580c',
      draftGridType: 'crosshair',
      schoolTitleLines: [
        { id: 'l1', text: 'BASALT MAGMA FORGES', fontSize: 18, bold: true, color: '#ea580c', fontFamily: 'Inter' },
        { id: 'l2', text: 'FURNACE VENTILATION ENGINES', fontSize: 9, color: '#7c2d12', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-cyber-cyan',
    name: 'Deep Cyberpunk Glitch Cyan',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#06b6d4',
      draftGridType: 'matrix',
      schoolTitleLines: [
        { id: 'l1', text: 'GLITCH DETECTOR CORE V2', fontSize: 16, bold: true, color: '#06b6d4', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'BUFFER OVERFLOW RESEARCH GROUP', fontSize: 9, color: '#0891b2', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'brut-mono',
    name: 'Raw Technical Concrete Mono',
    category: 'Neon Brutalist',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#09090b',
      draftGridType: 'bounds',
      schoolTitleLines: [
        { id: 'l1', text: 'TECHNICAL HOUSING UNIT 04', fontSize: 18, bold: true, color: '#09090b', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'ZONING & THERMAL RESISTANCE', fontSize: 9, color: '#52525b', fontFamily: 'JetBrains Mono' }
      ]
    }
  },

  // SECTION 5: RETRO VARSITY (7 Layouts)
  {
    id: 'ret-navy-gold',
    name: 'Vintage Boarding Ivy Navy',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#1d4ed8',
      draftGridType: 'golden',
      schoolTitleLines: [
        { id: 'l1', text: 'HARVARD ROWING ALLIANCE', fontSize: 17, bold: true, color: '#1d4ed8', fontFamily: 'Inter' },
        { id: 'l2', text: 'Varsity Coxswain Quartermaster', fontSize: 10, italic: true, color: '#b45309', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'ret-prep-crimson',
    name: 'Rugby Crimson Prep School',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#991b1b',
      draftGridType: 'double-rule',
      schoolTitleLines: [
        { id: 'l1', text: 'MILTON RUGBY CONFERENCE', fontSize: 16, bold: true, color: '#991b1b', fontFamily: 'Inter' },
        { id: 'l2', text: 'First XV Lock / Wing Scholar', fontSize: 11, italic: true, color: '#451a03', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'ret-mustard',
    name: 'Old-School Varsity Stadium Gold',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#b45309',
      draftGridType: 'radial',
      schoolTitleLines: [
        { id: 'l1', text: 'DETROIT ATHLETIC SHIELD', fontSize: 18, bold: true, color: '#b45309', fontFamily: 'Inter' },
        { id: 'l2', text: 'ALL-STATE CHAMPIONS DIVISION', fontSize: 9, color: '#1e293b', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'ret-green-gold',
    name: 'Bayou Forest Country Club',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#15803d',
      draftGridType: 'graph',
      schoolTitleLines: [
        { id: 'l1', text: 'BAYOU COUNTRY GOLF CLUB', fontSize: 16, bold: true, color: '#15803d', fontFamily: 'Inter' },
        { id: 'l2', text: 'SENIOR INSTRUCTOR PRO-SHOP', fontSize: 9, color: '#047857', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'ret-copper',
    name: 'Antique Copper Steamwork Union',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#c2410c',
      draftGridType: 'crosshair',
      schoolTitleLines: [
        { id: 'l1', text: 'STEAMPUNK LOCOMOTIVE ASSN', fontSize: 17, bold: true, color: '#c2410c', fontFamily: 'Inter' },
        { id: 'l2', text: 'BOILER PRESSURE OPERATIONS', fontSize: 9, color: '#431407', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'ret-retro-cyan',
    name: 'Arcade Space Invaders Cyan',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#0891b2',
      draftGridType: 'isometric',
      schoolTitleLines: [
        { id: 'l1', text: 'ARCADE CENTRAL REPLICATOR', fontSize: 16, bold: true, color: '#0891b2', fontFamily: 'JetBrains Mono' },
        { id: 'l2', text: 'HIGH-SCORE DIVISION OPERATOR', fontSize: 10, color: '#155e75', fontFamily: 'JetBrains Mono' }
      ]
    }
  },
  {
    id: 'ret-silver',
    name: 'Historical Archive Silver Steel',
    category: 'Retro Varsity',
    timestamp: 'PRO PRESET',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      themeColor: '#4b5563',
      draftGridType: 'bounds',
      schoolTitleLines: [
        { id: 'l1', text: 'ANTIQUE RECORDS ARCHIVE', fontSize: 17, bold: true, color: '#4b5563', fontFamily: 'Inter' },
        { id: 'l2', text: 'DEPARTMENTAL DEPUTY REGISTRAR', fontSize: 9, color: '#1f2937', fontFamily: 'Inter' }
      ]
    }
  },
  // SECTION 6: PREMIUM INSTANT GRAPHICS (9 PDF Designs)
  {
    id: 'pdf-pathway-orange',
    name: 'Pathway Partners (Daniel Woodley Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'pathway',
      themeColor: '#EA580C',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'SCHOOL NAME', fontSize: 15, bold: true, color: '#1a1a1a', fontFamily: 'Space Grotesk', letterSpacing: 'wide' }
      ],
      terms: [
        { id: 'term-1', label: 'Term A', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed purus hendrerit.' },
        { id: 'term-2', label: 'Term B', text: 'consequat eros at, faucibus leo. Duis ornare tempus lacus id porta.' }
      ]
    }
  },
  {
    id: 'pdf-ingoude-kimberly',
    name: 'Ingoude Company (Kimberly Nguyen Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'ingoude-kimberly',
      themeColor: '#1a1a1a',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'INGOUDE COMPANY', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Inter', letterSpacing: 'widest' }
      ]
    }
  },
  {
    id: 'pdf-ingoude-francois',
    name: 'Ingoude Corporate (Francois Mercer Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'ingoude-francois',
      themeColor: '#D97706',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'Ingoude Company', fontSize: 14, bold: true, color: '#1a1a1a', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'pdf-energized-blue',
    name: 'Energized Theme (Katie Lawson Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'energized',
      themeColor: '#1E3A8A',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'ENERGIZED', fontSize: 15, bold: true, color: '#1E3A8A', fontFamily: 'Space Grotesk', letterSpacing: 'widest' }
      ]
    }
  },
  {
    id: 'pdf-shodwe-red',
    name: 'Studio Shodwe (Cia Rodriguez Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'shodwe-cia',
      themeColor: '#800000',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'STUDIO SHODWE', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Space Grotesk', letterSpacing: 'wide' }
      ]
    }
  },
  {
    id: 'pdf-ingoude-morgan',
    name: 'Ingoude Minimal (Morgan Maxwell Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'ingoude-morgan',
      themeColor: '#1e3a8a',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'Ingoude Company', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'pdf-studio-marceline',
    name: 'Studio Elegant (Marceline Anderson Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'studio-marceline',
      themeColor: '#1a1a1a',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'STUDIO SHODWE', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Inter', letterSpacing: 'wide' }
      ]
    }
  },
  {
    id: 'pdf-hexagonal-gallego',
    name: 'Hexagonal Corporate (Daniel Gallego Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'hexagonal-gallego',
      themeColor: '#15803D',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'Shodwe Company', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'pdf-ginyard-shawn',
    name: 'Ginyard International (Shawn Garcia Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'ginyard-shawn',
      themeColor: '#0ea5e9',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'Ginyard International Co.', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Inter' }
      ]
    }
  },
  {
    id: 'pdf-larana-navy',
    name: 'Larana Corporate (Howard Ong Premium)',
    category: 'Canva PDF Imports',
    timestamp: 'CANVA RESTORED',
    isSystem: true,
    config: {
      ...clone(baseDefaultConfig),
      layoutStyle: 'larana-navy',
      themeColor: '#023E73',
      draftGridType: 'none',
      schoolTitleLines: [
        { id: 'l1', text: 'Larana. Inc', fontSize: 15, bold: true, color: '#111111', fontFamily: 'Playfair Display' }
      ],
      terms: [
        { id: 'term-1', label: 'Identification', text: 'Employees must carry their ID card at all times within company premises for security and verification.' },
        { id: 'term-2', label: 'Usage', text: 'The ID card is company property, strictly personal, and must not be shared, duplicated, or used for unauthorized purposes.' }
      ]
    }
  }
];
