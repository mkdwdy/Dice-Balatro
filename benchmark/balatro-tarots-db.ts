import type { BalatroTarot } from './balatro-schemas';

/**
 * 발라트로 BalatroTarot 데이터베이스
 * 총 22개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { BalatroTarot } from './balatro-schemas';

export const balatroTarots: BalatroTarot[] = [
  {
    "id": "the_fool_0",
    "name": "The Fool (0)",
    "description": "Creates a copy of the last Tarot or Planet card used. \n\n(The Fool excluded)",
    "source": "balatro"
  },
  {
    "id": "the_magician_i",
    "name": "The Magician (I)",
    "description": "Enhances 2 selected cards to Lucky Cards",
    "source": "balatro"
  },
  {
    "id": "the_high_priestess_ii",
    "name": "The High Priestess (II)",
    "description": "Creates up to 2 random Planet cards\n(Must have room)",
    "source": "balatro"
  },
  {
    "id": "the_empress_iii",
    "name": "The Empress (III)",
    "description": "Enhances 2 selected cards to Mult Cards",
    "source": "balatro"
  },
  {
    "id": "the_emperor_iv",
    "name": "The Emperor (IV)",
    "description": "Creates up to 2 random Tarot cards\n(Must have room)",
    "source": "balatro"
  },
  {
    "id": "the_hierophant_v",
    "name": "The Hierophant (V)",
    "description": "Enhances 2 selected cards to Bonus Cards",
    "source": "balatro"
  },
  {
    "id": "the_lovers_vi",
    "name": "The Lovers (VI)",
    "description": "Enhances 1 selected card into a Wild Card",
    "source": "balatro"
  },
  {
    "id": "the_chariot_vii",
    "name": "The Chariot (VII)",
    "description": "Enhances 1 selected card into a Steel Card",
    "source": "balatro"
  },
  {
    "id": "justice_viii",
    "name": "Justice (VIII)",
    "description": "Enhances 1 selected card into a Glass Card",
    "source": "balatro"
  },
  {
    "id": "the_hermit_ix",
    "name": "The Hermit (IX)",
    "description": "Doubles money\n(Max of$20)",
    "source": "balatro"
  },
  {
    "id": "the_wheel_of_fortune_x",
    "name": "The Wheel of Fortune (X)",
    "description": "1 in 4 chance to add Foil, Holographic, or Polychrome edition to a random \nJoker",
    "source": "balatro"
  },
  {
    "id": "strength_xi",
    "name": "Strength (XI)",
    "description": "Increases rank of up to 2 selected cards by 1\n(Rank order: A→2→3→4→5→6→7→8→9→10→J→Q→K→A)",
    "source": "balatro"
  },
  {
    "id": "the_hanged_man_xii",
    "name": "The Hanged Man (XII)",
    "description": "Destroys up to 2 selected cards",
    "source": "balatro"
  },
  {
    "id": "death_xiii",
    "name": "Death (XIII)",
    "description": "Select 2 cards, convert the left card into the right card\n(Drag to rearrange)",
    "source": "balatro"
  },
  {
    "id": "temperance_xiv",
    "name": "Temperance (XIV)",
    "description": "Gives the total sell value of all current Jokers\n(Max of$50)",
    "source": "balatro"
  },
  {
    "id": "the_devil_xv",
    "name": "The Devil (XV)",
    "description": "Enhances 1 selected card into a Gold Card",
    "source": "balatro"
  },
  {
    "id": "the_tower_xvi",
    "name": "The Tower (XVI)",
    "description": "Enhances 1 selected card into a Stone Card",
    "source": "balatro"
  },
  {
    "id": "the_star_xvii",
    "name": "The Star (XVII)",
    "description": "Converts up to 3 selected cards to  Diamonds",
    "source": "balatro"
  },
  {
    "id": "the_moon_xviii",
    "name": "The Moon (XVIII)",
    "description": "Converts up to 3 selected cards to  Clubs",
    "source": "balatro"
  },
  {
    "id": "the_sun_xix",
    "name": "The Sun (XIX)",
    "description": "Converts up to 3 selected cards to  Hearts",
    "source": "balatro"
  },
  {
    "id": "judgement_xx",
    "name": "Judgement (XX)",
    "description": "Creates a random Joker card (without in-run stickers)\n(Must have room)",
    "source": "balatro"
  },
  {
    "id": "the_world_xxi",
    "name": "The World (XXI)",
    "description": "Converts up to 3 selected cards to  Spades",
    "source": "balatro"
  }
];

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function getBalatroTarotById(id: string): BalatroTarot | undefined {
  return balatroTarots.find(item => item.id === id);
}

export function getBalatroTarotsByName(name: string): BalatroTarot[] {
  const lowerName = name.toLowerCase();
  return balatroTarots.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function searchBalatroTarots(query: string): BalatroTarot[] {
  const lowerQuery = query.toLowerCase();
  return balatroTarots.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}
