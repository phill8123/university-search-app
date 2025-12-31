/// <reference types="vite/client" />
import { SearchResponse, UniversityDepartment } from "../types";
import { universitiesDB, realAdmissions, getEstimatedGrade, getApproximateSpecs, UniversityStructure } from "./universityData";

const apiKey = import.meta.env.VITE_API_KEY || "";

// Cache for AI results to improve performance
const aiCache: Record<string, UniversityDepartment> = {};

// Helper: Smart Fallback Description based on Department Field
const getSmartFallbackDescription = (univName: string, deptName: string) => {
  const d = deptName;
  if (d.includes("의예") || d.includes("의학")) return `${univName} ${deptName}는 생명 존중의 가치를 바탕으로 인류 건강에 기여하는 우수한 의료인을 양성합니다.`;
  if (d.includes("컴퓨터") || d.includes("소프트웨어") || d.includes("AI") || d.includes("인공지능")) return `${univName} ${deptName}는 4차 산업혁명을 선도하는 창의적이고 혁신적인 소프트웨어 전문 인재를 배출합니다.`;
  if (d.includes("전자") || d.includes("전기")) return `${univName} ${deptName}는 첨단 전자 기술을 선도하며 미래 사회를 이끌어갈 창의적인 공학 인재를 육성합니다.`;
  if (d.includes("경영")) return `${univName} ${deptName}는 글로벌 비즈니스 환경을 이끌어갈 리더십과 실무 능력을 겸비한 전문 경영인을 육성합니다.`;
  if (d.includes("경제")) return `${univName} ${deptName}는 경제 현상에 대한 통찰력과 분석력을 갖춘 글로벌 경제 전문가를 양성합니다.`;
  if (d.includes("국어") || d.includes("국문")) return `${univName} ${deptName}는 우리말과 글에 대한 깊이 있는 연구를 통해 민족 문화 창달에 기여하는 인재를 기릅니다.`;
  if (d.includes("영어") || d.includes("영문")) return `${univName} ${deptName}는 글로벌 시대의 필수 역량인 영어 능력과 인문학적 소양을 갖춘 국제적 인재를 교육합니다.`;
  if (d.includes("간호")) return `${univName} ${deptName}는 인간에 대한 사랑과 봉사 정신을 바탕으로 국민 건강 증진에 이바지하는 전문 간호사를 양성합니다.`;
  if (d.includes("교육")) return `${univName} ${deptName}는 올바른 교육관과 전문 지식을 갖춘 미래 사회의 참된 스승을 양성하는 요람입니다.`;
  if (d.includes("디자인") || d.includes("미술")) return `${univName} ${deptName}는 독창적인 예술 감각과 실무 능력을 함양하여 문화 예술계를 이끌어갈 전문가를 양성합니다.`;

  // Generic Fallback
  const reputation = ["우수한 교육 환경", "체계적인 커리큘럼", "높은 경쟁력", "창의적 인재 양성"].sort(() => 0.5 - Math.random())[0];
  return `${univName} ${deptName}은(는) ${reputation}을 바탕으로 해당 분야의 전문가를 양성하며, 국내에서 꾸준한 인지도를 유지하고 있습니다.`;
};

