import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 엑셀 파일 읽기
const filePath = path.join(__dirname, 'BalatroDatabase.xlsx');
const workbook = XLSX.readFile(filePath);

// 헬퍼: 마크다운 스타일 제거 및 정리
function cleanText(text: any): string {
  if (!text) return '';
  return String(text)
    .replace(/\*([^*]+)\*/g, '$1') // *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **text** -> text
    .trim();
}

// 헬퍼: 숫자 추출
function extractNumber(text: any): number | undefined {
  if (!text) return undefined;
  const match = String(text).match(/\$?(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

// Joker 데이터 변환
function convertJokers() {
  const sheet = workbook.Sheets['Joker'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = data[0] as string[];
  
  const jokers = data.slice(1)
    .filter((row: any) => row && row[0] !== null && row[0] !== undefined)
    .map((row: any, index: number) => {
      const nr = row[0];
      const name = cleanText(row[1]);
      const effect = cleanText(row[2]);
      const cost = extractNumber(row[3]);
      const rarity = cleanText(row[4]) || 'common';
      const unlock = cleanText(row[5]);
      const type = cleanText(row[6]);
      const act = cleanText(row[7]);
      
      // ID 생성 (이름 기반)
      const id = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      return {
        id,
        nr: typeof nr === 'number' ? nr : index + 1,
        name,
        description: effect,
        rarity: rarity.toLowerCase() as 'common' | 'uncommon' | 'rare' | 'legendary',
        effect: effect,
        baseCost: cost,
        unlockRequirement: unlock,
        type: type,
        activationType: act,
        diceGameApplicable: true,
        source: 'balatro' as const,
      };
    });
  
  return jokers;
}

// Tarot 데이터 변환
function convertTarot() {
  const sheet = workbook.Sheets['Tarot'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const tarots = data.slice(1)
    .filter((row: any) => row && row[1])
    .map((row: any, index: number) => {
      const name = cleanText(row[1]);
      const description = cleanText(row[2]);
      
      const id = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      return {
        id,
        name,
        description,
        source: 'balatro' as const,
      };
    });
  
  return tarots;
}

// Planet 데이터 변환
function convertPlanets() {
  const sheet = workbook.Sheets['Planet'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const planets = data.slice(1)
    .filter((row: any) => row && row[1])
    .map((row: any, index: number) => {
      const name = cleanText(row[1]);
      const addition = cleanText(row[2]);
      const pokerHand = cleanText(row[3]);
      const handBaseScore = cleanText(row[4]);
      const type = cleanText(row[5]);
      
      const id = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      return {
        id,
        name,
        addition,
        pokerHand,
        handBaseScore,
        type,
        source: 'balatro' as const,
      };
    });
  
  return planets;
}

// Spectral 데이터 변환
function convertSpectral() {
  const sheet = workbook.Sheets['Spectral'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const spectrals = data.slice(1)
    .filter((row: any) => row && row[1])
    .map((row: any, index: number) => {
      const name = cleanText(row[1]);
      const effect = cleanText(row[2]);
      
      const id = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      return {
        id,
        name,
        description: effect,
        effect: effect,
        source: 'balatro' as const,
      };
    });
  
  return spectrals;
}

// Voucher 데이터 변환
function convertVouchers() {
  const sheet = workbook.Sheets['Voucher'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const vouchers: any[] = [];
  
  // 헤더가 복잡하므로 수동으로 파싱
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || !row[0]) continue;
    
    const baseName = cleanText(row[0]);
    const baseEffect = cleanText(row[1]);
    const upgradedName = cleanText(row[2]);
    const upgradedEffect = cleanText(row[3]);
    const unlockCondition = cleanText(row[4]);
    const notes = cleanText(row[5]);
    
    if (baseName && baseName !== 'Name') {
      const id = baseName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      vouchers.push({
        id,
        name: baseName,
        description: baseEffect,
        effect: baseEffect,
        isUpgraded: false,
        upgradedName: upgradedName || undefined,
        upgradedEffect: upgradedEffect || undefined,
        unlockCondition: unlockCondition || undefined,
        notes: notes || undefined,
        source: 'balatro' as const,
      });
      
      if (upgradedName && upgradedName !== 'Name') {
        const upgradedId = upgradedName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        
        vouchers.push({
          id: upgradedId,
          name: upgradedName,
          description: upgradedEffect,
          effect: upgradedEffect,
          isUpgraded: true,
          baseName: baseName,
          unlockCondition: unlockCondition || undefined,
          notes: notes || undefined,
          source: 'balatro' as const,
        });
      }
    }
  }
  
  return vouchers;
}

// Booster 데이터 변환
function convertBoosters() {
  const sheet = workbook.Sheets['Booster'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const boosters: any[] = [];
  let currentPackName = '';
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row) continue;
    
    // Image(s) 컬럼에 패키지 이름이 있는 경우
    if (row[0] && cleanText(row[0]) && !row[1]) {
      currentPackName = cleanText(row[0]);
      continue;
    }
    
    const cost = extractNumber(row[1]);
    const size = cleanText(row[2]);
    const effect = cleanText(row[3]);
    
    if (cost && size && effect) {
      const id = `${currentPackName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${size.toLowerCase()}`;
      
      boosters.push({
        id,
        packName: currentPackName,
        cost,
        size: size.toLowerCase(),
        description: effect,
        effect: effect,
        source: 'balatro' as const,
      });
    }
  }
  
  return boosters;
}

// 모든 데이터 변환
console.log('🔄 데이터 변환 시작...\n');

const jokers = convertJokers();
console.log(`✅ Joker: ${jokers.length}개`);

const tarots = convertTarot();
console.log(`✅ Tarot: ${tarots.length}개`);

const planets = convertPlanets();
console.log(`✅ Planet: ${planets.length}개`);

const spectrals = convertSpectral();
console.log(`✅ Spectral: ${spectrals.length}개`);

const vouchers = convertVouchers();
console.log(`✅ Voucher: ${vouchers.length}개`);

const boosters = convertBoosters();
console.log(`✅ Booster: ${boosters.length}개`);

console.log(`\n📊 총 ${jokers.length + tarots.length + planets.length + spectrals.length + vouchers.length + boosters.length}개 항목 변환 완료!`);

// 데이터를 JSON으로 저장 (검증용)
fs.writeFileSync(
  path.join(__dirname, 'converted-data.json'),
  JSON.stringify({
    jokers,
    tarots,
    planets,
    spectrals,
    vouchers,
    boosters,
  }, null, 2)
);

console.log('\n💾 converted-data.json 저장 완료!');

