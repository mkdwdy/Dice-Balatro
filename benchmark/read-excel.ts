import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 엑셀 파일 읽기
const filePath = path.join(__dirname, 'BalatroDatabase.xlsx');

console.log('📖 엑셀 파일 읽기 중...');
console.log('파일 경로:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('❌ 파일을 찾을 수 없습니다:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetNames = workbook.SheetNames;

console.log('\n📊 시트 목록:');
sheetNames.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

// 첫 번째 시트 읽기
const firstSheet = workbook.Sheets[sheetNames[0]];
const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

console.log('\n📋 데이터 미리보기 (첫 10행):');
console.log('='.repeat(80));
data.slice(0, 10).forEach((row: any, index: number) => {
  console.log(`행 ${index + 1}:`, row);
});

console.log('\n📊 총 행 수:', data.length);
console.log('📊 총 열 수:', data[0] ? (data[0] as any[]).length : 0);

// 헤더 확인
if (data.length > 0) {
  console.log('\n📌 헤더 (첫 번째 행):');
  console.log(data[0]);
}