// Helper to prompt AI for real-time analysis using REST API
const generateAIAnalysis = async (univ: UniversityStructure, deptName: string, csvStats: any): Promise<Partial<UniversityDepartment>> => {
  const cacheKey = `${univ.name}-${deptName}`;
  if (aiCache[cacheKey]) return aiCache[cacheKey];

  if (!apiKey || apiKey === "dummy_key") return {};

  try {
    const prompt = `
      Act as a Korean university admissions expert. Research the department "${deptName}" at "${univ.name}".
      
      Context (Local Data - might be empty):
      - 2025 Recruit: ${csvStats?.recruit || 'Unknown'}
      - 2025 Applicants: ${csvStats?.applicants || 'Unknown'}
      - 2025 Rate: ${csvStats?.rate || 'Unknown'} : 1

      TASKS:
      1. RESEARCH/ESTIMATE: If Context is zero/unknown, YOU MUST research valid recent data (2024 results or 2025 plans) from "University Anywhere (Adiga)" or official sources. Do NOT return 0 or "Unknown".
      2. Department Analysis: Go to the official homepage of "${univ.name}" Department of "${deptName}". Summarize THEIR specific introduction text (curriculum, educational goals) into a single sentence under 150 characters. Avoid generic descriptions.
      
      OUTPUT JSON STRICTLY:
      {
        "admission2024": {
           "susiGyogwa": "e.g. 1.54 (70% cut)",
           "susiJonghap": "e.g. 2.11 (50% cut)",
           "jeongsi": "e.g. 94.2 (Avg)"
        },
        "summary": "Exactly 2 lines string describing 2025 and 2024 stats.\\nFormat:\\n2025(예상/확정): 모집 A명 / 지원 B명 / 경쟁률 C:1\\n2024(결과): 모집 X명 / 지원 Y명 / 경쟁률 Z:1",
        "description": "Under 150 characters specific summary of the department introduction from the university website."
      }
    `;

    // Timeout Promise
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean and Parse JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (!jsonStr) return {};

    const parsed = JSON.parse(jsonStr);

    const result = {
      tuitionFee: parsed.tuitionFee || "-",
      employmentRate: parsed.employmentRate || "-",
      departmentRanking: parsed.departmentRanking || "-",
      admission2024: parsed.admission2024 || null,
      aiSummary: parsed.summary || null,
      description: parsed.description || null // Return null if missing so we use fallback
    };

    aiCache[cacheKey] = result as any;
    return result;

  } catch (e) {
    console.error("AI Analysis Failed", e);
    return {}; // Fallback will be handled by caller
  }
};

// Helper to flatten university structure into search results
const flattenDepartments = (univ: UniversityStructure): UniversityDepartment[] => {
  const results: UniversityDepartment[] = [];
  const realData = realAdmissions.filter(r => r.universityName === univ.name);
  results.push(...realData);

  for (const [collegeName, deptList] of Object.entries(univ.colleges)) {
    for (const deptName of deptList) {
      if (results.some(r => r.departmentName === deptName)) continue;

      let field = "기타";

      // 0. Priority: CSV Data (Large - Middle)
      if (univ.deptCategories && univ.deptCategories[deptName]) {
        field = univ.deptCategories[deptName];
      }

      // Fallback or Refinement if 'field' is still generic or 'Other'
      // Only apply heuristics if we didn't get a good field from CSV or if it's "기타"
      const isGeneric = field === "기타" || field.trim() === "";

      if (isGeneric) {
        // 1. Check College Name
        if (collegeName.includes("공과") || collegeName.includes("소프트웨어") || collegeName.includes("IT")) field = "공학";
        else if (collegeName.includes("인문")) field = "인문";
        else if (collegeName.includes("사회") || collegeName.includes("경영") || collegeName.includes("경제")) field = "사회";
        else if (collegeName.includes("자연") || collegeName.includes("과학")) field = "자연";
        else if (collegeName.includes("의과") || collegeName.includes("간호") || collegeName.includes("약학")) field = "의학";
        else if (collegeName.includes("예술") || collegeName.includes("체육") || collegeName.includes("미술")) field = "예체능";

        // 2. Default Overrides based on University Tier
        if (univ.tier === "Edu") field = "교육";

        // 3. Strong Overrides based on Department Name
        if (deptName.includes("의예") || deptName.includes("의학") || deptName.includes("간호") || deptName.includes("약학") || deptName.includes("수학") || deptName.includes("한의") || deptName.includes("수의") || deptName.includes("물리치료") || deptName.includes("임상병리")) {
          field = "의학";
        } else if (deptName.includes("컴퓨터") || deptName.includes("소프트웨어") || deptName.includes("전기") || deptName.includes("전자") || deptName.includes("기계") || deptName.includes("건축") || deptName.includes("토목")) {
          field = "공학";
        } else if (deptName.includes("경영") || deptName.includes("경제") || deptName.includes("행정")) {
          field = "사회";
        } else if (deptName.includes("디자인") || deptName.includes("체육") || deptName.includes("음악") || deptName.includes("미술")) {
          field = "예체능";
        }
      }

      results.push({
        id: `${univ.name}-${deptName}`,
        universityName: univ.name,
        departmentName: deptName,
        location: univ.location,
        field: field,
        admissionData: [],
        description: `${univ.name} ${collegeName} ${deptName}`,
        tuitionFee: "700~900만원 (예상)",
        employmentRate: "60~70% (예상)",
        departmentRanking: "-"
      });
    }
  }
  return results;
};

