import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { balatroBuilds } from '../benchmark/balatro-builds-db.js';
import { balatroJokers } from '../benchmark/balatro-jokers-db.js';
import { balatroTarots } from '../benchmark/balatro-tarots-db.js';
import { balatroPlanets } from '../benchmark/balatro-planets-db.js';
import { balatroSpectrals } from '../benchmark/balatro-spectrals-db.js';
import type { BalatroBuild } from '../benchmark/balatro-builds-db.js';
import type { BalatroJoker } from '../benchmark/balatro-schemas.js';
import type { BalatroTarot } from '../benchmark/balatro-schemas.js';
import type { BalatroPlanet } from '../benchmark/balatro-schemas.js';
import type { BalatroSpectral } from '../benchmark/balatro-schemas.js';

// 소모품 가격 정보 (update-consumable-prices.ts와 동일)
const tarotPrices: Record<string, number> = {
  'the_star_xvii': 3, 'the_sun_xix': 3, 'the_moon_xviii': 3, 'the_world_xxi': 3, 'strength_xi': 4,
  'the_magician_i': 4, 'the_empress_iii': 5, 'the_hierophant_v': 4,
  'the_lovers_vi': 3, 'the_chariot_vii': 3, 'justice_viii': 3, 'the_devil_xv': 4, 'the_tower_xvi': 3,
  'the_hermit_ix': 5, 'temperance_xiv': 6,
  'the_high_priestess_ii': 6, 'the_emperor_iv': 6, 'judgement_xx': 8,
  'the_wheel_of_fortune_x': 4, 'the_hanged_man_xii': 4, 'death_xiii': 5, 'the_fool_0': 5,
};

const planetPrices: Record<string, number> = {
  'pluto': 3, 'mercury': 4, 'uranus': 4, 'venus': 5, 'saturn': 6,
  'jupiter': 6, 'earth': 7, 'mars': 8, 'neptune': 10, 'planet_x': 10,
  'ceres': 12, 'eris': 15,
};

const planetEffects: Record<string, { mult: number; chips: number }> = {
  'pluto': { mult: 1, chips: 10 }, 'mercury': { mult: 2, chips: 15 },
  'uranus': { mult: 2, chips: 20 }, 'venus': { mult: 2, chips: 20 },
  'saturn': { mult: 3, chips: 30 }, 'jupiter': { mult: 2, chips: 15 },
  'earth': { mult: 2, chips: 25 }, 'mars': { mult: 3, chips: 30 },
  'neptune': { mult: 4, chips: 40 }, 'planet_x': { mult: 3, chips: 35 },
  'ceres': { mult: 4, chips: 40 }, 'eris': { mult: 3, chips: 50 },
};

