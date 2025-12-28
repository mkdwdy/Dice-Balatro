import type { BalatroBooster } from './balatro-schemas';

/**
 * 발라트로 BalatroBooster 데이터베이스
 * 총 17개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { BalatroBooster } from './balatro-schemas';

export const balatroBoosters: BalatroBooster[] = [
  {
    "id": "standard_packs_normal",
    "packName": "Standard Packs",
    "cost": 4,
    "size": "normal",
    "description": "Choose 1 of up to 3 Playing cards to add to your deck",
    "effect": "Choose 1 of up to 3 Playing cards to add to your deck",
    "source": "balatro"
  },
  {
    "id": "standard_packs_jumbo",
    "packName": "Standard Packs",
    "cost": 6,
    "size": "jumbo",
    "description": "Choose 1 of up to 5 Playing cards to add to your deck",
    "effect": "Choose 1 of up to 5 Playing cards to add to your deck",
    "source": "balatro"
  },
  {
    "id": "standard_packs_mega",
    "packName": "Standard Packs",
    "cost": 8,
    "size": "mega",
    "description": "Choose 2 of up to 5 Playing cards to add to your deck",
    "effect": "Choose 2 of up to 5 Playing cards to add to your deck",
    "source": "balatro"
  },
  {
    "id": "arcana_packs_normal",
    "packName": "Arcana Packs",
    "cost": 4,
    "size": "normal",
    "description": "Choose 1 of up to 3Tarot cards to be used immediately",
    "effect": "Choose 1 of up to 3Tarot cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "arcana_packs_jumbo",
    "packName": "Arcana Packs",
    "cost": 6,
    "size": "jumbo",
    "description": "Choose 1 of up to 5Tarot cards to be used immediately",
    "effect": "Choose 1 of up to 5Tarot cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "arcana_packs_mega",
    "packName": "Arcana Packs",
    "cost": 8,
    "size": "mega",
    "description": "Choose 2 of up to 5Tarot cards to be used immediately",
    "effect": "Choose 2 of up to 5Tarot cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "celestial_packs_normal",
    "packName": "Celestial Packs",
    "cost": 4,
    "size": "normal",
    "description": "Choose 1 of up to 3Planet cards to be used immediately",
    "effect": "Choose 1 of up to 3Planet cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "celestial_packs_jumbo",
    "packName": "Celestial Packs",
    "cost": 6,
    "size": "jumbo",
    "description": "Choose 1 of up to 5Planet cards to be used immediately",
    "effect": "Choose 1 of up to 5Planet cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "celestial_packs_mega",
    "packName": "Celestial Packs",
    "cost": 8,
    "size": "mega",
    "description": "Choose 2 of up to 5Planet cards to be used immediately",
    "effect": "Choose 2 of up to 5Planet cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "buffoon_packs_normal",
    "packName": "Buffoon Packs",
    "cost": 4,
    "size": "normal",
    "description": "Choose 1 of up to 2 Joker cards",
    "effect": "Choose 1 of up to 2 Joker cards",
    "source": "balatro"
  },
  {
    "id": "buffoon_packs_jumbo",
    "packName": "Buffoon Packs",
    "cost": 6,
    "size": "jumbo",
    "description": "Choose 1 of up to 4 Joker cards",
    "effect": "Choose 1 of up to 4 Joker cards",
    "source": "balatro"
  },
  {
    "id": "buffoon_packs_mega",
    "packName": "Buffoon Packs",
    "cost": 8,
    "size": "mega",
    "description": "Choose 2 of up to 4 Joker cards",
    "effect": "Choose 2 of up to 4 Joker cards",
    "source": "balatro"
  },
  {
    "id": "spectral_packs_normal",
    "packName": "Spectral Packs",
    "cost": 4,
    "size": "normal",
    "description": "Choose 1 of up to 2Spectral cards to be used immediately",
    "effect": "Choose 1 of up to 2Spectral cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "spectral_packs_jumbo",
    "packName": "Spectral Packs",
    "cost": 6,
    "size": "jumbo",
    "description": "Choose 1 of up to 4Spectral cards to be used immediately",
    "effect": "Choose 1 of up to 4Spectral cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "spectral_packs_mega",
    "packName": "Spectral Packs",
    "cost": 8,
    "size": "mega",
    "description": "Choose 2 of up to 4Spectral cards to be used immediately",
    "effect": "Choose 2 of up to 4Spectral cards to be used immediately",
    "source": "balatro"
  },
  {
    "id": "spectral_packs_2",
    "packName": "Spectral Packs",
    "cost": 4,
    "size": "2",
    "description": "0.5",
    "effect": "0.5",
    "source": "balatro"
  },
  {
    "id": "spectral_packs_0.6",
    "packName": "Spectral Packs",
    "cost": 1,
    "size": "0.6",
    "description": "0.15",
    "effect": "0.15",
    "source": "balatro"
  }
];

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function getBalatroBoosterById(id: string): BalatroBooster | undefined {
  return balatroBoosters.find(item => item.id === id);
}

export function getBalatroBoostersByName(name: string): BalatroBooster[] {
  const lowerName = name.toLowerCase();
  return balatroBoosters.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function searchBalatroBoosters(query: string): BalatroBooster[] {
  const lowerQuery = query.toLowerCase();
  return balatroBoosters.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}

export function getBoostersByPackName(packName: string): BalatroBooster[] {
  return balatroBoosters.filter(b => 
    b.packName.toLowerCase().includes(packName.toLowerCase())
  );
}

export function getBoostersBySize(size: string): BalatroBooster[] {
  return balatroBoosters.filter(b => b.size === size.toLowerCase());
}

export function getBoostersByCost(maxCost?: number): BalatroBooster[] {
  if (maxCost === undefined) return balatroBoosters;
  return balatroBoosters.filter(b => b.cost <= maxCost);
}

export function getBoosterById(id: string): BalatroBooster | undefined {
  return balatroBoosters.find(b => b.id === id);
}

export function searchBoosters(query: string): BalatroBooster[] {
  const lowerQuery = query.toLowerCase();
  return balatroBoosters.filter(b =>
    b.packName.toLowerCase().includes(lowerQuery) ||
    b.description.toLowerCase().includes(lowerQuery) ||
    (b.effect && String(b.effect).toLowerCase().includes(lowerQuery))
  );
}
