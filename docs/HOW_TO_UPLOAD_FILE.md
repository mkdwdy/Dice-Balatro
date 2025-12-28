# 파일 업로드 방법 가이드

## 📁 Cursor에서 파일 업로드하는 방법

### 방법 1: 드래그 앤 드롭 (가장 간단) ⭐⭐⭐⭐⭐

1. **엑셀 파일 준비**
   - 엑셀에서 파일 저장
   - 파일명: `balatro-jokers-raw.xlsx` (또는 `.csv`)

2. **Cursor로 드래그 앤 드롭**
   - 파일 탐색기에서 파일 선택
   - `benchmark/` 폴더로 드래그 앤 드롭
   - 또는 Cursor의 파일 트리에서 `benchmark/` 폴더를 열고 드래그 앤 드롭

3. **완료!**
   - 파일이 `benchmark/balatro-jokers-raw.xlsx` 위치에 생성됨

### 방법 2: 파일 탐색기에서 복사-붙여넣기

1. **파일 탐색기에서 파일 복사**
   - 엑셀 파일을 파일 탐색기에서 찾기
   - 파일 선택 → 복사 (Cmd/Ctrl + C)

2. **Cursor에서 붙여넣기**
   - Cursor의 파일 트리에서 `benchmark/` 폴더 우클릭
   - "Paste" 또는 "붙여넣기" 선택
   - 또는 `benchmark/` 폴더를 열고 빈 공간에 붙여넣기

### 방법 3: 터미널로 복사

```bash
# 파일이 다른 위치에 있다면
cp /path/to/your/file.xlsx /Users/dwmoon/Downloads/Dice-Balatro/benchmark/balatro-jokers-raw.xlsx

# 또는 파일 탐색기에서 직접 복사
```

### 방법 4: 파일 내용 직접 제공 (간단한 경우)

엑셀 파일 대신:
- 텍스트로 복사하여 채팅에 붙여넣기
- 제가 직접 파일로 변환

## 📋 파일 위치

파일을 다음 위치에 저장해주세요:
```
/Users/dwmoon/Downloads/Dice-Balatro/benchmark/balatro-jokers-raw.xlsx
```

또는 상대 경로:
```
benchmark/balatro-jokers-raw.xlsx
```

## ✅ 확인 방법

파일이 업로드되었는지 확인:
```bash
ls -lh benchmark/balatro-jokers-raw.*
```

또는 Cursor의 파일 트리에서 `benchmark/` 폴더 확인

## 💡 추천 방법

**가장 간단한 방법:**
1. 엑셀에서 파일 저장
2. 파일 탐색기에서 파일 선택
3. Cursor의 `benchmark/` 폴더로 드래그 앤 드롭

**또는:**
- 파일 내용을 텍스트로 복사하여 채팅에 붙여넣기
- 제가 직접 파일로 변환

## 🔄 다음 단계

파일이 업로드되면:
1. 제가 파일을 읽어서 확인
2. 데이터 검증
3. TypeScript 데이터베이스로 변환
4. 완료!