const spectralPrices: Record<string, number> = {
  'familiar': 5, 'grim': 5, 'incantation': 5, 'sigil': 6, 'ouija': 7,
  'talisman': 6, 'aura': 7, 'deja_vu': 6, 'trance': 6, 'medium': 6,
  'wraith': 8, 'immolate': 8, 'ankh': 10, 'hex': 12, 'cryptid': 10,
  'the_soul': 15, 'black_hole': 12, 'ectoplasm': 7,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 빌드 및 구성품 밸런싱용 엑셀 파일 생성
 */

// 조커 ID로 조커 정보 찾기
function getJokerById(id: string): BalatroJoker | undefined {
  return balatroJokers.find(j => j.id === id);
}

// 빌드의 총 가격 계산
function calculateBuildCost(build: BalatroBuild): {
  coreCost: number;
  synergyCost: number;
  totalCost: number;
} {
  let coreCost = 0;
  let synergyCost = 0;

  build.coreJokers.forEach(jokerId => {
    const joker = getJokerById(jokerId);
    if (joker && joker.baseCost) {
      coreCost += joker.baseCost;
    }
  });

  build.synergyJokers.forEach(jokerId => {
    const joker = getJokerById(jokerId);
    if (joker && joker.baseCost) {
      synergyCost += joker.baseCost;
    }
  });

  return {
    coreCost,
    synergyCost,
    totalCost: coreCost + synergyCost,
  };
}

// 빌드 시트 데이터 생성
function createBuildsSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '빌드 ID': 'ID',
    '빌드 이름 (영문)': 'Name',
    '빌드 이름 (한글)': 'Name Korean',
    '카테고리': 'Category',
    '등급': 'Tier',
    '난이도': 'Difficulty',
    '핵심 조커 수': 'Core Jokers Count',
    '보조 조커 수': 'Synergy Jokers Count',
    '핵심 조커 ID': 'Core Jokers IDs',
    '보조 조커 ID': 'Synergy Jokers IDs',
    '핵심 조커 가격 합계': 'Core Cost',
    '보조 조커 가격 합계': 'Synergy Cost',
    '총 가격': 'Total Cost',
    '초반 예상 데미지': 'Early Damage',
    '중반 예상 데미지': 'Mid Damage',
    '후반 예상 데미지': 'Late Damage',
    '설명 (영문)': 'Description',
    '설명 (한글)': 'Description Korean',
    '전략 (영문)': 'Strategy',
    '전략 (한글)': 'Strategy Korean',
  });

  // 빌드 데이터
  balatroBuilds.forEach(build => {
    const costs = calculateBuildCost(build);
    const coreJokerNames = build.coreJokers
      .map(id => getJokerById(id)?.name || id)
      .join(', ');
    const synergyJokerNames = build.synergyJokers
      .map(id => getJokerById(id)?.name || id)
      .join(', ');

    rows.push({
      '빌드 ID': build.id,
      '빌드 이름 (영문)': build.name,
      '빌드 이름 (한글)': build.nameKorean,
      '카테고리': build.category,
      '등급': build.tier,
      '난이도': build.difficulty,
      '핵심 조커 수': build.coreJokers.length,
      '보조 조커 수': build.synergyJokers.length,
      '핵심 조커 ID': build.coreJokers.join(', '),
      '보조 조커 ID': build.synergyJokers.join(', '),
      '핵심 조커 이름': coreJokerNames,
      '보조 조커 이름': synergyJokerNames,
      '핵심 조커 가격 합계': costs.coreCost,
      '보조 조커 가격 합계': costs.synergyCost,
      '총 가격': costs.totalCost,
      '초반 예상 데미지': build.expectedDamage?.early || '',
      '중반 예상 데미지': build.expectedDamage?.mid || '',
      '후반 예상 데미지': build.expectedDamage?.late || '',
      '설명 (영문)': build.description,
      '설명 (한글)': build.descriptionKorean,
      '전략 (영문)': build.buildStrategy,
      '전략 (한글)': build.buildStrategyKorean,
    });
  });

  return rows;
}

// 조커 시트 데이터 생성 (빌드에 사용되는 조커만)
function createJokersSheet() {
  const rows: any[] = [];
  const usedJokerIds = new Set<string>();

  // 빌드에서 사용되는 조커 ID 수집
  balatroBuilds.forEach(build => {
    build.coreJokers.forEach(id => usedJokerIds.add(id));
    build.synergyJokers.forEach(id => usedJokerIds.add(id));
  });

  // 헤더
  rows.push({
    '조커 ID': 'ID',
    '조커 이름 (영문)': 'Name',
    '조커 이름 (한글)': 'Name Korean',
    '희귀도': 'Rarity',
    '등급': 'Tier',
    '기본 가격': 'Base Cost',
    '판매 가격': 'Sell Value',
    '효과 설명 (영문)': 'Effect',
    '효과 설명 (한글)': 'Effect Korean',
    '효과 타입': 'Effect Type',
    '활성화 타입': 'Activation Type',
    '사용 빌드 수': 'Used in Builds',
    '핵심 조커로 사용': 'Core Joker',
    '보조 조커로 사용': 'Synergy Joker',
  });

  // 조커 데이터
  const usedJokers = balatroJokers.filter(j => usedJokerIds.has(j.id));
  
  usedJokers.forEach(joker => {
    // 이 조커를 사용하는 빌드 찾기
    const buildsUsingThisJoker = balatroBuilds.filter(build =>
      build.coreJokers.includes(joker.id) || build.synergyJokers.includes(joker.id)
    );
    
    const isCoreJoker = buildsUsingThisJoker.some(build =>
      build.coreJokers.includes(joker.id)
    );
    const isSynergyJoker = buildsUsingThisJoker.some(build =>
      build.synergyJokers.includes(joker.id)
    );

    rows.push({
      '조커 ID': joker.id,
      '조커 이름 (영문)': joker.name,
      '조커 이름 (한글)': (joker as any).nameKorean || '',
      '희귀도': joker.rarity,
      '등급': (joker as any).tier || '',
      '기본 가격': joker.baseCost || 0,
      '판매 가격': (joker as any).sellValue || Math.floor((joker.baseCost || 0) / 2),
      '효과 설명 (영문)': joker.effect || joker.description,
      '효과 설명 (한글)': (joker as any).effectKorean || (joker as any).descriptionKorean || '',
      '효과 타입': (joker as any).effectType || '',
      '활성화 타입': (joker as any).activationType || '',
      '사용 빌드 수': buildsUsingThisJoker.length,
      '핵심 조커로 사용': isCoreJoker ? 'Yes' : 'No',
      '보조 조커로 사용': isSynergyJoker ? 'Yes' : 'No',
      '사용 빌드 목록': buildsUsingThisJoker.map(b => b.nameKorean).join(', '),
    });
  });

  return rows;
}

