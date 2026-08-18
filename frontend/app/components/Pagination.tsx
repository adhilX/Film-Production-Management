"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  itemName = 'results',
}) => {
  if (pages <= 0) return null;

  const startRange = Math.min(total, (page - 1) * limit + 1);
  const endRange = Math.min(total, page * limit);

  // Generate page numbers with ellipsis (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const range = [];
    const delta = 1; // show 1 page before and after current
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  };

  return (
    <div className="p-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-white">
      {/* Left Info Panel */}
      <div className="text-slate-450 font-semibold text-xs text-center md:text-left">
        Showing {startRange} to {endRange} of {total} {itemName}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-1">
        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>

        {/* Page Buttons & Ellipsis */}
        {getPageNumbers().map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-slate-400 select-none"
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(Number(pageNum))}
              className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                page === pageNum
                  ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                  : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="p-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Optional Page Size selector */}
      <div className="flex items-center justify-center md:justify-end gap-2 text-slate-450 font-semibold text-xs">
        {onLimitChange ? (
          <>
            <span>Rows per page</span>
            <div className="relative">
              <select
                value={limit}
                onChange={e => {
                  onLimitChange(Number(e.target.value));
                }}
                className="bg-white border border-slate-200 rounded-xl py-1 pl-3 pr-8 focus:outline-none focus:border-purple-500 cursor-pointer text-slate-700 font-bold text-xs appearance-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </>
        ) : (
          /* Empty spacer to align center elements when there's no limit selector */
          <div className="hidden md:block w-32" />
        )}
      </div>
    </div>
  );
};

export default Pagination;
