import React, { useState } from 'react';
import { Student, REWARD_PRESETS, PENALTY_PRESETS, UserRole, ActiveOfficer, ClassSettings } from '../types';
import { X, PlusCircle, MinusCircle, Sparkles, AlertCircle, Crown, Star, Eye, Lock, ShieldAlert } from 'lucide-react';

interface ScoreModalProps {
  student: Student | null;
  onClose: () => void;
  onAddScore: (studentId: string, points: number, reason: string) => void;
  currentRole: UserRole;
  onOpenLogin: () => void;
  activeOfficer?: ActiveOfficer | null;
  settings?: ClassSettings;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  student,
  onClose,
  onAddScore,
  currentRole,
  onOpenLogin,
  activeOfficer,
  settings
}) => {
  const [customPoints, setCustomPoints] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  if (!student) return null;

  const isViewer = currentRole === 'viewer';
  const isBcs = currentRole === 'bcs';
  const isBcsBlocked = isBcs && settings?.allowBcsScoring === false;
  const isOutOfScope = isBcs && settings?.bcsScope === 'own_group' && !!activeOfficer?.group && student.group !== activeOfficer.group;

  const checkScorePermission = (): boolean => {
    if (isViewer) {
      alert('Chế độ trình chiếu không được ghi điểm. Vui lòng đăng nhập quyền GVCN hoặc Ban Cán Sự!');
      onClose();
      onOpenLogin();
      return false;
    }
    if (isBcsBlocked) {
      alert('GVCN hiện đang tạm khóa quyền nhập điểm của Cán bộ lớp. Vui lòng liên hệ GVCN!');
      return false;
    }
    if (isOutOfScope) {
      alert(`GVCN quy định Tổ trưởng chỉ được chấm học sinh trong Tổ ${activeOfficer?.group} phụ trách! Bạn không thể chấm điểm học sinh Tổ ${student.group}.`);
      return false;
    }
    return true;
  };

  const handleApplyPreset = (points: number, title: string) => {
    if (!checkScorePermission()) return;
    onAddScore(student.id, points, title);
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkScorePermission()) return;
    const pts = parseInt(customPoints);
    if (isNaN(pts)) return;
    const reason = customReason.trim() || (pts > 0 ? 'Khen thưởng thi đua' : 'Nhắc nhở nề nếp');
    onAddScore(student.id, pts, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl shadow-inner">
              {student.gender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white font-['Nunito',sans-serif]">
                {student.name}
              </h3>
              <p className="text-xs text-indigo-100 flex items-center gap-2 mt-0.5">
                <span className="font-semibold">Tổ {student.group}</span>
                <span>•</span>
                <span>{student.role}</span>
                <span>•</span>
                <span className="font-bold text-amber-300">{student.points} điểm</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scroll flex-1">
          
          {/* ROLE INDICATOR & OFFICER BADGE */}
          {currentRole === 'gvcn' && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Người đánh giá: <b>Giáo Viên Chủ Nhiệm (Toàn quyền)</b></span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-[10px] font-black">GVCN</span>
            </div>
          )}

          {currentRole === 'bcs' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-emerald-600" />
                <span>
                  Người đánh giá: <b>{activeOfficer ? `${activeOfficer.roleTitle} (${activeOfficer.name})` : 'Ban Cán Sự Lớp'}</b>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-200 text-[10px] font-black">CÁN BỘ LỚP</span>
            </div>
          )}

          {/* WARNINGS IF PERMISSION RESTRICTED */}
          {isBcsBlocked && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>GVCN đã khóa quyền cho điểm của Cán bộ lớp. Bạn không thể ghi điểm.</span>
            </div>
          )}

          {isOutOfScope && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>GVCN quy định Tổ trưởng chỉ được chấm điểm học sinh trong Tổ {activeOfficer?.group} phụ trách. Học sinh này thuộc Tổ {student.group}.</span>
            </div>
          )}

          {currentRole === 'viewer' && (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Bạn đang ở <b>Chế độ xem</b> (khóa tính năng cho điểm)</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline text-xs cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
          )}

          {currentRole === 'viewer' && (
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Bạn đang ở <b>Chế độ xem</b> (khóa tính năng cho điểm)</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline text-xs cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
          )}

          {/* SECTION 1: KHEN THƯỞNG */}
          <div>
            <div className="text-xs font-black uppercase text-emerald-700 tracking-wider mb-2.5 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>KHEN THƯỞNG (ĐIỂM CỘNG)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {REWARD_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset.points, preset.title)}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${preset.color}`}
                >
                  <span className="truncate pr-1 flex items-center gap-1.5">
                    <i className={`fa-solid ${preset.icon}`}></i>
                    <span>{preset.title}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black shrink-0">
                    +{preset.points}đ
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: NHẮC NHỞ */}
          <div>
            <div className="text-xs font-black uppercase text-rose-700 tracking-wider mb-2.5 flex items-center gap-1.5">
              <MinusCircle className="w-4 h-4 text-rose-600" />
              <span>NHẮC NHỞ (ĐIỂM TRỪ)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PENALTY_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset.points, preset.title)}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${preset.color}`}
                >
                  <span className="truncate pr-1 flex items-center gap-1.5">
                    <i className={`fa-solid ${preset.icon}`}></i>
                    <span>{preset.title}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-black shrink-0">
                    {preset.points}đ
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: TÙY CHỈNH */}
          <form onSubmit={handleApplyCustom} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nhập điểm và lý do tùy chỉnh tự do:</span>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                placeholder="+/- Điểm"
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể (vd: Giúp đỡ bạn bè)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!customPoints}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                Ghi điểm
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
