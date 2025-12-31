import React from 'react';
import { UniversityDepartment } from '../types';

interface Props {
  data: UniversityDepartment;
  rank: number;
  onClick?: () => void;
}

const DepartmentCard: React.FC<Props> = ({ data, rank, onClick }) => {

  const getBadgeStyle = (field: string) => {
    const f = field;
    if (f.includes('의과') || f.includes('의약') || f.includes('간호') || f.includes('약학') || f.includes('치과') || f.includes('한의')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (f.includes('공학') || f.includes('공과') || f.includes('소프트웨어') || f.includes('정보') || f.includes('IT')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (f.includes('자연') || f.includes('이과') || f.includes('과학') || f.includes('생명')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (f.includes('인문') || f.includes('어문') || f.includes('문과')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (f.includes('사회') || f.includes('경영') || f.includes('경제') || f.includes('정경') || f.includes('상경') || f.includes('법학')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (f.includes('사범') || f.includes('교육')) return 'bg-lime-50 text-lime-700 border-lime-200';
    if (f.includes('예술') || f.includes('예체능') || f.includes('미술') || f.includes('체육') || f.includes('음악') || f.includes('디자인') || f.includes('조형')) return 'bg-violet-50 text-violet-700 border-violet-200';

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 p-4 sm:p-5 cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-emerald-500 transition-colors"></div>

      {/* Rank & Basic Info */}
      <div className="flex items-center gap-4 flex-1">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${rank <= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getBadgeStyle(data.field)}`}>
              {data.field}
            </span>
            <span className="text-xs text-slate-400 flex items-center">
              {data.location}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
              {data.universityName}
            </h3>
            <h2 className="text-sm font-bold text-slate-500 truncate mb-0.5">
              {data.departmentName}
            </h2>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center justify-between sm:justify-end sm:w-auto border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-1 sm:mt-0">
        <div className="sm:hidden text-xs text-slate-400 font-medium">터치하여 상세정보 보기</div>
        <button className="bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ml-auto">
          상세정보
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-1">
            <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DepartmentCard;