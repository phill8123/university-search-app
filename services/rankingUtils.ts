export const UNIVERSITY_TIERS: Record<string, number> = {
    // Tier 1: symbolic Top
    "서울대학교": 100,

    // Tier 1.5: Science & Tech Top
    "카이스트": 99,
    "포항공과대학교": 99,
    "한국과학기술원": 99,

    // Tier 2: SKY
    "연세대학교": 95,
    "고려대학교": 95,

    // Tier 3: Seo-Seong-Han
    "성균관대학교": 90,
    "서강대학교": 89,
    "한양대학교": 89,

    // Tier 4: Jung-Kyung-Oe-Si
    "중앙대학교": 85,
    "경희대학교": 85,
    "한국외국어대학교": 84,
    "서울시립대학교": 85,
    "이화여자대학교": 86,

    // Tier 5: Geon-Dong-Hong & Special
    "건국대학교": 80,
    "동국대학교": 80,
    "홍익대학교": 80,
    "숙명여자대학교": 78,
    "아주대학교": 78,
    "인하대학교": 78,

    // Tier 6: National Flagships
    "부산대학교": 75,
    "경북대학교": 75,
    "전남대학교": 72,
    "충남대학교": 72,

    // Tier 7: Kook-Soong-Se-Dan
    "국민대학교": 70,
    "숭실대학교": 70,
    "세종대학교": 70,
    "단국대학교": 70,
    "서울과학기술대학교": 72,
    "광운대학교": 68,
    "명지대학교": 65,
    "상명대학교": 65,
    "가톨릭대학교": 65, // General Score (Medical will be separate)

    // Explicit Lower Tiers (To prevent "Name" confusion)
    "남서울대학교": 40,
    "동서울대학교": 35,
    "서울신학대학교": 40,
    "강남대학교": 45, // Gyeonggi
    "서경대학교": 55, // In Seoul but lower tier
    "극동대학교": 35,
    "중부대학교": 35,
    "동양대학교": 35,
};

// Big 5 Hospitals + Major Medical Schools
export const MAJOR_HOSPITALS = [
    "서울대학교", // SNU Hospital
    "연세대학교", // Severance
    "가톨릭대학교", // St. Mary's (Huge Bonus for Med/Nurs)
    "성균관대학교", // Samsung Medical
    "울산대학교", // Asan Medical
    "고려대학교", // Anam
];

// Traditional Pharmacy Strongholds (Besides Big 5/SKY)
export const MAJOR_PHARMACY = [
    "중앙대학교",
    "이화여자대학교",
    "성균관대학교",
    "서울대학교",
    "숙명여자대학교",
    "부산대학교"
];

export const getBaseTierScore = (univName: string): number => {
    // Exact match
    if (UNIVERSITY_TIERS[univName]) return UNIVERSITY_TIERS[univName];

    // Partial Match check (e.g., "서울대" matching "서울대학교")
    for (const key in UNIVERSITY_TIERS) {
        if (univName.includes(key) || key.includes(univName)) {
            return UNIVERSITY_TIERS[key];
        }
    }

    // Default for others
    if (univName.includes("과학기술원")) return 90; // UNIST, GIST, DGIST
    if (univName.includes("교대")) return 75; // Education Universities

    return 50;
};