// 빌드별 조커 상세 시트 생성
function createBuildJokersDetailSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '빌드 ID': 'Build ID',
    '빌드 이름': 'Build Name',
    '조커 타입': 'Joker Type',
    '조커 ID': 'Joker ID',
    '조커 이름': 'Joker Name',
    '희귀도': 'Rarity',
    '가격': 'Cost',
    '효과': 'Effect',
  });

  // 빌드별 조커 상세
  balatroBuilds.forEach(build => {
    // 핵심 조커
    build.coreJokers.forEach(jokerId => {
      const joker = getJokerById(jokerId);
      if (joker) {
        rows.push({
          '빌드 ID': build.id,
          '빌드 이름': build.nameKorean,
          '조커 타입': '핵심',
          '조커 ID': joker.id,
          '조커 이름': joker.name,
          '희귀도': joker.rarity,
          '가격': joker.baseCost || 0,
          '효과': joker.effect || joker.description,
        });
      }
    });

    // 보조 조커
    build.synergyJokers.forEach(jokerId => {
      const joker = getJokerById(jokerId);
      if (joker) {
        rows.push({
          '빌드 ID': build.id,
          '빌드 이름': build.nameKorean,
          '조커 타입': '보조',
          '조커 ID': joker.id,
          '조커 이름': joker.name,
          '희귀도': joker.rarity,
          '가격': joker.baseCost || 0,
          '효과': joker.effect || joker.description,
        });
      }
    });
  });

  return rows;
}

