
export interface AdmissionYearData {
  year: string;
  susiGyogwa: string; // e.g., "2.1등급"
  susiJonghap: string; // e.g., "2.5등급"
  jeongsi: string; // e.g., "88.5%" (Baekbunwi) or score
}

export interface UniversityDepartment {
  id: string;
  universityName: string; // 대학명
  location: string; // 위치
  field: string; // 계열 (인문, 자연, 공학 등)
  departmentName: string; // 학과명
  admissionData: AdmissionYearData[]; // 2023, 2024 data
  description?: string; // Short description of the dept
  tuitionFee?: string; // 연간 등록금
  employmentRate?: string; // 취업률
  departmentRanking?: string; // 학과 순위/위상
  aiSummary?: string;
  admission2024?: AdmissionYearData | null;
}

export interface SearchResponse {
  estimatedTotalCount: number; // 전국 개설 대학 추정치
  departments: UniversityDepartment[];
}

export enum LoadingStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
