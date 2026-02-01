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
              <span className="text-gray-600 font-medium text-lg">
                {details.field}계열
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                AI 종합 분석
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
            {/* AI Analysis Section Removed */}

            {/* Admission Results Section */}
            <section className="animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900">AI 분석 입시결과(3개년 추이)</h3>
                <span className="text-xs text-red-500 font-medium ml-2">* 최종 50%컷 반영</span>
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


          </>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <a
            href="https://www.adiga.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-center shadow-lg shadow-emerald-200"
          >
            대학어디가 바로가기
          </a>
          <a
            href={`https://search.naver.com/search.naver?query=${details.universityName} 입학처`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            대학 입시홈페이지
          </a>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;