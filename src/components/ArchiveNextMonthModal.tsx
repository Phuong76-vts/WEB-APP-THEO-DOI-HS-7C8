import React, { useState } from 'react';
import { MonthlyRecord, Student, ClassSettings } from '../types';
import { 
  X, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  Trophy, 
  CheckCircle2, 
  RotateCcw, 
  Calendar 
} from 'lucide-react';
import { playClick, playFanfare } from '../utils/audio';

interface ArchiveNextMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: MonthlyRecord;
  availableMonths: MonthlyRecord[];
  students: Student[];
  settings: ClassSettings;
  onConfirmArchiveAndNext: (nextMonthId: string, resetPointsMode: 'reset_10' | 'reset_0' | 'keep') => void;
  soundEnabled: boolean;
}

export const ArchiveNextMonthModal: React.FC<ArchiveNextMonthModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  availableMonths,
  students,
  settings,
  onConfirmArchiveAndNext,
  soundEnabled
}) => {
  if (!isOpen) return null;

  // Find likely next month
  const currentIndex = availableMonths.findIndex(m => m.id === currentMonth.id);
  const defaultNextMonth = currentIndex >= 0 && currentIndex < availableMonths.length - 1
    ? availableMonths[currentIndex + 1]
    : null;

  const [selectedNextMonthId, setSelectedNextMonthId] = useState<string>(
    defaultNextMonth ? defaultNextMonth.id : 'custom'
  );
  const [resetPointsMode, setResetPointsMode] = useState<'reset_10' | 'reset_0' | 'keep'>('reset_10');

  // Top student of current month
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);
  const champion = sortedStudents[0];

  const handleConfirm = () => {
    playFanfare(soundEnabled);
    onConfirmArchiveAndNext(selectedNextMonthId, resetPointsMode);
  };

  return (
    <div 
      id="archive-next-month-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        id="archive-next-month-card"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white p-6 relative">
          <button
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg font-black text-2xl">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-0.5 border border-amber-400/30">
                <Lock className="w-3 h-3" /> TỔNG KẾT & CHUYỂN GIAO THI ĐUA
              </div>
              <h3 className="text-xl font-black font-['Nunito',sans-serif]">
                Chốt {currentMonth.name} & Bắt Đầu Mới
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Tháng chốt kết quả:</span>
              <span className="font-black text-indigo-700 text-sm">{currentMonth.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Thủ khoa {currentMonth.name}:</span>
              <span className="font-black text-amber-600 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {champion ? `${champion.name} (${champion.points}đ)` : '---'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
              ✓ Toàn bộ dữ liệu điểm số và nhật ký của {currentMonth.name} sẽ được lưu trữ vĩnh viễn trong máy. Bạn có thể xem lại hoặc xuất báo cáo bất cứ lúc nào.
            </div>
          </div>

          {/* Select Next Month */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Chọn tháng tiếp theo để bắt đầu thi đua:
            </label>
            <select
              value={selectedNextMonthId}
              onChange={(e) => setSelectedNextMonthId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableMonths
                .filter(m => m.id !== currentMonth.id)
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.theme ? `(${m.theme})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Reset points policy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              Quy chế điểm số khi bước vào tháng mới:
            </label>
            <div className="space-y-2">
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  resetPointsMode === 'reset_10' 
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="resetPolicy"
                  checked={resetPointsMode === 'reset_10'}
                  onChange={() => setResetPointsMode('reset_10')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-black text-slate-800">
                    Khởi đầu 10 điểm cơ bản (Khuyên dùng)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mỗi học sinh bắt đầu tháng mới với 10 điểm nề nếp ban đầu để cộng/trừ trong tháng.
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  resetPointsMode === 'reset_0' 
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="resetPolicy"
                  checked={resetPointsMode === 'reset_0'}
                  onChange={() => setResetPointsMode('reset_0')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-black text-slate-800">
                    Khởi đầu từ 0 điểm
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tất cả học sinh bắt đầu từ 0 điểm và tích lũy dần theo từng tiết học.
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  resetPointsMode === 'keep' 
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="resetPolicy"
                  checked={resetPointsMode === 'keep'}
                  onChange={() => setResetPointsMode('keep')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-black text-slate-800">
                    Giữ nguyên điểm hiện tại (Tích lũy liên tục)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Kế thừa điểm số tích lũy tháng trước tiếp tục sang tháng mới.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                playClick(soundEnabled);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              id="confirm-archive-and-start-next-btn"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Xác Nhận & Sang Tháng Mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
