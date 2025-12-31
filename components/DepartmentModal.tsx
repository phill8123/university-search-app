import React, { useEffect, useState, useRef } from 'react';
import { UniversityDepartment } from '../types';
import { getDepartmentDetails } from '../services/geminiService';

interface Props {
  data: UniversityDepartment;
  onClose: () => void;
  onUpdateData: (data: UniversityDepartment) => void;
}

const DepartmentModal: React.FC<Props> = ({ data: initialData, onClose, onUpdateData }) => {
  const [details, setDetails] = useState<UniversityDepartment>(initialData);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    document.body.style.overflow = 'hidden';
    return () => {
      isMounted.current = false;
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchDetails = async () => {
    try {
      const fullData = await getDepartmentDetails(initialData.universityName, initialData.departmentName);

      if (!isMounted.current) return;

      // 기존 데이터와 합치기
      const mergedData = {
        ...initialData,
        ...fullData,
        id: initialData.id
      };

      setDetails(mergedData);
      onUpdateData(mergedData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // 이미 입시 데이터가 있다면(그리고 3개년 데이터가 확인된다면) 다시 부르지 않음
    if (initialData.admissionData && initialData.admissionData.length >= 3) {
      setDetails(initialData);
      return;
    }
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData.id]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getBadgeStyle = (field: string) => {
    const f = field || "";
    if (f.includes("공학") || f.includes("IT")) return "bg-blue-100 text-blue-700";
    if (f.includes("의학")) return "bg-red-100 text-red-700";
    if (f.includes("인문") || f.includes("사회")) return "bg-yellow-100 text-yellow-700";
    if (f.includes("자연")) return "bg-green-100 text-green-700";
    if (f.includes("예체능")) return "bg-purple-100 text-purple-700";
    if (f.includes("교육")) return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto custom-scrollbar animate-[scaleIn_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-start">
          <div>
            <span className="text-sm font-medium text-gray-500 mb-1 block">{details.universityName}</span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{details.departmentName}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeStyle(details.field)}`}>
                {details.field}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <span className="flex items-center">📍 {details.location}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <>
            {/* AI Analysis Section (New) */}
            <section className="mb-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h3 className="text-xl font-bold text-gray-900">AI 학과 분석</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tuition */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2 text-xl">
                    💰
                  </div>
                  <span className="text-sm text-gray-500 font-medium mb-1">연간 평균 등록금</span>
                  <span className="text-lg font-bold text-gray-900">{details.tuitionFee || "-"}</span>
                </div>
                {/* Employment */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-xl">
                    📊
                  </div>
                  <span className="text-sm text-gray-500 font-medium mb-1">취업률</span>
                  <span className="text-lg font-bold text-gray-900">{details.employmentRate || "-"}</span>
                </div>
                {/* Ranking */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2 text-xl">
                    🏆
                  </div>
                  <span className="text-sm text-gray-500 font-medium mb-1">학과 위상</span>
                  <span className="text-lg font-bold text-gray-900">{details.departmentRanking || "-"}</span>
                </div>
              </div>
            </section>

            {/* Admission Results Section */}
            <section className="animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900">입시결과 (3개년 추이)</h3>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3 border-b">학년도</th>
                        <th className="px-4 py-3 border-b">수시(교과)</th>
                        <th className="px-4 py-3 border-b">수시(종합)</th>
                        <th className="px-4 py-3 border-b">정시(백분위)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.admissionData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.year}</td>
                          <td className="px-4 py-3 text-gray-600">{row.susiGyogwa}</td>
                          <td className="px-4 py-3 text-gray-600">{row.susiJonghap}</td>
                          <td className="px-4 py-3 font-medium text-emerald-600">{row.jeongsi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400 text-right">
                * 본 결과는 AI가 웹 검색을 통해 수집·추정한 값으로 실제와 다를 수 있습니다. 정확한 정보는 입학처를 확인하세요.
              </p>
            </section>

            {/* Department Overview Section (Text Summary) */}
            <section className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-100 mb-8 mt-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎓</span>
                <h3 className="text-lg font-bold text-gray-900">학과정보</h3>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {details.description}
              </div>
            </section>
          </>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <a
            href={`https://www.adiga.kr/PageLinkAll.do?link=/kcue/ast/eip/eis/inf/univinf/eipUnivInfGnrl.do&p_menu_id=PG-EIP-01701&univ_cd=${details.universityName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-center shadow-lg shadow-emerald-200"
          >
            대학어디가 바로가기
          </a>
          <a
            href={`https://search.naver.com/search.naver?query=${details.universityName} ${details.departmentName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            네이버 검색 확인
          </a>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;