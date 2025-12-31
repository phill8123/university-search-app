import { generatedUniversitiesDB } from './universityDataGenerated';

export interface UniversityStructure {
    name: string;
    location: string; // '서울', '경기', '인천', '지방', etc.
    type: string; // '사립', '국립', etc.
    tier: "SKY" | "Top15" | "InSeoul" | "Metro" | "National" | "Regional" | "Edu";
    estMetic: number; // 1 (SKY) ~ 99 (Low)
    colleges: {
        [collegeName: string]: string[]; // "공과대학": ["컴퓨터공학과", ...]
    };
    deptCategories?: { [deptName: string]: string }; // "컴퓨터공학과": "공학계열 - 전산학컴퓨터공학"
    stats?: { [deptName: string]: { recruit: number; applicants: number; rate: string } }; // Admission Stats
}

// Helper to generate estimated admission data
export const getEstimatedGrade = (tier: UniversityStructure["tier"], deptName: string, year: number) => {
    const isMed = ["의예과", "치의예과", "약학과", "수의예과", "한의예과"].includes(deptName);
    const isPop = ["컴퓨터", "소프트웨어", "반도체", "인공지능", "전자", "화공"].some(k => deptName.includes(k));

    let baseSusi = { "SKY": 1.2, "Top15": 1.7, "InSeoul": 2.2, "National": 3.0, "Metro": 3.3, "Regional": 4.5, "Edu": 2.0 }[tier] || 5.0;
    let baseJeongsi = { "SKY": 96, "Top15": 92, "InSeoul": 86, "National": 77, "Metro": 74, "Regional": 60, "Edu": 80 }[tier] || 50;

    if (isMed) { baseSusi = 1.05; baseJeongsi = 98.5; }
    else if (isPop) { baseSusi -= 0.15; baseJeongsi += 1.5; }

    // Year variance: 2023 might be slightly harder/easier than 2024/2025
    // Simple deterministic variance based on year
    const yearFactor = (year % 2 === 0) ? 0.05 : -0.05;
    baseSusi += yearFactor;
    baseJeongsi -= (yearFactor * 10);

    const randomVar = (Math.random() * 0.3) - 0.15;
    const susiVal = Math.max(1.0, baseSusi + randomVar).toFixed(2);
    const jeongsiVal = Math.min(100, baseJeongsi + (randomVar * -3)).toFixed(1);

    return { susi: susiVal, jeongsi: jeongsiVal };
};

// Helper to get approximate (or real if known) tuition and employment stats
export const getApproximateSpecs = (univName: string, tier: UniversityStructure["tier"], field: string) => {
    // Database of Real Stats (2024 Avg Estimates for Major Univs)
    const realStatsDB: Record<string, { t: string, e: string }> = {
        "서울대학교": { t: "601만원", e: "71.1%" },
        "연세대학교": { t: "915만원", e: "72.5%" },
        "고려대학교": { t: "827만원", e: "70.3%" },
        "성균관대학교": { t: "838만원", e: "77.1%" },
        "한양대학교": { t: "849만원", e: "73.8%" },
        "서강대학교": { t: "793만원", e: "73.9%" },
        "건국대학교": { t: "827만원", e: "64.8%" },
        "중앙대학교": { t: "809만원", e: "70.1%" },
        "경희대학교": { t: "795만원", e: "67.8%" },
        "한국외국어대학교": { t: "714만원", e: "63.2%" },
        "서울시립대학교": { t: "239만원", e: "65.5%" },
        "이화여자대학교": { t: "869만원", e: "65.3%" },
        "부산대학교": { t: "446만원", e: "59.2%" },
        "경북대학교": { t: "450만원", e: "60.4%" },
        "충남대학교": { t: "437만원", e: "61.3%" },
        "전남대학교": { t: "417만원", e: "58.1%" }
    };

    if (realStatsDB[univName]) {
        return {
            tuition: realStatsDB[univName].t,
            employment: realStatsDB[univName].e
        };
    }

    // Fallback: Estimates logic
    let tuition = "";
    let employment = "";

    // Tuition Logic
    if (tier === "National" || tier === "Regional" || tier === "Edu") {
        tuition = "400~450만원 (예상)";
    } else {
        if (field === "공학" || field === "의학" || field === "예체능") tuition = "900~950만원 (예상)";
        else if (field === "자연") tuition = "800~850만원 (예상)";
        else tuition = "700~780만원 (예상)";
    }

    // Employment Logic
    if (tier === "SKY" || tier === "Top15" || field === "의학" || field === "공학") {
        employment = "70~80% (예상)";
    } else if (tier === "Edu") {
        employment = "60~70% (임용 포함)";
    } else {
        employment = "60~70% (예상)";
    }

    return { tuition, employment };
};

export const realAdmissions = [
    {
        id: "snu-cs-2025",
        universityName: "서울대학교",
        departmentName: "컴퓨터공학부",
        location: "서울",
        field: "공학",
        admissionData: [
            { year: "2025", susiGyogwa: "1.11 (70%컷)", susiJonghap: "1.08 (추정)", jeongsi: "98.5 (평균)" },
            { year: "2024", susiGyogwa: "1.13 (70%컷)", susiJonghap: "1.15 (50%컷)", jeongsi: "98.2 (70%컷)" }
        ],
        description: "국내 최고 수준의 컴퓨터공학 교육 및 연구 기관",
        tuitionFee: "601만원",
        employmentRate: "88.5%",
        departmentRanking: "국내 1위"
    },
    {
        id: "yonsei-cs-2025",
        universityName: "연세대학교",
        departmentName: "컴퓨터과학과",
        location: "서울",
        field: "공학",
        admissionData: [
            { year: "2025", susiGyogwa: "1.35 (추정)", susiJonghap: "1.52 (추정)", jeongsi: "97.5 (평균)" },
            { year: "2024", susiGyogwa: "1.34 (70%컷)", susiJonghap: "1.55 (50%컷)", jeongsi: "97.1 (70%컷)" }
        ],
        description: "창의적이고 혁신적인 컴퓨터 과학 리더 양성",
        tuitionFee: "915만원",
        employmentRate: "85.2%",
        departmentRanking: "국내 최상위권"
    },
    {
        id: "korea-cs-2025",
        universityName: "고려대학교",
        departmentName: "컴퓨터학과",
        location: "서울",
        field: "공학",
        admissionData: [
            { year: "2025", susiGyogwa: "1.38 (추정)", susiJonghap: "1.65 (추정)", jeongsi: "97.2 (평균)" },
            { year: "2024", susiGyogwa: "1.36 (70%컷)", susiJonghap: "1.72 (50%컷)", jeongsi: "96.8 (70%컷)" }
        ],
        description: "소프트웨어 중심 사회를 선도하는 인재 배출",
        tuitionFee: "900만원",
        employmentRate: "86.1%",
        departmentRanking: "국내 최상위권"
    }
];

// Use the generated DB as the source of truth
// We cast it to UniversityStructure[] to ensure type safety (though it matches the structure)
export const universitiesDB: UniversityStructure[] = generatedUniversitiesDB as UniversityStructure[];
