import React from 'react';
import { MonthlyRecord, UserRole } from '../types';
import { 
  CalendarDays, 
  ChevronDown, 
  Lock, 
  Unlock, 
  History, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface MonthBarProps {
  currentMonth: MonthlyRecord;
  availableMonths: MonthlyRecord[];
  onSelectMonth: (monthId: string) => void;
  onOpenArchiveModal: () => void;
  onArchiveAndNextMonth: () => void;
  currentRole: UserRole;
  soundEnabled: boolean;
  latestActiveMonthId: string;
}

export const MonthBar: React.FC<MonthBarProps> = ({
  currentMonth,
  availableMonths,
  onSelectMonth,
  onOpenArchiveModal,
  onArchiveAndNextMonth,
  currentRole,
  soundEnabled,
  latestActiveMonthId
}) => {
  const isViewingPastMonth = currentMonth.id !== latestActiveMonthId;
  const isGvcn = currentRole === 'gvcn';

  return (
    <div className="space-y-2 mb-4">
      {/* Alert banner if viewing an archived / past month */}
      {isViewingPastMonth && (
        <div 
          id="past-month-alert-banner"
          className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-3 sm:px-4 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs sm:text-sm animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn đang xem dữ liệu lưu trữ <b>{currentMonth.name}</b> {currentMonth.isArchived ? '(Đã chốt sổ)' : ''}. Bảng điểm và xếp loại phản ánh kết quả của tháng này.
            </span>
          </div>
          <button
            id="return-latest-month-btn"
            onClick={() => {
              playClick(soundEnabled);
              onSelectMonth(latestActiveMonthId);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
          >
            <span>Về tháng hiện tại</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Month Navigation Bar */}
      <div 
        id="month-control-bar"
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
      >
        {/* Left: Current Month Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Dữ liệu thi đua theo tháng:
              </span>
              {currentMonth.isArchived ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-2.5 h-2.5" /> Đã chốt sổ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Unlock className="w-2.5 h-2.5" /> Đang theo dõi
                </span>
              )}
            </div>

            {/* Selector dropdown */}
            <div className="relative inline-block mt-0.5">
              <select
                id="month-selector-dropdown"
                value={currentMonth.id}
                onChange={(e) => {
                  playClick(soundEnabled);
                  onSelectMonth(e.target.value);
                }}
                className="appearance-none bg-transparent pr-8 py-0.5 font-black text-sm sm:text-base text-slate-800 cursor-pointer focus:outline-none focus:ring-0 hover:text-indigo-600 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.theme ? `• ${m.theme}` : ''} {m.isArchived ? '🔒' : '🟢'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          {/* Open Monthly Archive Manager Modal */}
          <button
            id="open-monthly-archive-btn"
            onClick={() => {
              playClick(soundEnabled);
              onOpenArchiveModal();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Xem danh sách các tháng & báo cáo tổng kết"
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Kho Lưu Trữ Tháng</span>
          </button>

          {/* GVCN Month Action: Lock & Start New Month */}
          {isGvcn && (
            <button
              id="archive-and-next-month-btn"
              onClick={() => {
                playClick(soundEnabled);
                onArchiveAndNextMonth();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Lưu dữ liệu tháng này và chuyển sang tháng mới"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chốt Tháng & Bắt Đầu Mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