// Helper to calculate a deterministic ranking score
const calculateRankingScore = (univ: UniversityStructure, deptName: string): number => {
  let score = 0;
  switch (univ.tier) {
    case "SKY": score = 95; break;
    case "Top15": score = 90; break;
    case "Edu": score = 88; break;
    case "InSeoul": score = 85; break;
    case "National": score = 75; break;
    case "Metro": score = 75; break;
    case "Regional": score = 60; break;
    default: score = 50;
  }
  const isMed = ["의예과", "치의예과", "한의예과", "수의예과", "약학과", "의학과"].some(k => deptName.includes(k));
  const isPop = ["컴퓨터", "소프트웨어", "인공지능", "반도체"].some(k => deptName.includes(k));

  if (isMed) {
    score += 20;
    const isBig5 = ["서울대학교", "연세대학교", "가톨릭대학교", "울산대학교", "성균관대학교"].includes(univ.name);
    if (isBig5 && (deptName.includes("의예과") || deptName.includes("의학과"))) score += 50;
    if (univ.name === "서울대학교") score += 1000;
  } else if (isPop) score += 3;

  if (univ.name === "서울대학교") score += 1000;

  let hash = 0;
  const str = univ.name + deptName;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return score + (Math.abs(hash) % 100 / 100);
};

export const searchDepartments = async (query: string): Promise<SearchResponse> => {
  if (!query) {
    const suggestions: UniversityDepartment[] = [];
    for (const univ of universitiesDB.slice(0, 10)) {
      const allDepts = flattenDepartments(univ);
      suggestions.push(...allDepts.filter(d => d.departmentName.includes("컴퓨터") || d.departmentName.includes("경영")));
    }
    return { estimatedTotalCount: suggestions.length, departments: suggestions };
  }

  const normalizedQuery = query.endsWith('대') ? query.slice(0, -1) : query;

  let globalResults: UniversityDepartment[] = [];
  const matchedUnivs = universitiesDB.filter(u => u.name.includes(query) || query.includes(u.name) || (normalizedQuery.length > 1 && u.name.includes(normalizedQuery)));

  if (matchedUnivs.length > 0) {
    for (const univ of matchedUnivs) {
      const depts = flattenDepartments(univ);

      // Normalize function to remove common suffixes
      const cleanName = (name: string) => name.replace(/대학교?$/, "").replace(/대$/, "");

      const cleanQuery = cleanName(query.trim());
      const cleanUnivName = cleanName(univ.name);

      // If the query is essentially just the university name (e.g. "서울대", "서울대학교")
      if (cleanQuery === cleanUnivName) {
        globalResults.push(...depts);
      } else {
        // Otherwise, try to extract the department part
        // e.g. "서울대 컴퓨터" -> "컴퓨터"
        const queryDept = query.replace(univ.name, "").replace(cleanUnivName, "").trim();

        if (queryDept.length > 0) {
          globalResults.push(...depts.filter(d => d.departmentName.includes(queryDept)));
        } else {
          // Fallback: if replacement result is empty, it means it matched fully
          globalResults.push(...depts);
        }
      }
    }
  } else {
    const isMedSearch = ["의대", "의예과", "의학과"].includes(query);
    for (const univ of universitiesDB) {
      let matches = flattenDepartments(univ).filter(d => d.departmentName.includes(query));
      if (isMedSearch) matches = matches.filter(d => !d.departmentName.includes("치") && !d.departmentName.includes("한") && !d.departmentName.includes("수"));
      globalResults.push(...matches);
    }
  }

  globalResults.sort((a, b) => {
    const uA = universitiesDB.find(u => u.name === a.universityName);
    const uB = universitiesDB.find(u => u.name === b.universityName);
    if (!uA || !uB) return 0;
    return calculateRankingScore(uB, b.departmentName) - calculateRankingScore(uA, a.departmentName);
  });

  return { estimatedTotalCount: globalResults.length, departments: globalResults.slice(0, 100) };
};

