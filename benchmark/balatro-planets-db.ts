import type { BalatroPlanet } from './balatro-schemas';

/**
 * 발라트로 BalatroPlanet 데이터베이스
 * 총 12개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { BalatroPlanet } from './balatro-schemas';

export const balatroPlanets: BalatroPlanet[] = [
  {
    "id": "pluto",
    "name": "Pluto",
    "addition": "+1 Mult and +10 Chips",
    "pokerHand": "High Card",
    "handBaseScore": "1 Mult x 5 Chips",
    "type": "Dwarf Planet",
    "source": "balatro",
    "description": "+1 Mult and +10 Chips"
  },
  {
    "id": "mercury",
    "name": "Mercury",
    "addition": "+1 Mult and +15 Chips",
    "pokerHand": "Pair",
    "handBaseScore": "2 Mult x 10 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+1 Mult and +15 Chips"
  },
  {
    "id": "uranus",
    "name": "Uranus",
    "addition": "+1 Mult and +20 Chips",
    "pokerHand": "Two Pair",
    "handBaseScore": "2 Mult x 20 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+1 Mult and +20 Chips"
  },
  {
    "id": "venus",
    "name": "Venus",
    "addition": "+2 Mult and +20 Chips",
    "pokerHand": "Three of a Kind",
    "handBaseScore": "3 Mult x 30 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+2 Mult and +20 Chips"
  },
  {
    "id": "saturn",
    "name": "Saturn",
    "addition": "+3 Mult and +30 Chips",
    "pokerHand": "Straight",
    "handBaseScore": "4 Mult x 30 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+3 Mult and +30 Chips"
  },
  {
    "id": "jupiter",
    "name": "Jupiter",
    "addition": "+2 Mult and +15 Chips",
    "pokerHand": "Flush",
    "handBaseScore": "4 Mult x 35 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+2 Mult and +15 Chips"
  },
  {
    "id": "earth",
    "name": "Earth",
    "addition": "+2 Mult and +25 Chips",
    "pokerHand": "Full House",
    "handBaseScore": "4 Mult x 40 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+2 Mult and +25 Chips"
  },
  {
    "id": "mars",
    "name": "Mars",
    "addition": "+3 Mult and +30 Chips",
    "pokerHand": "Four of a Kind",
    "handBaseScore": "7 Mult x 60 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+3 Mult and +30 Chips"
  },
  {
    "id": "neptune",
    "name": "Neptune",
    "addition": "+4 Mult and +40 Chips",
    "pokerHand": "Straight Flush",
    "handBaseScore": "8 Mult x 100 Chips",
    "type": "Planet",
    "source": "balatro",
    "description": "+4 Mult and +40 Chips"
  },
  {
    "id": "planet_x",
    "name": "Planet X",
    "addition": "+3 Mult and +35 Chips",
    "pokerHand": "Five of a Kind",
    "handBaseScore": "12 Mult x 120 Chips",
    "type": "Planet?",
    "source": "balatro",
    "description": "+3 Mult and +35 Chips"
  },
  {
    "id": "ceres",
    "name": "Ceres",
    "addition": "+4 Mult and +40 Chips",
    "pokerHand": "Flush House",
    "handBaseScore": "14 Mult x 140 Chips",
    "type": "Dwarf Planet",
    "source": "balatro",
    "description": "+4 Mult and +40 Chips"
  },
  {
    "id": "eris",
    "name": "Eris",
    "addition": "+3 Mult and +50 Chips",
    "pokerHand": "Flush Five",
    "handBaseScore": "16 Mult x 160 Chips",
    "type": "Dwarf Planet",
    "source": "balatro",
    "description": "+3 Mult and +50 Chips"
  }
];

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function getBalatroPlanetById(id: string): BalatroPlanet | undefined {
  return balatroPlanets.find(item => item.id === id);
}

export function getBalatroPlanetsByName(name: string): BalatroPlanet[] {
  const lowerName = name.toLowerCase();
  return balatroPlanets.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function searchBalatroPlanets(query: string): BalatroPlanet[] {
  const lowerQuery = query.toLowerCase();
  return balatroPlanets.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}

export function getPlanetsByPokerHand(pokerHand: string): BalatroPlanet[] {
  return balatroPlanets.filter(p => 
    p.pokerHand && p.pokerHand.toLowerCase().includes(pokerHand.toLowerCase())
  );
}

export function getPlanetsByType(type: string): BalatroPlanet[] {
  return balatroPlanets.filter(p => p.type === type);
}

export function getPlanetById(id: string): BalatroPlanet | undefined {
  return balatroPlanets.find(p => p.id === id);
}

export function searchPlanets(query: string): BalatroPlanet[] {
  const lowerQuery = query.toLowerCase();
  return balatroPlanets.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}
