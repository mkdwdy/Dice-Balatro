import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { balatroTarots } from '../benchmark/balatro-tarots-db.js';
import { balatroPlanets } from '../benchmark/balatro-planets-db.js';
import { balatroSpectrals } from '../benchmark/balatro-spectrals-db.js';
import { balatroBuilds } from '../benchmark/balatro-builds-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 소모품 가격 및 효과 수치 설정
 * 발라트로의 밸런싱 원칙을 참고하여 설정
 */

// 타로 카드 가격 설정 (효과 강도 기반)
const tarotPrices: Record<string, number> = {
  // 기본 변환 카드 (슈트/값 변환) - $3-4
  'the_star_xvii': 3,      // Diamond 변환
  'the_sun_xix': 3,        // Heart 변환
  'the_moon_xviii': 3,     // Club 변환
  'the_world_xxi': 3,      // Spade 변환
  'strength_xi': 4,        // 값 증가
  
  // 강화 카드 (2장 강화) - $4-5
  'the_magician_i': 4,     // Lucky 강화
  'the_empress_iii': 5,    // Mult 강화
  'the_hierophant_v': 4,   // Bonus 강화
  
  // 특수 강화 (1장 강화) - $3-4
  'the_lovers_vi': 3,      // Wild Card
  'the_chariot_vii': 3,    // Steel Card
  'justice_viii': 3,       // Glass Card
  'the_devil_xv': 4,       // Gold Card
  'the_tower_xvi': 3,      // Stone Card
  
  // 경제 카드 - $5-6
  'the_hermit_ix': 5,      // 골드 2배 (최대 $20)
  'temperance_xiv': 6,     // 조커 판매 가격 합계 (최대 $50)
  
  // 생성 카드 - $6-8
  'the_high_priestess_ii': 6,  // 행성 카드 생성
  'the_emperor_iv': 6,         // 타로 카드 생성
  'judgement_xx': 8,           // 조커 생성
  
  // 특수 효과 - $4-5
  'the_wheel_of_fortune_x': 4, // 확률 2배
  'the_hanged_man_xii': 4,     // 카드 파괴
  'death_xiii': 5,              // 카드 변환
  'the_fool_0': 5,              // 마지막 카드 복사
};

// 행성 카드 가격 설정 (족보 강화 효과 기반)
const planetPrices: Record<string, number> = {
  'pluto': 3,        // High Card (+1 Mult, +10 Chips)
  'mercury': 4,      // Pair (+1 Mult, +15 Chips)
  'uranus': 4,       // Two Pair (+1 Mult, +20 Chips)
  'venus': 5,        // Three of a Kind (+2 Mult, +20 Chips)
  'saturn': 6,       // Straight (+3 Mult, +30 Chips)
  'jupiter': 6,      // Flush (+2 Mult, +15 Chips)
  'earth': 7,        // Full House (+2 Mult, +25 Chips)
  'mars': 8,         // Four of a Kind (+3 Mult, +30 Chips)
  'neptune': 10,     // Straight Flush (+4 Mult, +40 Chips)
  'planet_x': 10,    // Five of a Kind (+3 Mult, +35 Chips)
  'ceres': 12,       // Flush House (+4 Mult, +40 Chips)
  'eris': 15,        // Flush Five (+3 Mult, +50 Chips)
};

// 스펙트럴 카드 가격 설정 (효과 강도 기반)
const spectralPrices: Record<string, number> = {
  // 기본 변환/생성 - $5-7
  'familiar': 5,         // 페이스 카드 3장
  'grim': 5,             // Ace 2장
  'incantation': 5,      // 숫자 카드 4장
  'sigil': 6,            // 슈트 변환
  'ouija': 7,            // 값 변환 (핸드 크기 -1)
  
  // 강화 - $6-8
  'talisman': 6,         // Gold Seal
  'aura': 7,             // Edition 추가
  'deja_vu': 6,          // Red Seal
  'trance': 6,           // Blue Seal
  'medium': 6,           // Purple Seal
  
  // 특수 효과 - $8-15
  'wraith': 8,           // Rare 조커 생성 (골드 0)
  'immolate': 8,         // 카드 5장 파괴, $20 획득
  'ankh': 10,            // 조커 복제
  'hex': 12,             // Polychrome 추가
  'cryptid': 10,         // 카드 2장 복제
  'the_soul': 15,        // Legendary 조커 생성
  'black_hole': 12,      // 모든 족보 1단계 업그레이드
  'ectoplasm': 7,        // Negative 추가 (핸드 크기 -1)
};

// 행성 카드 효과 수치 조정 (주사위 게임에 맞게)
const planetEffectAdjustments: Record<string, { mult: number; chips: number }> = {
  'pluto': { mult: 1, chips: 10 },
  'mercury': { mult: 2, chips: 15 },      // Pair 빌드용 강화
  'uranus': { mult: 2, chips: 20 },
  'venus': { mult: 2, chips: 20 },
  'saturn': { mult: 3, chips: 30 },
  'jupiter': { mult: 2, chips: 15 },      // Flush 빌드용 강화
  'earth': { mult: 2, chips: 25 },
  'mars': { mult: 3, chips: 30 },
  'neptune': { mult: 4, chips: 40 },
  'planet_x': { mult: 3, chips: 35 },
  'ceres': { mult: 4, chips: 40 },
  'eris': { mult: 3, chips: 50 },
};

// 엑셀 파일 읽기
const excelPath = path.join(__dirname, '../benchmark/BuildBalancing.xlsx');
const workbook = XLSX.readFile(excelPath);

