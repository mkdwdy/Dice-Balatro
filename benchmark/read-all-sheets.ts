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
console.log('='.repeat(80));

if (!fs.existsSync(filePath)) {
  console.error('❌ 파일을 찾을 수 없습니다:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetNames = workbook.SheetNames;

console.log(`\n📊 총 ${sheetNames.length}개의 시트 발견:\n`);
sheetNames.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

// 각 시트별로 데이터 확인
sheetNames.forEach((sheetName, sheetIndex) => {
  console.log('\n' + '='.repeat(80));
  console.log(`\n📋 시트 ${sheetIndex + 1}: ${sheetName}`);
  console.log('='.repeat(80));
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`\n📊 총 행 수: ${data.length}`);
  
  if (data.length > 0) {
    console.log(`📊 총 열 수: ${(data[0] as any[]).length}`);
    console.log('\n📌 헤더 (첫 번째 행):');
    console.log(data[0]);
    
    console.log('\n📋 데이터 미리보기 (첫 5행, 헤더 제외):');
    data.slice(1, 6).forEach((row: any, index: number) => {
      console.log(`\n행 ${index + 2}:`);
      row.forEach((cell: any, colIndex: number) => {
        const header = (data[0] as any[])[colIndex];
        console.log(`  ${header}: ${cell}`);
      });
    });
    
    // 빈 행 제외한 실제 데이터 행 수
    const dataRows = data.slice(1).filter((row: any) => 
      row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
    );
    console.log(`\n📊 실제 데이터 행 수 (빈 행 제외): ${dataRows.length}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ 모든 시트 확인 완료!');

