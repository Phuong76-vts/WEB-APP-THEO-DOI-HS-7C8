import React, { useState } from 'react';
import { Student, GroupId } from '../types';
import { getRankTier } from '../utils/storage';
import { Plus, Minus, MoreVertical, Check, Sparkles, ArrowLeftRight } from 'lucide-react';
import { playClick } from '../utils/audio';

interface StudentCardProps {
  student: Student;
  onOpenScoreModal: (student: Student) => void;
  onQuickAddPoints: (student: Student, points: number, reason?: string) => void;
  onOpenEditModal: (student: Student) => void;
  soundEnabled: boolean;
  fastScoreMode?: boolean;
  batchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (student: Student) => void;
  onChangeGroup?: (studentId: string, newGroup: GroupId) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onOpenScoreModal,
  onQuickAddPoints,
  onOpenEditModal,
  soundEnabled,
  fastScoreMode = false,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
  onChangeGroup
}) => {
  const [floatingScore, setFloatingScore] = useState<number | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const tier = getRankTier(student.points);
  const avatarEmoji = student.gender === 'female' ? '👧' : '👦';

  const triggerFastPoint = (e: React.MouseEvent, pts: number, reason: string) => {
    e.stopPropagation();
    setFloatingScore(pts);
    onQuickAddPoints(student, pts, reason);
    setTimeout(() => {
      setFloatingScore(null);
    }, 900);
  };

  const handleCardClick = () => {
    if (batchMode && onToggleSelect) {
      playClick(soundEnabled);
      onToggleSelect(student);
    } else {
      onOpenScoreModal(student);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition transform relative flex flex-col justify-between border ${
        isSelected 
          ? 'border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/20' 
          : 'border-slate-200/80 hover:-translate-y-0.5'
      }`}
    >
      {/* FLOATING POINT ANIMATION BADGE */}
      {floatingScore !== null && (
        <div 
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full text-xs font-black shadow-lg animate-bounce pointer-events-none ${
            floatingScore > 0 
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' 
              : 'bg-rose-500 text-white ring-2 ring-rose-300'
          }`}
        >
          {floatingScore > 0 ? `+${floatingScore}đ 🎉` : `${floatingScore}đ ⚠️`}
        </div>
      )}

      {/* BATCH SELECT CHECKBOX (IF BATCH MODE) */}
      {batchMode && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect(student);
          }}
          className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition ${
            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      )}

      {/* QUICK ACTIONS IN TOP RIGHT (DEFAULT MODE) */}
      {!fastScoreMode && (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
          <button
            onClick={(e) => triggerFastPoint(e, 2, 'Phát biểu bài xây dựng tiết học')}
            title="Cộng nhanh +2 điểm phát biểu bài"
            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>2đ</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playClick(soundEnabled);
              onOpenEditModal(student);
            }}
            title="Chỉnh sửa thông tin & chức vụ học sinh"
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CLICKABLE BODY */}
      <div 
        className={`cursor-pointer ${batchMode ? 'pt-1' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {avatarEmoji}
          </div>

          <div className="min-w-0 flex-1 pr-10">
            <h3 className="font-bold text-slate-800 text-sm truncate hover:text-indigo-600 transition">
              {student.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {student.role && student.role !== 'Thành viên' ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                  {student.role}
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-medium truncate">
                  Thành viên
                </span>
              )}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick(soundEnabled);
                    setShowGroupPicker(!showGroupPicker);
                  }}
                  title="Bấm để đổi Tổ nhanh cho học sinh này"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                    showGroupPicker 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs' 
                      : student.group === '1'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : student.group === '2'
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      : student.group === '3'
                      ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>Tổ {student.group}</span>
                  <ArrowLeftRight className="w-2.5 h-2.5 opacity-70" />
                </button>

                {/* POPUP QUICK GROUP SWITCHER */}
                {showGroupPicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full left-0 mb-1 z-50 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-xl shadow-xl border border-white/20 min-w-44 animate-slide-up"
                  >
                    <div className="text-[10px] text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                      <span>Đổi sang tổ:</span>
                      <button 
                        type="button"
                        onClick={() => setShowGroupPicker(false)}
                        className="text-slate-400 hover:text-white px-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(['1', '2', '3', '4'] as GroupId[]).map((gid) => {
                        const isCurrent = student.group === gid;
                        return (
                          <button
                            key={gid}
                            type="button"
                            disabled={isCurrent}
                            onClick={() => {
                              playClick(soundEnabled);
                              if (onChangeGroup) onChangeGroup(student.id, gid);
                              setShowGroupPicker(false);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                              isCurrent
                                ? 'bg-white/20 text-slate-400 border-white/10 cursor-not-allowed opacity-60'
                                : gid === '1'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                                : gid === '2'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                                : gid === '3'
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                            }`}
                          >
                            <span>Tổ {gid}</span>
                            {isCurrent && <Check className="w-2.5 h-2.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tier.badgeBg} ${tier.badgeText} flex items-center gap-1`}>
            <span>{tier.icon}</span>
            <span>{tier.name}</span>
          </span>

          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400 font-medium">Điểm:</span>
            <span className={`font-black text-base ${student.points >= 25 ? 'text-amber-600' : 'text-indigo-600'}`}>
              {student.points}
            </span>
          </div>
        </div>
      </div>

      {/* FAST MOBILE SCORING BUTTONS (WHEN FAST MODE ACTIVE) */}
      {fastScoreMode && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/80 grid grid-cols-4 gap-1.5 z-10">
          <button
            onClick={(e) => triggerFastPoint(e, 2, 'Phát biểu bài xây dựng tiết học')}
            className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-90 text-white font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs transition"
            title="+2đ Phát biểu / Điểm tốt"
          >
            <span>+2đ</span>
            <span className="text-[9px] font-normal opacity-90">Phát biểu</span>
          </button>

          <button
            onClick={(e) => triggerFastPoint(e, 1, 'Làm bài tập / Việc tốt')}
            className="py-2 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-90 text-white font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs transition"
            title="+1đ Bài tập / Việc tốt"
          >
            <span>+1đ</span>
            <span className="text-[9px] font-normal opacity-90">Bài tập</span>
          </button>

          <button
            onClick={(e) => triggerFastPoint(e, -2, 'Mất trật tự / Thiếu bài tập')}
            className="py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-90 text-white font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs transition"
            title="-2đ Mất trật tự / Thiếu bài"
          >
            <span>-2đ</span>
            <span className="text-[9px] font-normal opacity-90">Quên bài</span>
          </button>

          <button
            onClick={(e) => triggerFastPoint(e, -1, 'Vi phạm đồng phục / Đi muộn')}
            className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-90 text-white font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs transition"
            title="-1đ Đồng phục / Đi muộn"
          >
            <span>-1đ</span>
            <span className="text-[9px] font-normal opacity-90">Nề nếp</span>
          </button>
        </div>
      )}
    </div>
  );
};
