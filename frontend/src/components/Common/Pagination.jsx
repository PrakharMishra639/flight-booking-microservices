import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// PAGINATION
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`w-10 h-10 rounded-xl font-black text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              currentPage === i 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105' 
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-100 hover:border-slate-200'
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      // Logic for displaying ellipses
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === 1 ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
        >
          1
        </button>
      );

      if (currentPage > 3) {
        pages.push(<div key="dots1" className="w-10 h-10 flex items-center justify-center text-slate-300"><MoreHorizontal className="h-4 w-4" /></div>);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === i ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<div key="dots2" className="w-10 h-10 flex items-center justify-center text-slate-300"><MoreHorizontal className="h-4 w-4" /></div>);
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === totalPages ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
        >
          {totalPages}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white border-t border-slate-100 rounded-b-[2.5rem]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
        Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
      </p>
      
      <div className="flex items-center gap-2 mx-auto md:mx-0">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-slate-100 placeholder-opacity-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
