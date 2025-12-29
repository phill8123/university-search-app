# 대학학과 검색 서비스 (Korea University Finder)

Google Gemini AI를 활용하여 한국의 4년제 대학 학과 정보를 검색하고, 최근 입시 결과를 조회할 수 있는 웹 애플리케이션입니다.

## 주요 기능
- 🔍 **자연어 검색**: "서울권 컴공", "의예과 입결" 등 자연스러운 검색 지원
- 📊 **입시 결과 조회**: 최근 3개년(2023-2025) 수시/정시 입결 데이터 제공 (AI 추정 및 대학어디가 기반)
- 🏫 **상세 정보**: 학과 설명, 등록금, 취업률 등 정보 카드 제공

## 기술 스택
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`gemini-3-flash-preview`)
- **Build**: Vite

## 로컬 실행 방법

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정
최상위 경로에 `.env` 파일을 생성하고 API 키를 입력하세요.
```
API_KEY=your_google_api_key_here
```

3. 개발 서버 실행
```bash
npm run dev
```

## 배포 (Vercel)

이 프로젝트는 Vercel에 최적화되어 있습니다.

1. GitHub에 코드를 업로드합니다.
2. Vercel에서 'New Project'를 클릭하고 레포지토리를 불러옵니다.
3. **Environment Variables** 설정에서 `API_KEY`를 추가합니다.
4. Deploy 버튼을 누르면 배포가 완료됩니다.
