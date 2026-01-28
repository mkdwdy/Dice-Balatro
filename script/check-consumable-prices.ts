import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../benchmark/BuildBalancing.xlsx');
const workbook = XLSX.readFile(excelPath);

console.log('📊 소모품 가격 확인 중...\n');

// 타로 카드 시트 확인
console.log('=== 타로 카드 가격 확인 ===');
const tarotSheet = workbook.Sheets['타로 카드'];
const tarotData = XLSX.utils.sheet_to_json(tarotSheet);
const tarotsWithoutPrice = tarotData.filter((row: any) => !row['게임 내 가격'] || row['게임 내 가격'] === '');
console.log(`총 ${tarotData.length}개 중 가격 없는 항목: ${tarotsWithoutPrice.length}개`);
if (tarotsWithoutPrice.length > 0) {
  console.log('가격 없는 타로 카드:');
  tarotsWithoutPrice.forEach((row: any) => {
    console.log(`  - ${row['타로 카드 이름']} (ID: ${row['타로 카드 ID']})`);
  });
} else {
  console.log('✅ 모든 타로 카드에 가격이 설정되어 있습니다.');
  // 샘플 출력
  console.log('\n샘플 (처음 5개):');
  tarotData.slice(0, 5).forEach((row: any) => {
    console.log(`  - ${row['타로 카드 이름']}: $${row['게임 내 가격']}`);
  });
}

// 행성 카드 시트 확인
console.log('\n=== 행성 카드 가격 확인 ===');
const planetSheet = workbook.Sheets['행성 카드'];
const planetData = XLSX.utils.sheet_to_json(planetSheet);
const planetsWithoutPrice = planetData.filter((row: any) => !row['게임 내 가격'] || row['게임 내 가격'] === '');
console.log(`총 ${planetData.length}개 중 가격 없는 항목: ${planetsWithoutPrice.length}개`);
if (planetsWithoutPrice.length > 0) {
  console.log('가격 없는 행성 카드:');
  planetsWithoutPrice.forEach((row: any) => {
    console.log(`  - ${row['행성 카드 이름']} (ID: ${row['행성 카드 ID']})`);
  });
} else {
  console.log('✅ 모든 행성 카드에 가격이 설정되어 있습니다.');
  // 샘플 출력
  console.log('\n샘플 (처음 5개):');
  planetData.slice(0, 5).forEach((row: any) => {
    console.log(`  - ${row['행성 카드 이름']}: $${row['게임 내 가격']} (Mult: +${row['Mult 증가']}, Chips: +${row['Chips 증가']})`);
  });
}

// 스펙트럴 카드 시트 확인
console.log('\n=== 스펙트럴 카드 가격 확인 ===');
const spectralSheet = workbook.Sheets['스펙트럴 카드'];
const spectralData = XLSX.utils.sheet_to_json(spectralSheet);
const spectralsWithoutPrice = spectralData.filter((row: any) => !row['게임 내 가격'] || row['게임 내 가격'] === '');
console.log(`총 ${spectralData.length}개 중 가격 없는 항목: ${spectralsWithoutPrice.length}개`);
if (spectralsWithoutPrice.length > 0) {
  console.log('가격 없는 스펙트럴 카드:');
  spectralsWithoutPrice.forEach((row: any) => {
    console.log(`  - ${row['스펙트럴 카드 이름']} (ID: ${row['스펙트럴 카드 ID']})`);
  });
} else {
  console.log('✅ 모든 스펙트럴 카드에 가격이 설정되어 있습니다.');
  // 샘플 출력
  console.log('\n샘플 (처음 5개):');
  spectralData.slice(0, 5).forEach((row: any) => {
    console.log(`  - ${row['스펙트럴 카드 이름']}: $${row['게임 내 가격']}`);
  });
}

// 빌드별 소모품 매핑 시트 확인
console.log('\n=== 빌드별 소모품 가격 확인 ===');
const buildConsumablesSheet = workbook.Sheets['빌드별 소모품'];
const buildConsumablesData = XLSX.utils.sheet_to_json(buildConsumablesSheet);
const consumablesWithoutPrice = buildConsumablesData.filter((row: any) => !row['가격'] || row['가격'] === '');
console.log(`총 ${buildConsumablesData.length}개 중 가격 없는 항목: ${consumablesWithoutPrice.length}개`);
if (consumablesWithoutPrice.length > 0) {
  console.log('가격 없는 소모품:');
  consumablesWithoutPrice.forEach((row: any) => {
    console.log(`  - ${row['빌드 이름']}: ${row['소모품 이름']} (${row['소모품 타입']})`);
  });
} else {
  console.log('✅ 모든 빌드별 소모품에 가격이 설정되어 있습니다.');
}

console.log('\n✅ 확인 완료!');



