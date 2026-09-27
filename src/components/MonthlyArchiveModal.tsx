import React, { useState } from 'react';
import { MonthlyRecord, Student, ClassSettings, UserRole } from '../types';
import { 
  X, 
  Calendar, 
  CalendarDays, 
  Trophy, 
  FileSpreadsheet, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  Edit3, 
  Save, 
  Flame, 
  Users,
  Award
} from 'lucide-react';
import { exportMonthlyReportToCSV, getRankTier } from '../utils/storage';
import { playClick, playSuccess } from '../utils/audio';

interface MonthlyArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  months: Record<string, MonthlyRecord>;
  activeMonthId: string;
  onSelectMonth: (monthId: string) => void;
  onUpdateMonth: (month: MonthlyRecord) => void;
  onAddNewMonth: (newMonth: MonthlyRecord) => void;
  students: Student[];
  settings: ClassSettings;
  currentRole: UserRole;
  soundEnabled: boolean;
}

export const MonthlyArchiveModal: React.FC<MonthlyArchiveModalProps> = ({
  isOpen,
  onClose,
  months,
  activeMonthId,
  onSelectMonth,
  onUpdateMonth,
  onAddNewMonth,
  students,
  settings,
  currentRole,
  soundEnabled
}) => {
  const [selectedTabMonthId, setSelectedTabMonthId] = useState<string>(activeMonthId);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [themeDraft, setThemeDraft] = useState('');
  const [isAddingNewMonth, setIsAddingNewMonth] = useState(false);
  const [newMonthNumber, setNewMonthNumber] = useState(10);
  const [newMonthYear, setNewMonthYear] = useState(2026);
  const [newMonthTheme, setNewMonthTheme] = useState('');

  if (!isOpen) return null;

  const monthList: MonthlyRecord[] = (Object.values(months) as MonthlyRecord[]).sort((a, b) => a.id.localeCompare(b.id));
  const activeRecord = months[selectedTabMonthId] || months[activeMonthId] || monthList[0];
  const isGvcn = currentRole === 'gvcn';

  // Calculate statistics for the activeRecord
  const monthScores = activeRecord.studentScores || {};
  const sortedStudentsForMonth = [...students].map(st => ({
    ...st,
    points: monthScores[st.id] !== undefined ? monthScores[st.id] : 0
  })).sort((a, b) => b.points - a.points);

  const top1 = sortedStudentsForMonth[0];
  const top2 = sortedStudentsForMonth[1];
  const top3 = sortedStudentsForMonth[2];

  const groups: Array<'1' | '2' | '3' | '4'> = ['1', '2', '3', '4'];
  const groupStats = groups.map(gId => {
    const mems = sortedStudentsForMonth.filter(s => s.group === gId);
    const total = mems.reduce((acc, s) => acc + s.points, 0);
    const avg = mems.length ? Number((total / mems.length).toFixed(1)) : 0;
    return { gId, total, avg, count: mems.length };
  }).sort((a, b) => b.total - a.total);

  const totalClassPoints = sortedStudentsForMonth.reduce((acc, s) => acc + s.points, 0);
  const avgClassPoints = sortedStudentsForMonth.length ? Number((totalClassPoints / sortedStudentsForMonth.length).toFixed(1)) : 0;

  const handleStartEditNote = () => {
    setNoteDraft(activeRecord.note || '');
    setThemeDraft(activeRecord.theme || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    playSuccess(soundEnabled);
    const updated: MonthlyRecord = {
      ...activeRecord,
      note: noteDraft.trim(),
      theme: themeDraft.trim()
    };
    onUpdateMonth(updated);
    setIsEditingNote(false);
  };

  const handleToggleLockMonth = () => {
    playClick(soundEnabled);
    const nextLocked = !activeRecord.isArchived;
    const updated: MonthlyRecord = {
      ...activeRecord,
      isArchived: nextLocked,
      archivedAt: nextLocked ? Date.now() : undefined
    };
    onUpdateMonth(updated);
  };

  const handleExportThisMonthCSV = () => {
    playClick(soundEnabled);
    exportMonthlyReportToCSV(activeRecord, students, settings);
  };

  const handleCreateNewMonth = () => {
    const padMonth = newMonthNumber < 10 ? `0${newMonthNumber}` : `${newMonthNumber}`;
    const newId = `${newMonthYear}-${padMonth}`;
    if (months[newId]) {
      alert(`Tháng ${newMonthNumber}/${newMonthYear} đã tồn tại trong danh sách!`);
      return;
    }
    const defaultScores: Record<string, number> = {};
    students.forEach(s => {
      defaultScores[s.id] = 10;
    });

    const newRec: MonthlyRecord = {
      id: newId,
      name: `Tháng ${newMonthNumber}/${newMonthYear}`,
      year: newMonthYear,
      month: newMonthNumber,
      theme: newMonthTheme.trim() || 'Thi đua nề nếp & học tập',
      studentScores: defaultScores,
      pointLogs: [],
      isArchived: false,
      note: ''
    };

    onAddNewMonth(newRec);
    setSelectedTabMonthId(newId);
    setIsAddingNewMonth(false);
    playSuccess(soundEnabled);
  };

  return (
    <div 
      id="monthly-archive-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        id="monthly-archive-modal-card"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
      >
        {/* 1. Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white p-4 sm:p-6 relative">
          <button
            id="close-monthly-modal-btn"
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 text-amber-300 flex items-center justify-center text-2xl shadow-inner">
              <CalendarDays className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1 border border-amber-400/30">
                <Trophy className="w-3 h-3" /> LƯU TRỮ THI ĐUA THEO THÁNG • NĂM HỌC {settings.academicYear}
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-['Nunito',sans-serif]">
                Quản Lý Dữ Liệu Theo Tháng - Lớp {settings.className}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
                Xem lại bảng điểm, xếp hạng 4 tổ, thủ khoa và xuất báo cáo thi đua của từng tháng
              </p>
            </div>
          </div>
        </div>

        {/* 2. Month Selector Horizontal Pills */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 sm:px-4 flex items-center gap-1.5 overflow-x-auto custom-scroll">
          {monthList.map((m) => {
            const isSelected = m.id === selectedTabMonthId;
            const isCurrentActive = m.id === activeMonthId;
            return (
              <button
                key={m.id}
                id={`select-month-tab-${m.id}`}
                onClick={() => {
                  playClick(soundEnabled);
                  setSelectedTabMonthId(m.id);
                  setIsEditingNote(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>{m.name}</span>
                {isCurrentActive && (
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} title="Tháng đang thao tác" />
                )}
                {m.isArchived && (
                  <Lock className={`w-3 h-3 ${isSelected ? 'text-amber-200' : 'text-amber-600'}`} />
                )}
              </button>
            );
          })}

          {isGvcn && (
            <button
              id="add-new-month-btn"
              onClick={() => {
                playClick(soundEnabled);
                setIsAddingNewMonth(true);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Tháng Mới</span>
            </button>
          )}
        </div>

        {/* 3. Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1 space-y-6">

          {/* New Month Form Card */}
          {isAddingNewMonth && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-emerald-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" /> Khởi tạo tháng thi đua mới
                </h4>
                <button 
                  onClick={() => setIsAddingNewMonth(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tháng (1 - 12):</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newMonthNumber}
                    onChange={(e) => setNewMonthNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Năm:</label>
                  <input
                    type="number"
                    value={newMonthYear}
                    onChange={(e) => setNewMonthYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chủ đề phong trào tháng:</label>
                  <input
                    type="text"
                    placeholder="VD: Thi đua Hoa Điểm 10"
                    value={newMonthTheme}
                    onChange={(e) => setNewMonthTheme(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleCreateNewMonth}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Xác nhận tạo tháng
                </button>
              </div>
            </div>
          )}

          {/* Month Banner & Action Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                  {activeRecord.name}
                </h3>
                {activeRecord.id === activeMonthId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Tháng hiện tại
                  </span>
                )}
                {activeRecord.isArchived ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Đã chốt sổ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Đang theo dõi
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-indigo-200">
                Chủ đề: <b className="text-white">{activeRecord.theme || 'Thi đua nề nếp & học tập'}</b>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Set as currently viewed / active working month */}
              {activeRecord.id !== activeMonthId && (
                <button
                  id="set-active-working-month-btn"
                  onClick={() => {
                    playSuccess(soundEnabled);
                    onSelectMonth(activeRecord.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Chọn Làm Việc Với Tháng Này</span>
                </button>
              )}

              {/* Export CSV for this month */}
              <button
                id="export-this-month-csv-btn"
                onClick={handleExportThisMonthCSV}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Xuất bảng điểm và xếp hạng tháng ra file CSV/Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Xuất Báo Cáo Tháng</span>
              </button>

              {/* GVCN Lock / Unlock Month */}
              {isGvcn && (
                <button
                  id="toggle-lock-month-btn"
                  onClick={handleToggleLockMonth}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeRecord.isArchived
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
                      : 'bg-rose-500/20 border-rose-400/40 text-rose-200 hover:bg-rose-500/30'
                  }`}
                  title={activeRecord.isArchived ? 'Mở khóa để tiếp tục nhập điểm' : 'Chốt sổ không cho sửa điểm'}
                >
                  {activeRecord.isArchived ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở Khóa Tháng</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chốt Sổ Tháng</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Month Stats Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Top 1 Student */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-amber-800 text-[11px] font-bold uppercase mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-600" /> Thủ Khoa Tháng
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800 truncate">
                {top1 ? top1.name : '---'}
              </div>
              <div className="text-xs text-amber-700 font-extrabold mt-0.5">
                {top1 ? `${top1.points} điểm (Tổ ${top1.group})` : '0đ'}
              </div>
            </div>

            {/* Top 1 Group */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-indigo-800 text-[11px] font-bold uppercase mb-1">
                <Award className="w-3.5 h-3.5 text-indigo-600" /> Tổ Quán Quân Tháng
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800">
                Tổ {groupStats[0]?.gId || '---'}
              </div>
              <div className="text-xs text-indigo-700 font-extrabold mt-0.5">
                {groupStats[0]?.total || 0} điểm (TB: {groupStats[0]?.avg || 0}đ)
              </div>
            </div>

            {/* Total Class Points */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-emerald-800 text-[11px] font-bold uppercase mb-1">
                <Flame className="w-3.5 h-3.5 text-emerald-600" /> Tổng Điểm Lớp
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800">
                {totalClassPoints} điểm
              </div>
              <div className="text-xs text-emerald-700 font-extrabold mt-0.5">
                Trung bình {avgClassPoints}đ/học sinh
              </div>
            </div>

            {/* Point Logs Recorded */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-purple-800 text-[11px] font-bold uppercase mb-1">
                <Users className="w-3.5 h-3.5 text-purple-600" /> Nhật Ký Chấm Điểm
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800">
                {activeRecord.pointLogs ? activeRecord.pointLogs.length : 0} lượt
              </div>
              <div className="text-xs text-purple-700 font-extrabold mt-0.5">
                Đã ghi nhận trong tháng
              </div>
            </div>
          </div>

          {/* Group Emulation Rankings in this Month */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h4 className="font-black text-sm sm:text-base text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Bảng Xếp Hạng 4 Tổ Trong {activeRecord.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {groupStats.map((g, idx) => {
                const isChampion = idx === 0;
                return (
                  <div
                    key={g.gId}
                    className={`rounded-2xl p-3.5 border transition ${
                      isChampion 
                        ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300/60' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                        isChampion ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        HẠNG {idx + 1}
                      </span>
                      {isChampion && <Trophy className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="font-black text-slate-800 text-base">
                      Tổ {g.gId}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Sĩ số: <b>{g.count}</b> học sinh
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Tổng điểm:</span>
                      <b className="font-black text-indigo-700">{g.total}đ</b>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Điểm TB:</span>
                      <b>{g.avg}đ/hs</b>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher Monthly Review & Note Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Nhận xét & Đánh giá của GVCN cho {activeRecord.name}
              </h4>
              {isGvcn && !isEditingNote && (
                <button
                  onClick={handleStartEditNote}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Chỉnh sửa
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chủ đề thi đua của tháng:</label>
                  <input
                    type="text"
                    value={themeDraft}
                    onChange={(e) => setThemeDraft(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhận xét tổng kết tháng của GVCN:</label>
                  <textarea
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="VD: Lớp duy trì nề nếp tốt, Tổ 2 xuất sắc dẫn đầu. Cần cải thiện việc trực nhật..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-normal"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Save className="w-3 h-3" /> Lưu nhận xét
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                {activeRecord.note || 'Chưa có nhận xét tổng kết cho tháng này. GVCN có thể nhấn "Chỉnh sửa" để ghi chú.'}
              </p>
            )}
          </div>

          {/* Top 10 Individual Rankings in this Month */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h4 className="font-black text-sm sm:text-base text-slate-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Bảng Vàng Cá Nhân Trong {activeRecord.name} (Top 10)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50">
                    <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                    <th className="py-2.5 px-3 text-left">Họ và Tên</th>
                    <th className="py-2.5 px-3 text-center">Tổ</th>
                    <th className="py-2.5 px-3 text-center">Chức vụ</th>
                    <th className="py-2.5 px-3 text-center">Điểm tháng</th>
                    <th className="py-2.5 px-3 text-center">Danh hiệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStudentsForMonth.slice(0, 10).map((st, idx) => {
                    const tier = getRankTier(st.points);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-black">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          Tổ {st.group}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {st.role}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-indigo-700">
                          {st.points}đ
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tier.badgeBg} ${tier.badgeText}`}>
                            {tier.icon} {tier.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 4. Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Dữ liệu tự động đồng bộ và lưu trữ theo từng tháng trong trình duyệt.
          </div>
          <button
            id="close-archive-modal-footer-btn"
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
