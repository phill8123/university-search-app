/// <reference types="vite/client" />
import { SearchResponse, UniversityDepartment } from "../types";
import { universitiesDB, realAdmissions, getEstimatedGrade, getApproximateSpecs, UniversityStructure } from "./universityData";
import { getBaseTierScore, MAJOR_HOSPITALS, MAJOR_PHARMACY } from './rankingUtils';

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

  // Filter out Graduate Schools at University level
  if (univ.name.includes("대학원")) return [];

  const realData = realAdmissions.filter(r => r.universityName === univ.name);
  results.push(...realData);

  for (const [collegeName, deptList] of Object.entries(univ.colleges)) {
    // Filter out Graduate Schools at College level
    if (collegeName.includes("대학원")) continue;

    for (const deptName of deptList) {
      // Filter out Graduate Schools at Department level
      if (deptName.includes("대학원")) continue;

      // Filter out '전공' (Majors)
      if (deptName.includes("전공")) continue;

      if (results.some(r => r.departmentName === deptName)) continue;

      // Double check cleaning in case DB wasn't updated perfectly
      // Also remove parentheses with years/numbers/systems like (2+4년제), (6년제), (2+4학제)
      let cleanDeptName = deptName.replace(/\?/g, ' ').replace(/\s+/g, ' ').trim();
      cleanDeptName = cleanDeptName.replace(/\([0-9+\s]*(년|학)(제)?\)/g, "").trim();



      let field = "기타";

      // 0. Priority: CSV Data (Large - Middle)
      if (univ.deptCategories && univ.deptCategories[deptName]) {
        field = univ.deptCategories[deptName];
      }

      // Fallback or Refinement if 'field' is still generic or 'Other'
      // Only apply heuristics if we didn't get a good field from CSV or if it's "기타"
      const isGeneric = field === "기타" || field.trim() === "";

      // Force Overrides for Specific Medical Fields (Must run after generic assignment)
      if (deptName.includes("한의")) field = "한의학";
      else if (deptName.includes("수의")) field = "수의학";
      else if (deptName.includes("치의")) field = "치의학";
      else if (deptName.includes("약학") || deptName.includes("약학과")) field = "약학";
      else if (deptName.includes("간호")) field = "간호학";
      else if (deptName.includes("의예") || deptName.includes("의학")) field = "의학";
      // End Force Overrides

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

        // 3. Other Strong Overrides
        if (deptName.includes("물리치료") || deptName.includes("임상병리") || deptName.includes("치위생")) field = "보건";
        else if (deptName.includes("컴퓨터") || deptName.includes("소프트웨어") || deptName.includes("전기") || deptName.includes("전자") || deptName.includes("기계") || deptName.includes("건축") || deptName.includes("토목")) {
          field = "공학";
        } else if (deptName.includes("경영") || deptName.includes("경제") || deptName.includes("행정")) {
          field = "사회";
        } else if (deptName.includes("디자인") || deptName.includes("체육") || deptName.includes("음악") || deptName.includes("미술")) {
          field = "예체능";
        }
      }

      results.push({
        id: `${univ.name}-${cleanDeptName}`,
        universityName: univ.name,
        departmentName: cleanDeptName,

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

// Helper to calculate a deterministic ranking score based on Admission Difficulty
const calculateRankingScore = (univ: UniversityStructure, deptName: string, query?: string): number => {
  const d = deptName;
  let score = 0;

  // 1. Base University Tier Score (User Preference / Reputation)
  const tierScore = getBaseTierScore(univ.name); // 50 ~ 100
  score += tierScore;

  // 2. Department Category Logic (Bonus Base)
  // Medical Fields get a massive base boost so they sort comfortably among themselves
  // but if we are filtering anyway, the relative ranking matters most.

  const isMedical = d.includes("의예") || d.includes("의학");
  const isDent = d.includes("치의") || d.includes("치과");
  const isKorean = d.includes("한의");
  const isVet = d.includes("수의");
  const isPharm = (d.includes("약학") || d.includes("약과")) && !d.includes("제약");


  // Relative Hierarchy Bonuses (Internal sorting for mixed views)
  if (isMedical) score += 300;
  else if (isDent) score += 290;
  else if (isKorean) score += 280;
  else if (isVet) score += 270;
  else if (isPharm) score += 260;
  else if (d.includes("간호")) score += 50;
  else if (d.includes("컴퓨터") || d.includes("소프트웨어") || d.includes("반도체")) score += 20;

  // 3. Field Specific Bonuses
  // Medical / Nursing (Big 5 Hospitals)
  if (isMedical || d.includes("간호")) {
    if (MAJOR_HOSPITALS.some(h => univ.name.includes(h))) {
      score += 20; // Big boost for Big 5
    }
  }

  // Pharmacy (Traditional Strongholds)
  if (isPharm) {
    if (MAJOR_PHARMACY.some(h => univ.name.includes(h))) {
      score += 15; // Boost for traditional pharmacy schools
    }
  }

  // 4. In-Seoul Bonus
  if (univ.location.includes("서울")) score += 5;

  // 5. Estimated Admission Data (Jeongsi Cutline)
  // This is the most accurate metric if valid.
  const est = getEstimatedGrade(univ.tier, deptName, 2025);
  let jeongsiScore = parseFloat(est.jeongsi);

  if (!isNaN(jeongsiScore)) {
    // Mapping: 100 -> ~100 pts. 80 -> ~0 pts.
    // Boost highly for score > 90
    if (jeongsiScore > 90) {
      score += (jeongsiScore - 90) * 3;
    }
  }

  // 6. Penalty for Substring mismatches (Crucial for Strict Separation logic fallback)
  if (query) {
    const q = query.replaceAll(" ", "").trim();

    // Define query types
    const qVet = q.includes("수의");
    const qKorean = q.includes("한의");
    const qDent = q.includes("치의") || q.includes("치과");
    const qPharmEng = q.includes("제약");
    const qPharm = (q.includes("약학") || q.includes("약대")) && !qPharmEng;
    const qMed = (q.includes("의예") || q.includes("의학")) && !qVet && !qKorean && !qDent && !qPharm && !qPharmEng;

    // Apply Penalties (Mutual Exclusion)
    if (qMed) {
      if (d.includes("수의") || d.includes("한의") || d.includes("치의") || d.includes("약학") || d.includes("제약")) score -= 1000;
    } else if (qVet) {
      if (!d.includes("수의")) score -= 1000;
    } else if (qKorean) {
      if (!d.includes("한의")) score -= 1000;
    } else if (qDent) {
      if (!d.includes("치의") && !d.includes("치과")) score -= 1000;
    } else if (qPharm) {
      if (!d.includes("약학") && !d.includes("약과")) score -= 1000;
      if (d.includes("제약")) score -= 1000;
    } else if (qPharmEng) {
      if (!d.includes("제약")) score -= 1000;
    }
  }

  // 7. Small jitter for stability
  let hash = 0;
  const str = univ.name + deptName;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return score + (Math.abs(hash) % 100 / 1000);
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
  const seenIds = new Set<string>();

  const matchedUnivs = universitiesDB.filter(u => u.name.includes(query) || query.includes(u.name) || (normalizedQuery.length > 1 && u.name.includes(normalizedQuery)));

  // Strategy 1: Matched Universities
  if (matchedUnivs.length > 0) {
    for (const univ of matchedUnivs) {
      const depts = flattenDepartments(univ);
      for (const d of depts) {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          globalResults.push(d);
        }
      }
    }
  }

  // Strategy 2: Global Department Search
  if (query.length >= 2) {
    for (const univ of universitiesDB) {
      if (matchedUnivs.includes(univ)) continue;

      const depts = flattenDepartments(univ);
      const matches = depts.filter(d =>
        d.departmentName.includes(query) ||
        query.includes(d.departmentName) ||
        d.field.includes(query)
      );

      for (const d of matches) {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          globalResults.push(d);
        }
      }
    }
  }

  // STRICT FILTERING: Enforce Mutual Exclusion for Medical/Pharm Fields
  const qStr = query.replaceAll(" ", "").trim();
  const isVetQuery = qStr.includes("수의");
  const isKoreanQuery = qStr.includes("한의");
  const isDentQuery = qStr.includes("치의") || qStr.includes("치과");

  // Pharmacy vs Pharmaceutical
  // "제약" implies Pharmaceutical. "약학" or "약대" implies Pharmacy (unless it contains "제약").
  const isPharmEngQuery = qStr.includes("제약");
  const isPharmQuery = (qStr.includes("약학") || qStr.includes("약대")) && !isPharmEngQuery;

  // Medicine
  // Exclude: Vet, Korean, Dent, Pharm, PharmEng
  const isMedQuery = (qStr.includes("의예") || qStr.includes("의학")) && !isVetQuery && !isKoreanQuery && !isDentQuery && !isPharmQuery && !isPharmEngQuery;

  if (isMedQuery) {
    // Explicitly exclude Vet, Korean, Dent, Pharm, PharmEng (and "제약" just in case)
    globalResults = globalResults.filter(d =>
      !d.departmentName.includes("수의") &&
      !d.departmentName.includes("한의") &&
      !d.departmentName.includes("치의") &&
      !d.departmentName.includes("약학") &&
      !d.departmentName.includes("제약")
    );
  } else if (isVetQuery) {
    globalResults = globalResults.filter(d => d.departmentName.includes("수의"));
  } else if (isKoreanQuery) {
    globalResults = globalResults.filter(d => d.departmentName.includes("한의"));
  } else if (isDentQuery) {
    globalResults = globalResults.filter(d => d.departmentName.includes("치의") || d.departmentName.includes("치과"));
  } else if (isPharmQuery) {
    // Pharmacy: Match "약학" matches, but EXCLUDE "제약"
    globalResults = globalResults.filter(d =>
      (d.departmentName.includes("약학") || d.departmentName.includes("약과")) &&
      !d.departmentName.includes("제약")
    );
  } else if (isPharmEngQuery) {
    // Pharmaceutical: Must include "제약"
    globalResults = globalResults.filter(d => d.departmentName.includes("제약"));
  }

  globalResults.sort((a, b) => {
    const uA = universitiesDB.find(u => u.name === a.universityName);
    const uB = universitiesDB.find(u => u.name === b.universityName);
    if (!uA || !uB) return 0;

    // Sort logic: Higher Score First
    return calculateRankingScore(uB, b.departmentName, query) - calculateRankingScore(uA, a.departmentName, query);

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
    field: field,
    admissionData: admissionInfo,
    description: desc,
    tuitionFee: aiData.tuitionFee,
    employmentRate: aiData.employmentRate,
    departmentRanking: aiData.departmentRanking
  };
};