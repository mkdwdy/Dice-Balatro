import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON 데이터 읽기
const jsonData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'converted-data.json'), 'utf-8')
);

// TypeScript 파일 생성 헬퍼
function generateTypeScriptFile(
  filename: string,
  typeName: string,
  data: any[],
  imports: string = '',
  exportName?: string
) {
  const actualExportName = exportName || `balatro${typeName}s`;
  const content = `${imports}

/**
 * 발라트로 ${typeName} 데이터베이스
 * 총 ${data.length}개 항목
 * 출처: Balatro Wiki (https://balatrowiki.org)
 */

import type { ${typeName} } from './balatro-schemas';

export const ${actualExportName}: ${typeName}[] = ${JSON.stringify(data, null, 2)};

/**
 * 검색 및 필터링 헬퍼 함수
 */
export function get${typeName}ById(id: string): ${typeName} | undefined {
  return ${actualExportName}.find(item => item.id === id);
}

export function get${typeName}sByName(name: string): ${typeName}[] {
  const lowerName = name.toLowerCase();
  return ${actualExportName}.filter(item => 
    item.name.toLowerCase().includes(lowerName)
  );
}

export function search${typeName}s(query: string): ${typeName}[] {
  const lowerQuery = query.toLowerCase();
  return ${actualExportName}.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    (item.effect && String(item.effect).toLowerCase().includes(lowerQuery))
  );
}
`;

  fs.writeFileSync(path.join(__dirname, filename), content, 'utf-8');
  console.log(`✅ ${filename} 생성 완료 (${data.length}개 항목)`);
}

// 각 카테고리별 TypeScript 파일 생성
console.log('📝 TypeScript 데이터베이스 파일 생성 중...\n');

// Jokers
generateTypeScriptFile(
  'balatro-jokers-db.ts',
  'BalatroJoker',
  jsonData.jokers,
  "import type { BalatroJoker } from './balatro-schemas';",
  'balatroJokers'
);

// 추가 Joker 헬퍼 함수
const jokerHelpers = `
export function getJokersByRarity(rarity: 'common' | 'uncommon' | 'rare' | 'legendary'): BalatroJoker[] {
  return balatroJokers.filter(j => j.rarity === rarity);
}

export function getJokersByType(type: string): BalatroJoker[] {
  return balatroJokers.filter(j => j.type === type);
}

export function getJokersByActivationType(actType: string): BalatroJoker[] {
  return balatroJokers.filter(j => j.activationType === actType);
}

export function getJokerById(id: string): BalatroJoker | undefined {
  return balatroJokers.find(j => j.id === id);
}

export function searchJokers(query: string): BalatroJoker[] {
  const lowerQuery = query.toLowerCase();
  return balatroJokers.filter(j =>
    j.name.toLowerCase().includes(lowerQuery) ||
    j.description.toLowerCase().includes(lowerQuery) ||
    (j.effect && String(j.effect).toLowerCase().includes(lowerQuery))
  );
}
`;

const jokerFile = fs.readFileSync(
  path.join(__dirname, 'balatro-jokers-db.ts'),
  'utf-8'
);
fs.writeFileSync(
  path.join(__dirname, 'balatro-jokers-db.ts'),
  jokerFile + jokerHelpers,
  'utf-8'
);

// Tarots
generateTypeScriptFile(
  'balatro-tarots-db.ts',
  'BalatroTarot',
  jsonData.tarots,
  "import type { BalatroTarot } from './balatro-schemas';",
  'balatroTarots'
);

// Planets
generateTypeScriptFile(
  'balatro-planets-db.ts',
  'BalatroPlanet',
  jsonData.planets,
  "import type { BalatroPlanet } from './balatro-schemas';",
  'balatroPlanets'
);

const planetHelpers = `
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
`;

const planetFile = fs.readFileSync(
  path.join(__dirname, 'balatro-planets-db.ts'),
  'utf-8'
);
fs.writeFileSync(
  path.join(__dirname, 'balatro-planets-db.ts'),
  planetFile + planetHelpers,
  'utf-8'
);

// Spectrals
generateTypeScriptFile(
  'balatro-spectrals-db.ts',
  'BalatroSpectral',
  jsonData.spectrals,
  "import type { BalatroSpectral } from './balatro-schemas';"
);

// Vouchers
generateTypeScriptFile(
  'balatro-vouchers-db.ts',
  'BalatroVoucher',
  jsonData.vouchers,
  "import type { BalatroVoucher } from './balatro-schemas';"
);

const voucherHelpers = `
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
`;

const voucherFile = fs.readFileSync(
  path.join(__dirname, 'balatro-vouchers-db.ts'),
  'utf-8'
);
fs.writeFileSync(
  path.join(__dirname, 'balatro-vouchers-db.ts'),
  voucherFile + voucherHelpers,
  'utf-8'
);

// Boosters
generateTypeScriptFile(
  'balatro-boosters-db.ts',
  'BalatroBooster',
  jsonData.boosters,
  "import type { BalatroBooster } from './balatro-schemas';"
);

const boosterHelpers = `
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
`;

const boosterFile = fs.readFileSync(
  path.join(__dirname, 'balatro-boosters-db.ts'),
  'utf-8'
);
fs.writeFileSync(
  path.join(__dirname, 'balatro-boosters-db.ts'),
  boosterFile + boosterHelpers,
  'utf-8'
);

// 인덱스 파일 생성
const indexContent = `/**
 * 발라트로 벤치마킹 데이터베이스 인덱스
 * 모든 카드와 부스터 팩을 한 곳에서 접근
 */

// 조커
export * from './balatro-jokers-db';
export type { BalatroJoker } from './balatro-schemas';

// 타로 카드
export * from './balatro-tarots-db';
export type { BalatroTarot } from './balatro-schemas';

// 행성 카드
export * from './balatro-planets-db';
export type { BalatroPlanet } from './balatro-schemas';

// 스펙트럴 카드
export * from './balatro-spectrals-db';
export type { BalatroSpectral } from './balatro-schemas';

// 바우처
export * from './balatro-vouchers-db';
export type { BalatroVoucher } from './balatro-schemas';

// 부스터 팩
export * from './balatro-boosters-db';
export type { BalatroBooster } from './balatro-schemas';

// 통계
export const benchmarkStats = {
  jokers: ${jsonData.jokers.length},
  tarots: ${jsonData.tarots.length},
  planets: ${jsonData.planets.length},
  spectrals: ${jsonData.spectrals.length},
  vouchers: ${jsonData.vouchers.length},
  boosters: ${jsonData.boosters.length},
  total: ${jsonData.jokers.length + jsonData.tarots.length + jsonData.planets.length + jsonData.spectrals.length + jsonData.vouchers.length + jsonData.boosters.length},
};
`;

fs.writeFileSync(
  path.join(__dirname, 'index.ts'),
  indexContent,
  'utf-8'
);

console.log('\n✅ index.ts 생성 완료');
console.log('\n📊 총 통계:');
console.log(`   - Jokers: ${jsonData.jokers.length}개`);
console.log(`   - Tarots: ${jsonData.tarots.length}개`);
console.log(`   - Planets: ${jsonData.planets.length}개`);
console.log(`   - Spectrals: ${jsonData.spectrals.length}개`);
console.log(`   - Vouchers: ${jsonData.vouchers.length}개`);
console.log(`   - Boosters: ${jsonData.boosters.length}개`);
console.log(`   - 총합: ${jsonData.jokers.length + jsonData.tarots.length + jsonData.planets.length + jsonData.spectrals.length + jsonData.vouchers.length + jsonData.boosters.length}개`);

