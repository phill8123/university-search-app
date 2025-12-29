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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    setIsLoading(true);

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
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    // 이미 입시 데이터가 있다면 다시 부르지 않음
    if (initialData.admissionData && initialData.admissionData.length > 0) {
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
    if (f.includes('의과') || f.includes('간호') || f.includes('약학') || f.includes('치과') || f.includes('한의')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (f.includes('공학') || f.includes('공과') || f.includes('소프트웨어') || f.includes('정보') || f.includes('IT')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (f.includes('자연') || f.includes('이과') || f.includes('과학') || f.includes('생명')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (f.includes('인문') || f.includes('어문') || f.includes('문과')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (f.includes('사회') || f.includes('경영') || f.includes('경제') || f.includes('정경') || f.includes('상경') || f.includes('법학')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (f.includes('사범') || f.includes('교육')) return 'bg-green-50 text-green-700 border-green-200';
    if (f.includes('예술') || f.includes('미술') || f.includes('체육') || f.includes('음악') || f.includes('디자인') || f.includes('조형')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[95%] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col animate-[fadeIn_0.2s_ease-out]">

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <div className="text-slate-500 text-xs sm:text-sm font-bold mb-1">{details.universityName}</div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{details.departmentName}</span>
              <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded ${getBadgeStyle(details.field)}`}>
                {details.field}
              </span>
            </div>
            <div className="flex items-center text-xs sm:text-sm font-medium text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {details.location}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors -mr-2 sm:mr-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-8 sm:space-y-10 min-h-[400px]">
          {isLoading ? (
            <div className="animate-pulse space-y-8">
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="relative mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[5px] border-slate-200"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[5px] border-emerald-500 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 animate-pulse">2025학년도 입시정보 분석 중...</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-2 font-medium bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  AI가 최신 입시 결과와 대학 데이터를 분석하고 있습니다 (최대 60초)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 h-20 sm:h-24 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <div className="h-3 w-16 bg-slate-100 rounded-full"></div>
                    <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Department Info Section */}
              <section className="animate-[fadeIn_0.5s_ease-out]">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-1.5 h-5 sm:h-6 bg-emerald-600 rounded-full mr-2.5"></span>
                  학과정보
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center flex flex-row sm:flex-col items-center sm:justify-center justify-between">
                    <div className="text-slate-500 text-xs sm:mb-1">연간 등록금</div>
                    <div className="text-slate-800 font-bold text-sm sm:text-base">{details.tuitionFee || "-"}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center flex flex-row sm:flex-col items-center sm:justify-center justify-between">
                    <div className="text-slate-500 text-xs sm:mb-1">취업률</div>
                    <div className="text-slate-800 font-bold text-sm sm:text-base">{details.employmentRate || "-"}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center flex flex-row sm:flex-col items-center sm:justify-center justify-between">
                    <div className="text-slate-500 text-xs sm:mb-1">학과 위상</div>
                    <div className="text-emerald-700 font-bold text-xs leading-snug break-keep flex items-center justify-center sm:h-full sm:min-h-[1.25rem]">
                      {details.departmentRanking || "-"}
                    </div>
                  </div>
                </div>
              </section>


              {/* AI Analysis Description Section */}
              <section className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 mb-6">
                <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                    <path d="M16.5 7.5h-9v9h9v-9z" />
                    <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v15a3 3 0 01-3 3H6a3 3 0 01-3-3v-15a3 3 0 013-3h.75V3A.75.75 0 018.25 2.25zM6 7.5a1.5 1.5 0 00-1.5 1.5v11.25c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5V9a1.5 1.5 0 00-1.5-1.5H6z" clipRule="evenodd" />
                  </svg>
                  AI 종합 분석
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {details.description}
                </p>
              </section>

              {/* Admission Results Section */}
              <section className="animate-[fadeIn_0.5s_ease-out]">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-1.5 h-5 sm:h-6 bg-emerald-600 rounded-full mr-2.5"></span>
                  입시결과 (2025-2024)
                </h3>
                {details.admissionData && details.admissionData.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-slate-700 bg-slate-100 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-bold">학년도</th>
                            <th className="px-4 py-3 font-bold text-center">수시(교과)</th>
                            <th className="px-4 py-3 font-bold text-center">수시(종합)</th>
                            <th className="px-4 py-3 font-bold text-center">정시(백분위)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {details.admissionData.map((stat, idx) => (
                            <tr key={stat.year || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">{stat.year}</td>
                              <td className="px-4 py-3 text-center text-slate-600">{stat.susiGyogwa}</td>
                              <td className="px-4 py-3 text-center text-slate-600">{stat.susiJonghap}</td>
                              <td className="px-4 py-3 text-center text-emerald-700 font-bold">{stat.jeongsi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                    <p>AI가 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
                    <button
                      onClick={fetchDetails}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                    >
                      다시 시도하기
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2 text-right break-keep">
                  * 본 결과는 AI가 웹 검색을 통해 수집·추정한 값으로 실제와 다를 수 있습니다. 정확한 정보는 입학처를 확인하세요.
                </p>
              </section>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <a
            href="https://www.adiga.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-sm"
          >
            대학어디가 바로가기
          </a>
          <a
            href={`https://search.naver.com/search.naver?query=${encodeURIComponent(details.universityName + " " + details.departmentName + " 입시결과")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex justify-center items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-sm"
          >
            네이버 검색 확인
          </a>
        </div>

      </div>
    </div>
  );
};

export default DepartmentModal;