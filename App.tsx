import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SearchInput from './components/SearchInput';
import DepartmentModal from './components/DepartmentModal';
import DepartmentCard from './components/DepartmentCard';
import { UniversityDepartment, LoadingStatus } from './types';
import { searchDepartments } from './services/geminiService';

const ITEMS_PER_PAGE = 10; // 리스트 형태이므로 페이지당 10개 표시

const App: React.FC = () => {
  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [results, setResults] = useState<UniversityDepartment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<UniversityDepartment | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Helper to determine if we are in the initial IDLE state
  const isIdle = status === LoadingStatus.IDLE;

  const handleSearch = useCallback(async (query: string) => {
    setStatus(LoadingStatus.LOADING);
    setResults([]);
    setTotalCount(0);
    setErrorMsg('');
    setSelectedDept(null);
    setCurrentPage(1);

    try {
      const response = await searchDepartments(query);

      // Use the order provided by the API (which is now sorted by ranking) directly.
      setResults(response.departments);
      setTotalCount(response.estimatedTotalCount);
      setStatus(LoadingStatus.SUCCESS);

      if (response.departments.length === 0) {
        setErrorMsg("검색 결과가 없습니다. 다른 검색어로 시도해보세요.");
        setStatus(LoadingStatus.ERROR);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      setStatus(LoadingStatus.ERROR);
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus(LoadingStatus.IDLE);
    setResults([]);
    setTotalCount(0);
    setErrorMsg('');
    setSelectedDept(null);
    setCurrentPage(1);
  }, []);

  // Update specific department data (Caching mechanism)
  const handleUpdateDepartment = useCallback((updatedData: UniversityDepartment) => {
    setResults(prevResults =>
      prevResults.map(dept =>
        dept.id === updatedData.id ? { ...dept, ...updatedData } : dept
      )
    );
    setSelectedDept(prev => (prev?.id === updatedData.id ? updatedData : prev));
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return results.slice(start, start + ITEMS_PER_PAGE);
  }, [results, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-800 transition-colors duration-500 ${isIdle ? 'bg-emerald-900' : 'bg-[#F8FAFC]'}`}>
      <Header />

      <main className="flex-grow">
        <SearchInput
          onSearch={handleSearch}
          onReset={handleReset}
          isLoading={status === LoadingStatus.LOADING}
          isIdle={isIdle}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Status: Loading */}
          {status === LoadingStatus.LOADING && (
            <div className="flex flex-col items-center justify-center py-32 animate-[fadeIn_0.3s_ease-out]">
              <div className="relative mb-6">
                <div className="w-14 h-14 rounded-full border-4 border-slate-200"></div>
                <div className="absolute top-0 left-0 w-14 h-14 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">데이터 분석 중...</h3>
              <p className="text-slate-400 text-sm">입시결과 및 인지도 순으로 정렬하고 있습니다</p>
            </div>
          )}

          {/* Status: Error or Empty */}
          {status === LoadingStatus.ERROR && (
            <div className="text-center py-16">
              <div className="bg-white border border-red-100 shadow-sm text-red-600 px-6 py-4 rounded-2xl inline-flex items-center gap-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Status: Success */}
          {status === LoadingStatus.SUCCESS && results.length > 0 && (
            <div className="animate-[fadeIn_0.5s_ease-out]">

              {/* Stats Header */}
              <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
                  검색 결과 <span className="text-emerald-600 ml-1">{results.length}</span>건
                  {totalCount > results.length && (
                    <span className="text-slate-400 text-sm font-normal ml-1">
                      (전체 약 {totalCount}건 중 상위 {results.length}건)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  * 입결 및 선호도 기준 AI 정렬
                </p>
              </div>

              {/* Department List (Changed from Grid to Flex Col) */}
              <div className="flex flex-col gap-3">
                {currentItems.map((dept, index) => (
                  <DepartmentCard
                    key={dept.id}
                    data={dept}
                    rank={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    onClick={() => setSelectedDept(dept)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  <div className="flex gap-1.5 bg-white px-2 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-full text-sm font-bold transition-all duration-200 ${currentPage === page
                            ? 'bg-emerald-600 text-white shadow-md scale-105'
                            : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status: Idle (Initial State) */}
          {isIdle && (
            <div className="text-center py-24 animate-[fadeIn_0.5s_ease-out]">
              <div className="w-24 h-24 bg-emerald-800/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-emerald-700/50 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor" className="w-10 h-10 text-emerald-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.534 50.534 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white mb-2 tracking-tight">대학명, 학과명, 혹은 계열로 검색해보세요.</p>
              <p className="text-emerald-200/80 font-medium">전국 4년제 대학의 학과 정보와 최근 입시결과를 확인하세요.</p>
            </div>
          )}
        </div>
      </main>

      <footer className={`border-t py-10 mt-auto transition-colors duration-500 ${isIdle ? 'bg-transparent border-emerald-800 text-emerald-300' : 'bg-white border-slate-100 text-slate-500'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className={`text-sm font-bold mb-1 ${isIdle ? 'text-emerald-200' : 'text-slate-500'}`}>
            © 2024 대학학과 검색 powered by Gemini
          </p>
          <p className={`text-xs leading-relaxed max-w-2xl mx-auto ${isIdle ? 'text-emerald-400' : 'text-slate-400'}`}>
            본 서비스에서 제공하는 입시 결과 데이터는 AI에 의해 추정된 자료이며, 실제 입시 결과와 다를 수 있습니다.
            정확한 정보는 반드시 각 대학 입학처 및 '대학어디가' 공식 사이트를 확인하시기 바랍니다.
          </p>
        </div>
      </footer>

      {/* Modal Integration */}
      {selectedDept && (
        <DepartmentModal
          data={selectedDept}
          onClose={() => setSelectedDept(null)}
          onUpdateData={handleUpdateDepartment}
        />
      )}
    </div>
  );
};

export default App;