// 가격 밸런싱 분석 시트 생성
function createPriceBalancingSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '빌드 이름': 'Build Name',
    '등급': 'Tier',
    '핵심 조커 가격 합계': 'Core Cost',
    '보조 조커 가격 합계': 'Synergy Cost',
    '총 가격': 'Total Cost',
    '초반 데미지': 'Early Damage',
    '후반 데미지': 'Late Damage',
    '가격 대비 효율 (초반)': 'Cost Efficiency Early',
    '가격 대비 효율 (후반)': 'Cost Efficiency Late',
    '밸런싱 제안': 'Balancing Suggestion',
  });

  // 빌드별 가격 분석
  balatroBuilds.forEach(build => {
    const costs = calculateBuildCost(build);
    const earlyDamage = build.expectedDamage?.early || '0';
    const lateDamage = build.expectedDamage?.late || '0';
    
    // 데미지 범위 파싱 (예: "50-100" -> 평균 75)
    const parseDamage = (damageStr: string): number => {
      if (!damageStr || damageStr === '') return 0;
      const parts = damageStr.split('-');
      if (parts.length === 2) {
        return (parseInt(parts[0]) + parseInt(parts[1])) / 2;
      }
      const num = parseInt(damageStr.replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const earlyAvg = parseDamage(earlyDamage);
    const lateAvg = parseDamage(lateDamage);
    
    const earlyEfficiency = costs.totalCost > 0 ? earlyAvg / costs.totalCost : 0;
    const lateEfficiency = costs.totalCost > 0 ? lateAvg / costs.totalCost : 0;

    // 밸런싱 제안
    let suggestion = '';
    if (costs.totalCost > 50 && earlyEfficiency < 2) {
      suggestion = '가격이 높고 초반 효율이 낮음. 가격 조정 또는 초반 데미지 증가 고려';
    } else if (costs.totalCost < 20 && lateEfficiency > 100) {
      suggestion = '가격이 낮고 후반 효율이 매우 높음. 가격 증가 또는 효과 조정 고려';
    } else if (earlyEfficiency > 10 && lateEfficiency < 50) {
      suggestion = '초반 효율이 높지만 후반 성장이 부족. 후반 데미지 증가 고려';
    } else {
      suggestion = '밸런스 양호';
    }

    rows.push({
      '빌드 이름': build.nameKorean,
      '등급': build.tier,
      '핵심 조커 가격 합계': costs.coreCost,
      '보조 조커 가격 합계': costs.synergyCost,
      '총 가격': costs.totalCost,
      '초반 데미지': earlyDamage,
      '후반 데미지': lateDamage,
      '초반 데미지 평균': earlyAvg,
      '후반 데미지 평균': lateAvg,
      '가격 대비 효율 (초반)': earlyEfficiency.toFixed(2),
      '가격 대비 효율 (후반)': lateEfficiency.toFixed(2),
      '밸런싱 제안': suggestion,
    });
  });

  return rows;
}

// 타로 카드 시트 데이터 생성
function createTarotsSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '타로 카드 ID': 'ID',
    '타로 카드 이름': 'Name',
    '효과 설명': 'Description',
    '게임 내 가격': 'In-Game Cost',
    '희귀도': 'Rarity',
    '카테고리': 'Category',
    '주사위 게임 적용': 'Dice Game Applicable',
    '사용 빌드': 'Used in Builds',
  });

  // 타로 카드 데이터
  balatroTarots.forEach(tarot => {
    // 이 타로 카드를 사용하는 빌드 찾기 (게임플레이 플로우에서 언급된 것)
    const buildsUsingThisTarot = balatroBuilds.filter(build => {
      const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`.toLowerCase();
      const tarotName = tarot.name.toLowerCase();
      return flowText.includes('tarot') || flowText.includes(tarotName.split('(')[0].trim());
    });

    rows.push({
      '타로 카드 ID': tarot.id,
      '타로 카드 이름': tarot.name,
      '효과 설명': tarot.description,
      '게임 내 가격': tarotPrices[tarot.id] || 5, // 가격 설정
      '희귀도': 'consumable',
      '카테고리': 'Tarot',
      '주사위 게임 적용': true,
      '사용 빌드': buildsUsingThisTarot.map(b => b.nameKorean).join(', ') || '',
      '사용 빌드 수': buildsUsingThisTarot.length,
    });
  });

  return rows;
}

// 행성 카드 시트 데이터 생성
function createPlanetsSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '행성 카드 ID': 'ID',
    '행성 카드 이름': 'Name',
    '효과 설명': 'Description',
    '대상 족보': 'Target Hand',
    'Mult 증가': 'Mult Addition',
    'Chips 증가': 'Chips Addition',
    '게임 내 가격': 'In-Game Cost',
    '카테고리': 'Category',
    '주사위 게임 적용': 'Dice Game Applicable',
    '사용 빌드': 'Used in Builds',
  });

  // 행성 카드 데이터
  balatroPlanets.forEach(planet => {
    // 이 행성 카드를 사용하는 빌드 찾기
    const buildsUsingThisPlanet = balatroBuilds.filter(build => {
      const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`.toLowerCase();
      const planetName = planet.name.toLowerCase();
      return flowText.includes('planet') || flowText.includes(planetName) || 
             flowText.includes(planet.pokerHand?.toLowerCase() || '');
    });

    // Mult와 Chips 추출 (조정된 값 사용)
    const effect = planetEffects[planet.id] || { mult: 2, chips: 20 };

    rows.push({
      '행성 카드 ID': planet.id,
      '행성 카드 이름': planet.name,
      '효과 설명': planet.description || planet.addition,
      '대상 족보': planet.pokerHand || '',
      'Mult 증가': effect.mult,
      'Chips 증가': effect.chips,
      '게임 내 가격': planetPrices[planet.id] || 6, // 가격 설정
      '카테고리': 'Planet',
      '주사위 게임 적용': true,
      '사용 빌드': buildsUsingThisPlanet.map(b => b.nameKorean).join(', ') || '',
      '사용 빌드 수': buildsUsingThisPlanet.length,
    });
  });

  return rows;
}

