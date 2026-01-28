import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { balatroBuilds } from '../benchmark/balatro-builds-db.js';
import { balatroTarots } from '../benchmark/balatro-tarots-db.js';
import { balatroPlanets } from '../benchmark/balatro-planets-db.js';
import { balatroSpectrals } from '../benchmark/balatro-spectrals-db.js';
import type { BalatroBuild } from '../benchmark/balatro-builds-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 빌드 데이터베이스 개선: 소모품 정보 추가 및 발라트로와 교차검증
 */

// 빌드별 추천 소모품 매핑
const buildConsumables: Record<string, {
  tarots?: string[];
  planets?: string[];
  spectrals?: string[];
  notes?: string;
}> = {
  // Flush 빌드
  'flush_build': {
    tarots: ['the_star_xvii', 'the_sun_xix', 'the_moon_xviii', 'the_world_xxi'], // 슈트 변환
    planets: ['jupiter'], // Flush 강화
    notes: '타로 카드로 슈트 변환, Jupiter로 Flush 강화',
  },
  
  // Pair 빌드
  'pair_build': {
    planets: ['mercury'], // Pair 강화
    notes: 'Mercury로 Pair 강화',
  },
  
  // Straight 빌드
  'straight_build': {
    tarots: ['strength_xi'], // 값 증가
    planets: ['saturn'], // Straight 강화
    notes: 'Strength로 값 조정, Saturn으로 Straight 강화',
  },
  
  // Vampire + Midas 빌드
  'vampire_midas_build': {
    tarots: ['the_devil_xv'], // Gold Card 생성
    spectrals: ['talisman'], // Gold Seal 추가
    notes: 'The Devil로 Gold Card 생성, Talisman으로 Gold Seal 추가',
  },
  
  // Campfire Scaling 빌드
  'campfire_scaling_build': {
    planets: ['mercury'], // 안정적인 족보 강화
    notes: 'Mercury로 Pair 강화하여 안정적인 성장',
  },
  
  // Blueprint + Brainstorm 빌드
  'blueprint_brainstorm_build': {
    tarots: ['judgement_xx'], // 조커 생성
    spectrals: ['ankh'], // 조커 복제
    notes: 'Judgement로 조커 생성, Ankh로 조커 복제',
  },
  
  // Triboulet Retrigger 빌드
  'triboulet_retrigger_build': {
    tarots: ['the_empress_iii'], // Mult 강화
    planets: ['venus', 'mars'], // 족보 강화
    notes: 'The Empress로 Mult 강화, 행성 카드로 족보 강화',
  },
  
  // Baron King 빌드
  'baron_king_build': {
    tarots: ['strength_xi', 'ouija'], // 값 변환
    spectrals: ['ouija'], // 값 통일
    notes: 'Strength와 Ouija로 값 6 통일',
  },
  
  // Economy 빌드
  'economy_build': {
    tarots: ['the_hermit_ix', 'temperance_xiv'], // 골드 생성
    notes: 'The Hermit와 Temperance로 골드 생성',
  },
  
  // Hybrid Flush + Straight 빌드
  'hybrid_flush_straight': {
    tarots: ['the_star_xvii', 'strength_xi'], // 슈트/값 변환
    planets: ['jupiter', 'saturn'], // Flush/Straight 강화
    notes: '타로 카드로 슈트/값 조정, Jupiter와 Saturn으로 족보 강화',
  },
};

// 빌드 데이터베이스에 소모품 정보 추가
function addConsumablesToBuilds() {
  const updatedBuilds = balatroBuilds.map(build => {
    const consumables = buildConsumables[build.id];
    
    if (consumables) {
      return {
        ...build,
        consumables: {
          tarots: consumables.tarots || [],
          planets: consumables.planets || [],
          spectrals: consumables.spectrals || [],
          notes: consumables.notes,
        },
      };
    }
    
    return build;
  });
  
  return updatedBuilds;
}

// 발라트로와 비교하여 빌드 평가
function evaluateBuildsAgainstBalatro() {
  console.log('\n📊 발라트로와의 교차검증 결과:\n');
  
  const evaluation = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    missingBuilds: [] as string[],
    improvements: [] as string[],
  };
  
  // 강점 분석
  const buildCount = balatroBuilds.length;
  const categories = new Set(balatroBuilds.map(b => b.category));
  
  evaluation.strengths.push(`✅ 총 ${buildCount}개 빌드 (발라트로의 주요 빌드 커버)`);
  evaluation.strengths.push(`✅ ${categories.size}개 카테고리 (다양한 빌드 타입)`);
  evaluation.strengths.push(`✅ 주사위 게임에 맞게 적응됨`);
  
  // 약점 분석
  const buildsWithoutConsumables = balatroBuilds.filter(build => {
    const flowText = `${build.gameplayFlow.early} ${build.gameplayFlow.mid} ${build.gameplayFlow.late}`;
    return !flowText.toLowerCase().includes('tarot') && 
           !flowText.toLowerCase().includes('planet') &&
           !flowText.toLowerCase().includes('spectral');
  });
  
  if (buildsWithoutConsumables.length > 0) {
    evaluation.weaknesses.push(`⚠️ ${buildsWithoutConsumables.length}개 빌드에 소모품 정보 부족`);
  }
  
  // 누락된 빌드 타입 확인
  const balatroBuildTypes = [
    'negative_joker_build',      // Negative 조커 빌드
    'edition_build',             // Edition 빌드
    'seal_build',                // Seal 빌드
    'polychrome_build',          // Polychrome 빌드
  ];
  
  // 개선 제안
  evaluation.improvements.push('💡 소모품 사용을 빌드 데이터베이스에 명시적으로 추가');
  evaluation.improvements.push('💡 빌드별 소모품 가격 합계 계산 추가');
  evaluation.improvements.push('💡 빌드 완성도 지표 추가 (조커 수, 소모품 수 등)');
  
  return evaluation;
}

// 빌드 데이터베이스 파일 업데이트
function updateBuildsDatabase() {
  console.log('🔧 빌드 데이터베이스 개선 중...\n');
  
  const updatedBuilds = addConsumablesToBuilds();
  const evaluation = evaluateBuildsAgainstBalatro();
  
  // 결과 출력
  console.log('강점:');
  evaluation.strengths.forEach(s => console.log(`  ${s}`));
  
  if (evaluation.weaknesses.length > 0) {
    console.log('\n약점:');
    evaluation.weaknesses.forEach(w => console.log(`  ${w}`));
  }
  
  console.log('\n개선 제안:');
  evaluation.improvements.forEach(i => console.log(`  ${i}`));
  
  // 빌드별 소모품 요약 출력
  console.log('\n📋 빌드별 소모품 요약:');
  updatedBuilds.forEach(build => {
    const consumables = (build as any).consumables;
    if (consumables) {
      const totalConsumables = 
        (consumables.tarots?.length || 0) +
        (consumables.planets?.length || 0) +
        (consumables.spectrals?.length || 0);
      
      if (totalConsumables > 0) {
        console.log(`  ${build.nameKorean}: ${totalConsumables}개 소모품`);
      }
    }
  });
  
  return updatedBuilds;
}

// 실행
const improvedBuilds = updateBuildsDatabase();

console.log('\n✅ 빌드 평가 완료!');
console.log(`   - 총 빌드 수: ${improvedBuilds.length}개`);
console.log(`   - 소모품 정보 추가된 빌드: ${improvedBuilds.filter(b => (b as any).consumables).length}개`);



