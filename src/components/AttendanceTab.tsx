import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, ClassSettings, UserRole } from '../types';
import { exportAttendanceToCSV } from '../utils/storage';
import { 
  UserCheck, 
  Clock, 
  Mail, 
  UserX, 
  CheckCheck, 
  Download, 
  Search, 
  CalendarDays,
  Filter,
  Lock
} from 'lucide-react';
import { playTingTing, playClick } from '../utils/audio';

interface AttendanceTabProps {
  students: Student[];
  attendance: Record<string, AttendanceRecord>;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  settings: ClassSettings;
  soundEnabled: boolean;
  currentRole: UserRole;
  onOpenLogin: () => void;
}

const ATT_STATUS_ORDER: AttendanceStatus[] = ['present', 'late', 'excused', 'unexcused'];

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  badge: string;
}> = {
  present: {
    label: 'Có mặt',
    bg: 'bg-emerald-50/70 hover:bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  late: {
    label: 'Đi muộn',
    bg: 'bg-amber-50/70 hover:bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  excused: {
    label: 'Có phép',
    bg: 'bg-sky-50/70 hover:bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  unexcused: {
    label: 'Không phép',
    bg: 'bg-rose-50/70 hover:bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-300'
  }
};

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  students,
  attendance,
  onUpdateAttendance,
  onMarkAllPresent,
  settings,
  soundEnabled,
  currentRole,
  onOpenLogin
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate statistics
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  students.forEach((st) => {
    const status = attendance[st.id]?.status || 'present';
    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'excused') excusedCount++;
    else if (status === 'unexcused') unexcusedCount++;
  });

  const handleCycleStatus = (studentId: string) => {
    if (currentRole === 'viewer') {
      alert('Chế độ trình chiếu không được sửa điểm danh. Vui lòng đăng nhập quyền Ban Cán Sự hoặc GVCN!');
      onOpenLogin();
      return;
    }
    playClick(soundEnabled);
    const current = attendance[studentId]?.status || 'present';
    const nextIdx = (ATT_STATUS_ORDER.indexOf(current) + 1) % ATT_STATUS_ORDER.length;
    const nextStatus = ATT_STATUS_ORDER[nextIdx];
    onUpdateAttendance(studentId, nextStatus);
  };

  const handleAllPresentClick = () => {
    if (currentRole === 'viewer') {
      alert('Chế độ trình chiếu không được sửa điểm danh. Vui lòng đăng nhập quyền Ban Cán Sự hoặc GVCN!');
      onOpenLogin();
      return;
    }
    playTingTing(soundEnabled);
    onMarkAllPresent();
  };

  const handleExportCSV = () => {
    playClick(soundEnabled);
    exportAttendanceToCSV(students, attendance, settings);
  };

  const filteredStudents = students.filter((st) => {
    const matchGroup = selectedGroup === 'all' || st.group === selectedGroup;
    const matchSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        st.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. STATS METRICS CARDS (4 TILES) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-emerald-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Nunito',sans-serif]">
              {presentCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Có mặt
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-['Nunito',sans-serif]">
              {lateCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đi muộn
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-sky-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-sky-600 font-['Nunito',sans-serif]">
              {excusedCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Có phép
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-rose-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-['Nunito',sans-serif]">
              {unexcusedCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Không phép
            </div>
          </div>
        </div>

      </div>

      {/* 2. ACTION TOOLBAR & QUICK ACTIONS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Điểm danh ngày hôm nay
            </h3>
            <p className="text-xs text-slate-500 capitalize">{todayFormatted}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleAllPresentClick}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Cả Lớp Có Mặt (1 Chạm)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>

      </div>

      {/* 3. FILTER & LEGEND */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Group Filter */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </span>
          {(['all', '1', '2', '3', '4'] as const).map((grp) => (
            <button
              key={grp}
              onClick={() => {
                playClick(soundEnabled);
                setSelectedGroup(grp);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGroup === grp
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {grp === 'all' ? 'Tất cả' : `Tổ ${grp}`}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <span className="text-slate-400">1 Chạm đổi trạng thái:</span>
          <span className="text-emerald-700">🟢 Có mặt</span>
          <span>➔</span>
          <span className="text-amber-700">🟡 Đi muộn</span>
          <span>➔</span>
          <span className="text-sky-700">🔵 Có phép</span>
          <span>➔</span>
          <span className="text-rose-700">🔴 Không phép</span>
        </div>

      </div>

      {/* 4. ATTENDANCE STUDENT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStudents.map((st) => {
          const record = attendance[st.id] || { studentId: st.id, status: 'present', updatedAt: Date.now() };
          const cfg = STATUS_CONFIG[record.status];

          return (
            <div
              key={st.id}
              onClick={() => handleCycleStatus(st.id)}
              className={`bg-white rounded-2xl p-4 border ${cfg.border} ${cfg.bg} cursor-pointer hover:shadow-md transition transform active:scale-98 flex items-center justify-between select-none shadow-xs`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                  {st.gender === 'female' ? '👧' : '👦'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {st.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Tổ {st.group} • {st.role}
                  </div>
                </div>
              </div>

              <div className="shrink-0 pl-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${cfg.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