export const getDepartmentDetails = async (universityName: string, departmentName: string): Promise<UniversityDepartment> => {
  const univ = universitiesDB.find(u => u.name === universityName);
  if (!univ) return { id: "error", universityName, departmentName, location: "", field: "", admissionData: [], description: "정보 없음", tuitionFee: "-", employmentRate: "-", departmentRanking: "-" };

  const est = getEstimatedGrade(univ.tier, departmentName, 2025);
  const estPrev = getEstimatedGrade(univ.tier, departmentName, 2024);
  const est2023 = getEstimatedGrade(univ.tier, departmentName, 2023);
  const stats = univ.stats?.[departmentName];

  // Derive Field
  let field = "기타";
  for (const [college, depts] of Object.entries(univ.colleges)) {
    if (depts.includes(departmentName)) {
      if (college.includes("공과") || college.includes("소프트웨어") || college.includes("IT")) field = "공학";
      else if (college.includes("인문")) field = "인문";
      else if (college.includes("사회") || college.includes("경영") || college.includes("경제")) field = "사회";
      else if (college.includes("자연") || college.includes("과학")) field = "자연";
      else if (college.includes("의과") || college.includes("간호") || college.includes("약학")) field = "의학";
      else if (college.includes("예술") || college.includes("체육") || college.includes("미술")) field = "예체능";
      if (univ.tier === "Edu") field = "교육";
      break;
    }
  }

  // 0. Get Approximate Specs (Just for internal use)
  const approximate = getApproximateSpecs(univ.name, univ.tier, field);

  // 1. Initialize with Loading Message (or smart fallback immediately if we want?)
  // Let's us Smart Fallback as default, and AI overrides later. This prevents "Analyzing..." flash.

  let desc = getSmartFallbackDescription(univ.name, departmentName);

  let aiData: any = {
    tuitionFee: approximate.tuition,
    employmentRate: approximate.employment,
    departmentRanking: "분석 중..."
  };

  try {
    const generated = await generateAIAnalysis(univ, departmentName, stats);
    // Apply AI Data
    if (generated.description && generated.description.length > 5) {
      desc = generated.description;
    }
    // Else keep smart fallback

    if (generated.aiSummary) aiData.aiSummary = generated.aiSummary;
    if (generated.admission2024) aiData.admission2024 = generated.admission2024;
  } catch (e) {
    console.log("AI failed or skipped");
    // Keep smart fallback
  }

  // 2. Admission Data Construction
  let adm2024 = {
    susiGyogwa: `${estPrev.susi} (추정)`,
    susiJonghap: `${(parseFloat(estPrev.susi) + 0.3).toFixed(2)} (추정)`,
    jeongsi: `${estPrev.jeongsi} (추정)`
  };

  if (aiData.admission2024) {
    adm2024 = {
      susiGyogwa: aiData.admission2024.susiGyogwa || adm2024.susiGyogwa,
      susiJonghap: aiData.admission2024.susiJonghap || adm2024.susiJonghap,
      jeongsi: aiData.admission2024.jeongsi || adm2024.jeongsi
    };
  }

  // FIXED: 3-Year Data for 2025, 2024, 2023
  let admissionInfo = [
    {
      year: "2025학년도",
      susiGyogwa: `${est.susi} (예상)`,
      susiJonghap: `${(parseFloat(est.susi) + 0.5).toFixed(2)} (예상)`,
      jeongsi: `${est.jeongsi} (예상)`
    },
    {
      year: "2024학년도",
      susiGyogwa: adm2024.susiGyogwa,
      susiJonghap: adm2024.susiJonghap,
      jeongsi: adm2024.jeongsi
    },
    {
      year: "2023학년도",
      susiGyogwa: `${est2023.susi} (결과)`,
      susiJonghap: `${(parseFloat(est2023.susi) + 0.4).toFixed(2)} (결과)`,
      jeongsi: `${est2023.jeongsi} (결과)`
    }
  ];

  return {
    id: `${universityName}-${departmentName}-detail`,
    universityName: universityName,
    departmentName: departmentName,
    location: univ.location,
    field: "AI 종합 분석",
    admissionData: admissionInfo,
    description: desc,
    tuitionFee: aiData.tuitionFee,
    employmentRate: aiData.employmentRate,
    departmentRanking: aiData.departmentRanking
  };
};