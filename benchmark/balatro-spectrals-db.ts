import type { BalatroSpectral } from './balatro-schemas';

/**
 * 발라트로 BalatroSpectral 데이터베이스
 * 총 18개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { BalatroSpectral } from './balatro-schemas';

export const balatroSpectrals: BalatroSpectral[] = [
  {
    "id": "familiar",
    "name": "Familiar",
    "description": "Destroy 1 random card in your hand, but add 3 random Enhancedface \ncards instead.",
    "effect": "Destroy 1 random card in your hand, but add 3 random Enhancedface \ncards instead.",
    "source": "balatro"
  },
  {
    "id": "grim",
    "name": "Grim",
    "description": "Destroy 1 random card in your hand, but add 2 random EnhancedAces \ninstead.",
    "effect": "Destroy 1 random card in your hand, but add 2 random EnhancedAces \ninstead.",
    "source": "balatro"
  },
  {
    "id": "incantation",
    "name": "Incantation",
    "description": "Destroy 1 random card in your hand, but add 4 random Enhancednumbered \ncards instead.",
    "effect": "Destroy 1 random card in your hand, but add 4 random Enhancednumbered \ncards instead.",
    "source": "balatro"
  },
  {
    "id": "talisman",
    "name": "Talisman",
    "description": "Add a Gold Seal to 1 selected card.",
    "effect": "Add a Gold Seal to 1 selected card.",
    "source": "balatro"
  },
  {
    "id": "aura",
    "name": "Aura",
    "description": "Add Foil, Holographic, or Polychromeedition (determined at random) to 1 \nselected card in hand.",
    "effect": "Add Foil, Holographic, or Polychromeedition (determined at random) to 1 \nselected card in hand.",
    "source": "balatro"
  },
  {
    "id": "wraith",
    "name": "Wraith",
    "description": "Creates a random RareJoker (must have room), but sets money to $0.",
    "effect": "Creates a random RareJoker (must have room), but sets money to $0.",
    "source": "balatro"
  },
  {
    "id": "sigil",
    "name": "Sigil",
    "description": "Converts all cards in hand to a single random suit.",
    "effect": "Converts all cards in hand to a single random suit.",
    "source": "balatro"
  },
  {
    "id": "ouija",
    "name": "Ouija",
    "description": "Converts all cards in hand to a single random rank, but -1Hand Size.",
    "effect": "Converts all cards in hand to a single random rank, but -1Hand Size.",
    "source": "balatro"
  },
  {
    "id": "ectoplasm",
    "name": "Ectoplasm",
    "description": "Add Negative to a random Joker, but -1Hand Size, plus another -1 hand \nsize for each time Ectoplasm has been used this run, e.g. using Ectoplasm 3 \ntimes in the same run decreases hand size by a total of 6 (1+2+3)",
    "effect": "Add Negative to a random Joker, but -1Hand Size, plus another -1 hand \nsize for each time Ectoplasm has been used this run, e.g. using Ectoplasm 3 \ntimes in the same run decreases hand size by a total of 6 (1+2+3)",
    "source": "balatro"
  },
  {
    "id": "immolate",
    "name": "Immolate",
    "description": "Destroys 5 random cards in hand, but gain $20.",
    "effect": "Destroys 5 random cards in hand, but gain $20.",
    "source": "balatro"
  },
  {
    "id": "ankh",
    "name": "Ankh",
    "description": "Creates a copy of 1 of your Jokers at random, then destroys the others, \nleaving you with two identical Jokers. (Editions are also copied, except \nNegative)",
    "effect": "Creates a copy of 1 of your Jokers at random, then destroys the others, \nleaving you with two identical Jokers. (Editions are also copied, except \nNegative)",
    "source": "balatro"
  },
  {
    "id": "deja_vu",
    "name": "Deja Vu",
    "description": "Adds a Red Seal to 1 selected card.",
    "effect": "Adds a Red Seal to 1 selected card.",
    "source": "balatro"
  },
  {
    "id": "hex",
    "name": "Hex",
    "description": "Adds Polychrome to a random Joker, and destroys the rest.",
    "effect": "Adds Polychrome to a random Joker, and destroys the rest.",
    "source": "balatro"
  },
  {
    "id": "trance",
    "name": "Trance",
    "description": "Adds a Blue Seal to 1 selected card.",
    "effect": "Adds a Blue Seal to 1 selected card.",
    "source": "balatro"
  },
  {
    "id": "medium",
    "name": "Medium",
    "description": "Adds a Purple Seal to 1 selected card.",
    "effect": "Adds a Purple Seal to 1 selected card.",
    "source": "balatro"
  },
  {
    "id": "cryptid",
    "name": "Cryptid",
    "description": "Creates 2 exact copies (including Enhancements, Editions and Seals) of a \nselected card in your hand.",
    "effect": "Creates 2 exact copies (including Enhancements, Editions and Seals) of a \nselected card in your hand.",
    "source": "balatro"
  },
  {
    "id": "the_soul",
    "name": "The Soul",
    "description": "Creates a Legendary Joker.\n\n(Must have room)\n\n\nArtwork: This card is animated, with the gem beating like a heart, or \nperhaps something inside is trying to break out...",
    "effect": "Creates a Legendary Joker.\n\n(Must have room)\n\n\nArtwork: This card is animated, with the gem beating like a heart, or \nperhaps something inside is trying to break out...",
    "source": "balatro"
  },
  {
    "id": "black_hole",
    "name": "Black Hole",
    "description": "Upgrades every poker hand (including secret hands not yet discovered) by \none level.",
    "effect": "Upgrades every poker hand (including secret hands not yet discovered) by \none level.",
    "source": "balatro"
  }
];

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function getBalatroSpectralById(id: string): BalatroSpectral | undefined {
  return balatroSpectrals.find(item => item.id === id);
}

export function getBalatroSpectralsByName(name: string): BalatroSpectral[] {
  const lowerName = name.toLowerCase();
  return balatroSpectrals.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function searchBalatroSpectrals(query: string): BalatroSpectral[] {
  const lowerQuery = query.toLowerCase();
  return balatroSpectrals.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}
