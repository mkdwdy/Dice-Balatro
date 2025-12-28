import type { BalatroVoucher } from './balatro-schemas';

/**
 * 발라트로 BalatroVoucher 데이터베이스
 * 총 32개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { BalatroVoucher } from './balatro-schemas';

export const balatroBalatroVouchers: BalatroVoucher[] = [
  {
    "id": "overstock",
    "name": "Overstock",
    "description": "+1 card slot available in shop (to 3 slots)",
    "effect": "+1 card slot available in shop (to 3 slots)",
    "isUpgraded": false,
    "upgradedName": "Overstock Plus",
    "upgradedEffect": "+1 card slot available in shop (to 4 slots)",
    "unlockCondition": "Spend a total of $2500 at the shop",
    "notes": "Also immediately restocks any empty card slots in the Shop when purchased",
    "source": "balatro"
  },
  {
    "id": "overstock_plus",
    "name": "Overstock Plus",
    "description": "+1 card slot available in shop (to 4 slots)",
    "effect": "+1 card slot available in shop (to 4 slots)",
    "isUpgraded": true,
    "baseName": "Overstock",
    "unlockCondition": "Spend a total of $2500 at the shop",
    "notes": "Also immediately restocks any empty card slots in the Shop when purchased",
    "source": "balatro"
  },
  {
    "id": "clearance_sale",
    "name": "Clearance Sale",
    "description": "All cards and packs in shop are 25% off",
    "effect": "All cards and packs in shop are 25% off",
    "isUpgraded": false,
    "upgradedName": "Liquidation",
    "upgradedEffect": "All cards and packs in shop are 50% off",
    "unlockCondition": "Redeem at least 10 Voucher cards in one run",
    "notes": "Also reduces the sell value of your present jokers\n\nPrices are rounded half down",
    "source": "balatro"
  },
  {
    "id": "liquidation",
    "name": "Liquidation",
    "description": "All cards and packs in shop are 50% off",
    "effect": "All cards and packs in shop are 50% off",
    "isUpgraded": true,
    "baseName": "Clearance Sale",
    "unlockCondition": "Redeem at least 10 Voucher cards in one run",
    "notes": "Also reduces the sell value of your present jokers\n\nPrices are rounded half down",
    "source": "balatro"
  },
  {
    "id": "hone",
    "name": "Hone",
    "description": "Foil, Holographic, and Polychrome cards appear 2x more often",
    "effect": "Foil, Holographic, and Polychrome cards appear 2x more often",
    "isUpgraded": false,
    "upgradedName": "Glow Up",
    "upgradedEffect": "Foil, Holographic, and Polychrome cards appear 4x more often",
    "unlockCondition": "Have at least 5 Joker cards with Foil, Holographic, or Polychrome (or \nNegative) effect",
    "notes": "Polychrome on Jokers actually appears 3x more often for Hone and 7x more \noften for Glow Up",
    "source": "balatro"
  },
  {
    "id": "glow_up",
    "name": "Glow Up",
    "description": "Foil, Holographic, and Polychrome cards appear 4x more often",
    "effect": "Foil, Holographic, and Polychrome cards appear 4x more often",
    "isUpgraded": true,
    "baseName": "Hone",
    "unlockCondition": "Have at least 5 Joker cards with Foil, Holographic, or Polychrome (or \nNegative) effect",
    "notes": "Polychrome on Jokers actually appears 3x more often for Hone and 7x more \noften for Glow Up",
    "source": "balatro"
  },
  {
    "id": "reroll_surplus",
    "name": "Reroll Surplus",
    "description": "Rerolls cost $2 less",
    "effect": "Rerolls cost $2 less",
    "isUpgraded": false,
    "upgradedName": "Reroll Glut",
    "upgradedEffect": "Rerolls cost an additional $2 less",
    "unlockCondition": "Reroll the shop a total of 100 times",
    "source": "balatro"
  },
  {
    "id": "reroll_glut",
    "name": "Reroll Glut",
    "description": "Rerolls cost an additional $2 less",
    "effect": "Rerolls cost an additional $2 less",
    "isUpgraded": true,
    "baseName": "Reroll Surplus",
    "unlockCondition": "Reroll the shop a total of 100 times",
    "source": "balatro"
  },
  {
    "id": "crystal_ball",
    "name": "Crystal Ball",
    "description": "+1 consumable slot",
    "effect": "+1 consumable slot",
    "isUpgraded": false,
    "upgradedName": "Omen Globe",
    "upgradedEffect": "Spectral cards may appear in any of the Arcana Packs",
    "unlockCondition": "Use a total of 25 Tarot cards from booster packs",
    "notes": "Omen Globe has a 20% individual chance to replace the Tarot card with a \nSpectral card for every card in the Arcana Pack",
    "source": "balatro"
  },
  {
    "id": "omen_globe",
    "name": "Omen Globe",
    "description": "Spectral cards may appear in any of the Arcana Packs",
    "effect": "Spectral cards may appear in any of the Arcana Packs",
    "isUpgraded": true,
    "baseName": "Crystal Ball",
    "unlockCondition": "Use a total of 25 Tarot cards from booster packs",
    "notes": "Omen Globe has a 20% individual chance to replace the Tarot card with a \nSpectral card for every card in the Arcana Pack",
    "source": "balatro"
  },
  {
    "id": "telescope",
    "name": "Telescope",
    "description": "Celestial Packs always contain the Planet card for your most played poker \nhand",
    "effect": "Celestial Packs always contain the Planet card for your most played poker \nhand",
    "isUpgraded": false,
    "upgradedName": "Observatory",
    "upgradedEffect": "Planet cards in your consumable area give X1.5 Mult for their \nspecified poker hand",
    "unlockCondition": "Use a total of 25 Planet cards from booster packs",
    "notes": "Telescope picks the higher tier hand in case of multiple most played hands",
    "source": "balatro"
  },
  {
    "id": "observatory",
    "name": "Observatory",
    "description": "Planet cards in your consumable area give X1.5 Mult for their \nspecified poker hand",
    "effect": "Planet cards in your consumable area give X1.5 Mult for their \nspecified poker hand",
    "isUpgraded": true,
    "baseName": "Telescope",
    "unlockCondition": "Use a total of 25 Planet cards from booster packs",
    "notes": "Telescope picks the higher tier hand in case of multiple most played hands",
    "source": "balatro"
  },
  {
    "id": "grabber",
    "name": "Grabber",
    "description": "Permanently gain +1 hand per round",
    "effect": "Permanently gain +1 hand per round",
    "isUpgraded": false,
    "upgradedName": "Nacho Tong",
    "upgradedEffect": "Permanently gain an additional +1 hand per round",
    "unlockCondition": "Play a total of 2500 cards",
    "source": "balatro"
  },
  {
    "id": "nacho_tong",
    "name": "Nacho Tong",
    "description": "Permanently gain an additional +1 hand per round",
    "effect": "Permanently gain an additional +1 hand per round",
    "isUpgraded": true,
    "baseName": "Grabber",
    "unlockCondition": "Play a total of 2500 cards",
    "source": "balatro"
  },
  {
    "id": "wasteful",
    "name": "Wasteful",
    "description": "Permanently gain +1 discard each round",
    "effect": "Permanently gain +1 discard each round",
    "isUpgraded": false,
    "upgradedName": "Recyclomancy",
    "upgradedEffect": "Permanently gain an additional +1 discard each round",
    "unlockCondition": "Discard a total of 2500 cards",
    "source": "balatro"
  },
  {
    "id": "recyclomancy",
    "name": "Recyclomancy",
    "description": "Permanently gain an additional +1 discard each round",
    "effect": "Permanently gain an additional +1 discard each round",
    "isUpgraded": true,
    "baseName": "Wasteful",
    "unlockCondition": "Discard a total of 2500 cards",
    "source": "balatro"
  },
  {
    "id": "tarot_merchant",
    "name": "Tarot Merchant",
    "description": "Tarot cards appear 2X more frequently in the shop",
    "effect": "Tarot cards appear 2X more frequently in the shop",
    "isUpgraded": false,
    "upgradedName": "Tarot Tycoon",
    "upgradedEffect": "Tarot cards appear 4X more frequently in the shop",
    "unlockCondition": "Buy a total of 50 Tarot cards from the shop",
    "notes": "For details, see The Shop#Vouchers",
    "source": "balatro"
  },
  {
    "id": "tarot_tycoon",
    "name": "Tarot Tycoon",
    "description": "Tarot cards appear 4X more frequently in the shop",
    "effect": "Tarot cards appear 4X more frequently in the shop",
    "isUpgraded": true,
    "baseName": "Tarot Merchant",
    "unlockCondition": "Buy a total of 50 Tarot cards from the shop",
    "notes": "For details, see The Shop#Vouchers",
    "source": "balatro"
  },
  {
    "id": "planet_merchant",
    "name": "Planet Merchant",
    "description": "Planet cards appear 2X more frequently in the shop",
    "effect": "Planet cards appear 2X more frequently in the shop",
    "isUpgraded": false,
    "upgradedName": "Planet Tycoon",
    "upgradedEffect": "Planet cards appear 4X more frequently in the shop",
    "unlockCondition": "Buy a total of 50 Planet cards from the shop",
    "notes": "For details, see The Shop#Vouchers",
    "source": "balatro"
  },
  {
    "id": "planet_tycoon",
    "name": "Planet Tycoon",
    "description": "Planet cards appear 4X more frequently in the shop",
    "effect": "Planet cards appear 4X more frequently in the shop",
    "isUpgraded": true,
    "baseName": "Planet Merchant",
    "unlockCondition": "Buy a total of 50 Planet cards from the shop",
    "notes": "For details, see The Shop#Vouchers",
    "source": "balatro"
  },
  {
    "id": "seed_money",
    "name": "Seed Money",
    "description": "Raise the cap on interest earned in each round to $10",
    "effect": "Raise the cap on interest earned in each round to $10",
    "isUpgraded": false,
    "upgradedName": "Money Tree",
    "upgradedEffect": "Raise the cap on interest earned in each round to $20",
    "unlockCondition": "Max out the interest per round earnings for ten consecutive rounds",
    "notes": "Does nothing when playing the Green Deck.",
    "source": "balatro"
  },
  {
    "id": "money_tree",
    "name": "Money Tree",
    "description": "Raise the cap on interest earned in each round to $20",
    "effect": "Raise the cap on interest earned in each round to $20",
    "isUpgraded": true,
    "baseName": "Seed Money",
    "unlockCondition": "Max out the interest per round earnings for ten consecutive rounds",
    "notes": "Does nothing when playing the Green Deck.",
    "source": "balatro"
  },
  {
    "id": "blank",
    "name": "Blank",
    "description": "Does nothing?",
    "effect": "Does nothing?",
    "isUpgraded": false,
    "upgradedName": "Antimatter",
    "upgradedEffect": "+1 Joker slot",
    "unlockCondition": "Redeem Blank 10 total times",
    "notes": "The Antimatter Voucher is always displayed in game as if it was a negative \nedition and applies the same effect as negative Jokers",
    "source": "balatro"
  },
  {
    "id": "antimatter",
    "name": "Antimatter",
    "description": "+1 Joker slot",
    "effect": "+1 Joker slot",
    "isUpgraded": true,
    "baseName": "Blank",
    "unlockCondition": "Redeem Blank 10 total times",
    "notes": "The Antimatter Voucher is always displayed in game as if it was a negative \nedition and applies the same effect as negative Jokers",
    "source": "balatro"
  },
  {
    "id": "magic_trick",
    "name": "Magic Trick",
    "description": "Playing cards can be purchased from the shop",
    "effect": "Playing cards can be purchased from the shop",
    "isUpgraded": false,
    "upgradedName": "Illusion",
    "upgradedEffect": "Playing cards in shop may have an Enhancement, Edition, and/or a \nSeal",
    "unlockCondition": "Buy a total of 20 Playing cards from the shop",
    "notes": "Illusion is currently (v1.0.1o-FULL) bugged, and cards in the shop cannot \nhave seals, only enhancements and/or editions, and is unaffected by \nHone/Glow Up.",
    "source": "balatro"
  },
  {
    "id": "illusion",
    "name": "Illusion",
    "description": "Playing cards in shop may have an Enhancement, Edition, and/or a \nSeal",
    "effect": "Playing cards in shop may have an Enhancement, Edition, and/or a \nSeal",
    "isUpgraded": true,
    "baseName": "Magic Trick",
    "unlockCondition": "Buy a total of 20 Playing cards from the shop",
    "notes": "Illusion is currently (v1.0.1o-FULL) bugged, and cards in the shop cannot \nhave seals, only enhancements and/or editions, and is unaffected by \nHone/Glow Up.",
    "source": "balatro"
  },
  {
    "id": "hieroglyph",
    "name": "Hieroglyph",
    "description": "-1 Ante, \n-1 hand each round",
    "effect": "-1 Ante, \n-1 hand each round",
    "isUpgraded": false,
    "upgradedName": "Petroglyph",
    "upgradedEffect": "-1 Ante, \n-1 discard each round",
    "unlockCondition": "Reach Ante level 12",
    "source": "balatro"
  },
  {
    "id": "petroglyph",
    "name": "Petroglyph",
    "description": "-1 Ante, \n-1 discard each round",
    "effect": "-1 Ante, \n-1 discard each round",
    "isUpgraded": true,
    "baseName": "Hieroglyph",
    "unlockCondition": "Reach Ante level 12",
    "source": "balatro"
  },
  {
    "id": "director_s_cut",
    "name": "Director's Cut",
    "description": "Reroll Boss Blind1 time per Ante, $10 per roll",
    "effect": "Reroll Boss Blind1 time per Ante, $10 per roll",
    "isUpgraded": false,
    "upgradedName": "Retcon",
    "upgradedEffect": "Reroll Boss Blindunlimited times, $10 per roll",
    "unlockCondition": "Discover 25 Blinds",
    "source": "balatro"
  },
  {
    "id": "retcon",
    "name": "Retcon",
    "description": "Reroll Boss Blindunlimited times, $10 per roll",
    "effect": "Reroll Boss Blindunlimited times, $10 per roll",
    "isUpgraded": true,
    "baseName": "Director's Cut",
    "unlockCondition": "Discover 25 Blinds",
    "source": "balatro"
  },
  {
    "id": "paint_brush",
    "name": "Paint Brush",
    "description": "+1Hand Size",
    "effect": "+1Hand Size",
    "isUpgraded": false,
    "upgradedName": "Palette",
    "upgradedEffect": "+1Hand Size again",
    "unlockCondition": "Reduce your hand size down to 5 cards",
    "source": "balatro"
  },
  {
    "id": "palette",
    "name": "Palette",
    "description": "+1Hand Size again",
    "effect": "+1Hand Size again",
    "isUpgraded": true,
    "baseName": "Paint Brush",
    "unlockCondition": "Reduce your hand size down to 5 cards",
    "source": "balatro"
  }
];

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function getBalatroVoucherById(id: string): BalatroVoucher | undefined {
  return balatroBalatroVouchers.find(item => item.id === id);
}

export function getBalatroVouchersByName(name: string): BalatroVoucher[] {
  const lowerName = name.toLowerCase();
  return balatroBalatroVouchers.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function searchBalatroVouchers(query: string): BalatroVoucher[] {
  const lowerQuery = query.toLowerCase();
  return balatroBalatroVouchers.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}

export function getBaseVouchers(): BalatroVoucher[] {
  return balatroVouchers.filter(v => !v.isUpgraded);
}

export function getUpgradedVouchers(): BalatroVoucher[] {
  return balatroVouchers.filter(v => v.isUpgraded);
}

export function getVoucherPair(baseName: string): { base?: BalatroVoucher; upgraded?: BalatroVoucher } {
  const base = balatroVouchers.find(v => !v.isUpgraded && v.name === baseName);
  const upgraded = base ? balatroVouchers.find(v => v.isUpgraded && v.baseName === baseName) : undefined;
  return { base, upgraded };
}

export function getVoucherById(id: string): BalatroVoucher | undefined {
  return balatroVouchers.find(v => v.id === id);
}

export function searchVouchers(query: string): BalatroVoucher[] {
  const lowerQuery = query.toLowerCase();
  return balatroVouchers.filter(v =>
    v.name.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery) ||
    (v.effect && String(v.effect).toLowerCase().includes(lowerQuery))
  );
}