// 스펙트럴 카드 시트 데이터 생성
function createSpectralsSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '스펙트럴 카드 ID': 'ID',
    '스펙트럴 카드 이름': 'Name',
    '효과 설명': 'Description',
    '게임 내 가격': 'In-Game Cost',
    '카테고리': 'Category',
    '주사위 게임 적용': 'Dice Game Applicable',
    '사용 빌드': 'Used in Builds',
  });

  // 스펙트럴 카드 데이터
  balatroSpectrals.forEach(spectral => {
    // 이 스펙트럴 카드를 사용하는 빌드 찾기
    const buildsUsingThisSpectral = balatroBuilds.filter(build => {
      const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`.toLowerCase();
      const spectralName = spectral.name.toLowerCase();
      return flowText.includes('spectral') || flowText.includes(spectralName);
    });

    rows.push({
      '스펙트럴 카드 ID': spectral.id,
      '스펙트럴 카드 이름': spectral.name,
      '효과 설명': spectral.description || spectral.effect,
      '게임 내 가격': spectralPrices[spectral.id] || 7, // 가격 설정
      '카테고리': 'Spectral',
      '주사위 게임 적용': true,
      '사용 빌드': buildsUsingThisSpectral.map(b => b.nameKorean).join(', ') || '',
      '사용 빌드 수': buildsUsingThisSpectral.length,
    });
  });

  return rows;
}

// 빌드별 소모품 매핑 시트 생성
function createBuildConsumablesSheet() {
  const rows: any[] = [];

  // 헤더
  rows.push({
    '빌드 ID': 'Build ID',
    '빌드 이름': 'Build Name',
    '소모품 타입': 'Consumable Type',
    '소모품 ID': 'Consumable ID',
    '소모품 이름': 'Consumable Name',
    '사용 단계': 'Usage Stage',
    '효과': 'Effect',
    '가격': 'Cost',
  });

  // 빌드별 소모품 매핑
  balatroBuilds.forEach(build => {
    // 타로 카드 추출 (게임플레이 플로우에서 언급)
    const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`;
    
    // 타로 카드 매핑
    if (flowText.toLowerCase().includes('tarot')) {
      // 일반적인 타로 카드 사용
      const commonTarots = ['the_fool_0', 'the_star_xvii', 'the_sun_xix', 'the_moon_xviii', 'the_world_xxi'];
      commonTarots.forEach(tarotId => {
        const tarot = balatroTarots.find(t => t.id === tarotId);
        if (tarot) {
          let stage = 'mid';
          if (build.gameplayFlow.early.toLowerCase().includes('tarot')) stage = 'early';
          if (build.gameplayFlow.late.toLowerCase().includes('tarot')) stage = 'late';

          rows.push({
            '빌드 ID': build.id,
            '빌드 이름': build.nameKorean,
            '소모품 타입': 'Tarot',
            '소모품 ID': tarot.id,
            '소모품 이름': tarot.name,
            '사용 단계': stage,
            '효과': tarot.description,
            '가격': tarotPrices[tarot.id] || 5,
          });
        }
      });
    }

    // 행성 카드 매핑
    balatroPlanets.forEach(planet => {
      const planetName = planet.name.toLowerCase();
      const pokerHand = planet.pokerHand?.toLowerCase() || '';
      const flowLower = flowText.toLowerCase();
      
      if (flowLower.includes(planetName) || flowLower.includes(pokerHand) || flowLower.includes('planet')) {
        let stage = 'mid';
        if (build.gameplayFlow.early.toLowerCase().includes(planetName) || build.gameplayFlow.early.toLowerCase().includes(pokerHand)) stage = 'early';
        if (build.gameplayFlow.late.toLowerCase().includes(planetName) || build.gameplayFlow.late.toLowerCase().includes(pokerHand)) stage = 'late';

        rows.push({
          '빌드 ID': build.id,
          '빌드 이름': build.nameKorean,
          '소모품 타입': 'Planet',
          '소모품 ID': planet.id,
          '소모품 이름': planet.name,
          '사용 단계': stage,
          '효과': planet.description || planet.addition,
          '가격': planetPrices[planet.id] || 6,
        });
      }
    });
  });

  return rows;
}

// 메인 함수
function generateExcel() {
  console.log('📊 빌드 및 구성품 밸런싱 엑셀 파일 생성 중...');

  const workbook = XLSX.utils.book_new();

  // 1. 빌드 시트
  console.log('  - 빌드 시트 생성 중...');
  const buildsData = createBuildsSheet();
  const buildsSheet = XLSX.utils.json_to_sheet(buildsData);
  XLSX.utils.book_append_sheet(workbook, buildsSheet, '빌드 목록');

  // 2. 조커 시트
  console.log('  - 조커 시트 생성 중...');
  const jokersData = createJokersSheet();
  const jokersSheet = XLSX.utils.json_to_sheet(jokersData);
  XLSX.utils.book_append_sheet(workbook, jokersSheet, '조커 목록');

  // 3. 빌드별 조커 상세 시트
  console.log('  - 빌드별 조커 상세 시트 생성 중...');
  const buildJokersData = createBuildJokersDetailSheet();
  const buildJokersSheet = XLSX.utils.json_to_sheet(buildJokersData);
  XLSX.utils.book_append_sheet(workbook, buildJokersSheet, '빌드별 조커 상세');

  // 4. 가격 밸런싱 분석 시트
  console.log('  - 가격 밸런싱 분석 시트 생성 중...');
  const priceBalancingData = createPriceBalancingSheet();
  const priceBalancingSheet = XLSX.utils.json_to_sheet(priceBalancingData);
  XLSX.utils.book_append_sheet(workbook, priceBalancingSheet, '가격 밸런싱 분석');

  // 5. 타로 카드 시트
  console.log('  - 타로 카드 시트 생성 중...');
  const tarotsData = createTarotsSheet();
  const tarotsSheet = XLSX.utils.json_to_sheet(tarotsData);
  XLSX.utils.book_append_sheet(workbook, tarotsSheet, '타로 카드');

  // 6. 행성 카드 시트
  console.log('  - 행성 카드 시트 생성 중...');
  const planetsData = createPlanetsSheet();
  const planetsSheet = XLSX.utils.json_to_sheet(planetsData);
  XLSX.utils.book_append_sheet(workbook, planetsSheet, '행성 카드');

  // 7. 스펙트럴 카드 시트
  console.log('  - 스펙트럴 카드 시트 생성 중...');
  const spectralsData = createSpectralsSheet();
  const spectralsSheet = XLSX.utils.json_to_sheet(spectralsData);
  XLSX.utils.book_append_sheet(workbook, spectralsSheet, '스펙트럴 카드');

  // 8. 빌드별 소모품 매핑 시트
  console.log('  - 빌드별 소모품 매핑 시트 생성 중...');
  const buildConsumablesData = createBuildConsumablesSheet();
  const buildConsumablesSheet = XLSX.utils.json_to_sheet(buildConsumablesData);
  XLSX.utils.book_append_sheet(workbook, buildConsumablesSheet, '빌드별 소모품');

  // 파일 저장
  const outputPath = path.join(__dirname, '../benchmark/BuildBalancing.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log(`✅ 엑셀 파일 생성 완료: ${outputPath}`);
  console.log(`   - 빌드 수: ${balatroBuilds.length}개`);
  console.log(`   - 사용된 조커 수: ${new Set(balatroBuilds.flatMap(b => [...b.coreJokers, ...b.synergyJokers])).size}개`);
  console.log(`   - 타로 카드 수: ${balatroTarots.length}개`);
  console.log(`   - 행성 카드 수: ${balatroPlanets.length}개`);
  console.log(`   - 스펙트럴 카드 수: ${balatroSpectrals.length}개`);
  console.log(`   - 시트 수: 8개`);
}

// 실행
generateExcel();