// 타로 카드 시트 업데이트
function updateTarotsSheet() {
  const sheet = workbook.Sheets['타로 카드'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const updatedData = data.map((row: any) => {
    const tarotId = row['타로 카드 ID'];
    const price = tarotPrices[tarotId] || 5; // 기본값 $5
    
    return {
      ...row,
      '게임 내 가격': price,
    };
  });
  
  const newSheet = XLSX.utils.json_to_sheet(updatedData);
  workbook.Sheets['타로 카드'] = newSheet;
  
  console.log(`✅ 타로 카드 가격 업데이트 완료 (${updatedData.length}개)`);
}

// 행성 카드 시트 업데이트
function updatePlanetsSheet() {
  const sheet = workbook.Sheets['행성 카드'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const updatedData = data.map((row: any) => {
    const planetId = row['행성 카드 ID'];
    const price = planetPrices[planetId] || 6; // 기본값 $6
    const effect = planetEffectAdjustments[planetId] || { mult: 2, chips: 20 };
    
    return {
      ...row,
      '게임 내 가격': price,
      'Mult 증가': effect.mult,
      'Chips 증가': effect.chips,
    };
  });
  
  const newSheet = XLSX.utils.json_to_sheet(updatedData);
  workbook.Sheets['행성 카드'] = newSheet;
  
  console.log(`✅ 행성 카드 가격 및 효과 업데이트 완료 (${updatedData.length}개)`);
}

// 스펙트럴 카드 시트 업데이트
function updateSpectralsSheet() {
  const sheet = workbook.Sheets['스펙트럴 카드'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const updatedData = data.map((row: any) => {
    const spectralId = row['스펙트럴 카드 ID'];
    const price = spectralPrices[spectralId] || 7; // 기본값 $7
    
    return {
      ...row,
      '게임 내 가격': price,
    };
  });
  
  const newSheet = XLSX.utils.json_to_sheet(updatedData);
  workbook.Sheets['스펙트럴 카드'] = newSheet;
  
  console.log(`✅ 스펙트럴 카드 가격 업데이트 완료 (${updatedData.length}개)`);
}

// 빌드별 소모품 매핑 시트 업데이트
function updateBuildConsumablesSheet() {
  const sheet = workbook.Sheets['빌드별 소모품'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const updatedData = data.map((row: any) => {
    let price = row['가격'] || '';
    
    if (!price && row['소모품 타입'] && row['소모품 ID']) {
      const consumableId = row['소모품 ID'];
      
      if (row['소모품 타입'] === 'Tarot') {
        price = tarotPrices[consumableId] || 5;
      } else if (row['소모품 타입'] === 'Planet') {
        price = planetPrices[consumableId] || 6;
      } else if (row['소모품 타입'] === 'Spectral') {
        price = spectralPrices[consumableId] || 7;
      }
    }
    
    return {
      ...row,
      '가격': price,
    };
  });
  
  const newSheet = XLSX.utils.json_to_sheet(updatedData);
  workbook.Sheets['빌드별 소모품'] = newSheet;
  
  console.log(`✅ 빌드별 소모품 가격 업데이트 완료`);
}

// 빌드 평가 및 개선 제안
function evaluateBuilds() {
  console.log('\n📊 빌드 평가 및 개선 제안:\n');
  
  const issues: string[] = [];
  const improvements: string[] = [];
  
  balatroBuilds.forEach(build => {
    // 소모품 사용 확인
    const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`;
    const hasTarot = flowText.toLowerCase().includes('tarot');
    const hasPlanet = flowText.toLowerCase().includes('planet');
    const hasSpectral = flowText.toLowerCase().includes('spectral');
    
    // 소모품이 명시되지 않은 빌드 확인
    if (!hasTarot && !hasPlanet && !hasSpectral) {
      issues.push(`⚠️ ${build.nameKorean}: 소모품 사용이 명시되지 않음`);
    }
    
    // 빌드 완성도 평가
    const coreCount = build.coreJokers.length;
    const synergyCount = build.synergyJokers.length;
    
    if (coreCount < 2) {
      issues.push(`⚠️ ${build.nameKorean}: 핵심 조커가 너무 적음 (${coreCount}개)`);
    }
    
    if (synergyCount === 0 && build.tier !== 'B') {
      improvements.push(`💡 ${build.nameKorean}: 보조 조커 추가 고려`);
    }
  });
  
  // 발라트로와 비교하여 누락된 빌드 타입 확인
  const buildCategories = new Set(balatroBuilds.map(b => b.category));
  const expectedCategories = [
    'suit_based', 'hand_type', 'scaling', 'copy', 'retrigger',
    'deck_compression', 'economy', 'value_specific', 'hybrid'
  ];
  
  expectedCategories.forEach(cat => {
    if (!buildCategories.has(cat)) {
      improvements.push(`💡 ${cat} 카테고리 빌드 추가 고려`);
    }
  });
  
  // 결과 출력
  if (issues.length > 0) {
    console.log('⚠️ 발견된 문제점:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  if (improvements.length > 0) {
    console.log('\n💡 개선 제안:');
    improvements.forEach(improvement => console.log(`  ${improvement}`));
  }
  
  if (issues.length === 0 && improvements.length === 0) {
    console.log('✅ 모든 빌드가 양호한 상태입니다!');
  }
}

// 메인 함수
function updatePrices() {
  console.log('💰 소모품 가격 및 효과 수치 업데이트 중...\n');
  
  updateTarotsSheet();
  updatePlanetsSheet();
  updateSpectralsSheet();
  updateBuildConsumablesSheet();
  
  // 파일 저장
  XLSX.writeFile(workbook, excelPath);
  console.log(`\n✅ 엑셀 파일 업데이트 완료: ${excelPath}`);
  
  // 빌드 평가
  evaluateBuilds();
}

// 실행
updatePrices();



