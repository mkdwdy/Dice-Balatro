# 엑셀 파일 형식 가이드

## ✅ 지원하는 파일 형식

### 1. XLSX (권장)
- ✅ **엑셀 파일 (.xlsx)**: 완전히 지원 가능
- ✅ 가장 일반적인 형식
- ✅ 여러 시트 지원 가능

### 2. CSV
- ✅ **CSV 파일 (.csv)**: 완전히 지원 가능
- ✅ 더 간단하고 가볍음
- ✅ 텍스트 에디터로도 편집 가능

### 3. TSV
- ✅ **TSV 파일 (.tsv)**: 지원 가능
- ✅ 탭으로 구분된 형식

## 📋 추천 컬럼 구조

### 최소 필수 컬럼 (간단한 형식)
```
A열: name (영문 이름)
B열: description (효과 설명)
C열: rarity (common/uncommon/rare/legendary)
```

### 상세 형식 (권장)
| 컬럼명 | 설명 | 예시 | 필수 여부 |
|--------|------|------|----------|
| **name** | 조커 이름 (영문) | `Blue Print` | ✅ 필수 |
| **description** | 효과 설명 (영문) | `Copies the ability of the rightmost Joker` | ✅ 필수 |
| **rarity** | 희귀도 | `legendary` | ✅ 필수 |
| nameKorean | 조커 이름 (한글) | `청사진` | 선택 |
| descriptionKorean | 효과 설명 (한글) | `가장 오른쪽 조커의 능력을 복사` | 선택 |
| tier | 티어 등급 | `S+` | 선택 |
| effectType | 효과 타입 | `synergy` | 선택 |
| baseCost | 기본 가격 | `8` | 선택 |
| sellValue | 판매 가격 | `4` | 선택 |
| diceGameNotes | 주사위 게임 적용 노트 | `다른 조커 효과를 복사` | 선택 |

## 📝 파일 준비 방법

### 방법 1: 위키에서 직접 복사-붙여넣기
1. https://balatrowiki.org/w/Jokers 페이지 접속
2. "List of Jokers" 섹션의 표 선택
3. 복사 (Cmd/Ctrl + C)
4. 엑셀에 붙여넣기 (Cmd/Ctrl + V)
5. 첫 번째 행을 컬럼 헤더로 사용

### 방법 2: 수동 입력
- 위의 추천 컬럼 구조대로 직접 입력
- 최소한 name, description, rarity만 있으면 됨

### 방법 3: CSV로 시작
- 간단한 텍스트 파일로 시작
- 나중에 엑셀로 변환 가능

## 🔄 파일 제출 위치

엑셀 파일을 다음 위치에 저장해주세요:
```
benchmark/balatro-jokers-raw.xlsx
또는
benchmark/balatro-jokers-raw.csv
```

## 🚀 처리 프로세스

### 1단계: 파일 읽기
```typescript
// 제가 할 일:
- xlsx 또는 csv 파일 읽기
- 데이터 검증
- 누락된 정보 확인
```

### 2단계: 데이터 변환
```typescript
// 제가 할 일:
- 엑셀 데이터를 TypeScript 배열로 변환
- 스키마에 맞게 구조화
- 타입 체크
```

### 3단계: 검증 및 보완
```typescript
// 제가 할 일:
- 주사위 게임 적용 가능성 분석
- 효과 타입 자동 분류 (가능한 경우)
- 누락된 정보 보완
```

## 💡 추천 형식

### 가장 간단한 형식 (빠르게 시작)
```
A열: name
B열: description  
C열: rarity
```

### 권장 형식 (더 상세한 데이터베이스)
```
A열: name
B열: nameKorean (선택)
C열: description
D열: descriptionKorean (선택)
E열: rarity
F열: tier (선택)
G열: effectType (선택)
H열: baseCost (선택)
I열: diceGameNotes (선택)
```

## ✅ 결론

**XLSX 형식 완전히 지원합니다!**

### 제안:
1. **엑셀 파일 (.xlsx)** 준비
   - 위키에서 표 복사-붙여넣기
   - 또는 수동 입력
   
2. **파일 위치**: `benchmark/balatro-jokers-raw.xlsx`

3. **제가 처리**: 
   - 자동으로 읽기
   - TypeScript 데이터베이스로 변환
   - 검증 및 보완

**최소한 name, description, rarity만 있어도 됩니다!**
나머지는 제가 보완하거나 나중에 추가할 수 있습니다.

