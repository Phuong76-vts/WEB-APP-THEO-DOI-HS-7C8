import React, { useState, useEffect } from 'react';
import { Student, GroupId, UserRole, ActiveOfficer, ClassSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_CLASS_OFFICERS } from '../utils/storage';
import { StudentCard } from './StudentCard';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Lightbulb, 
  Users, 
  Crown, 
  Star, 
  Eye, 
  Zap, 
  CheckSquare, 
  Square, 
  Plus, 
  Minus, 
  X, 
  Check, 
  ShieldAlert,
  UserCheck,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';
import { playClick, playFanfare, playGentleReminder } from '../utils/audio';
import { QuickImportModal } from './QuickImportModal';
import { GroupTransferModal } from './GroupTransferModal';

interface ClassroomTabProps {
  students: Student[];
  onOpenScoreModal: (student: Student) => void;
  onQuickAddPoints: (student: Student, points: number, reason?: string) => void;
  onBatchAddPoints?: (students: Student[], points: number, reason: string) => void;
  onOpenEditModal: (student: Student) => void;
  onOpenAddModal: () => void;
  onBulkImport?: (names: string[]) => void;
  soundEnabled: boolean;
  currentRole: UserRole;
  onOpenLogin: () => void;
  onSelectRole?: (role: UserRole) => void;
  onSelectOfficer?: (officer: ActiveOfficer | null) => void;
  activeOfficer?: ActiveOfficer | null;
  settings?: ClassSettings;
  onChangeStudentGroup?: (studentId: string, newGroup: GroupId) => void;
  onBatchChangeGroup?: (studentIds: string[], newGroup: GroupId) => void;
  onSwapStudentsGroup?: (studentId1: string, studentId2: string) => void;
}

export const ClassroomTab: React.FC<ClassroomTabProps> = ({
  students,
  onOpenScoreModal,
  onQuickAddPoints,
  onBatchAddPoints,
  onOpenEditModal,
  onOpenAddModal,
  onBulkImport,
  soundEnabled,
  currentRole,
  onOpenLogin,
  onSelectRole,
  onSelectOfficer,
  activeOfficer,
  settings,
  onChangeStudentGroup,
  onBatchChangeGroup,
  onSwapStudentsGroup
}) => {
  const safeSettings = settings || DEFAULT_SETTINGS;
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isQuickImportOpen, setIsQuickImportOpen] = useState(false);
  const [isGroupTransferOpen, setIsGroupTransferOpen] = useState(false);
  
  // Fast scoring & batch mode states (optimal for mobile phones & quick grading)
  const [fastScoreMode, setFastScoreMode] = useState<boolean>(true);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Permission to change student groups
  const canChangeGroup = currentRole === 'gvcn' || (currentRole === 'bcs' && safeSettings.allowBcsChangeGroup !== false);

  // Automatically focus on officer's group if they are a group leader with own_group scope
  useEffect(() => {
    if (currentRole === 'bcs' && safeSettings.bcsScope === 'own_group' && activeOfficer?.group) {
      setSelectedGroup(activeOfficer.group);
    }
  }, [currentRole, safeSettings.bcsScope, activeOfficer]);

  const filteredStudents = students.filter(st => {
    const matchGroup = selectedGroup === 'all' || st.group === selectedGroup;
    const matchSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        st.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  const getGroupCount = (groupId: string) => {
    if (groupId === 'all') return students.length;
    return students.filter(s => s.group === groupId).length;
  };

  const handleAddStudentClick = () => {
    playClick(soundEnabled);
    if (currentRole !== 'gvcn') {
      alert('Chức năng "Thêm học sinh mới" chỉ dành cho Giáo Viên Chủ Nhiệm (GVCN) toàn quyền. Vui lòng đăng nhập GVCN!');
      onOpenLogin();
      return;
    }
    onOpenAddModal();
  };

  const handleQuickImportClick = () => {
    playClick(soundEnabled);
    if (currentRole !== 'gvcn') {
      alert('Chức năng dán/nạp danh sách lớp chỉ dành riêng cho GVCN toàn quyền để quản trị danh sách. Vui lòng đăng nhập GVCN!');
      onOpenLogin();
      return;
    }
    setIsQuickImportOpen(true);
  };

  const handleEditStudentClick = (student: Student) => {
    if (currentRole === 'viewer') {
      alert('Vui lòng đăng nhập GVCN hoặc chọn Cán bộ lớp để chỉnh sửa hồ sơ / đổi tổ học sinh!');
      onOpenLogin();
      return;
    }
    onOpenEditModal(student);
  };

  const handleGroupTransferClick = () => {
    playClick(soundEnabled);
    if (!canChangeGroup) {
      if (currentRole === 'viewer') {
        alert('Vui lòng đăng nhập GVCN hoặc chọn Cán bộ lớp để quản lý và đổi thành viên giữa các tổ!');
        onOpenLogin();
      } else {
        alert('GVCN hiện đang tạm khóa quyền đổi tổ của Cán bộ lớp trong Cài đặt.');
      }
      return;
    }
    setIsGroupTransferOpen(true);
  };

  const handleDirectChangeGroup = (studentId: string, newGroup: GroupId) => {
    if (!canChangeGroup) {
      if (currentRole === 'viewer') {
        alert('Vui lòng đăng nhập GVCN hoặc chọn Cán bộ lớp để đổi tổ!');
        onOpenLogin();
      } else {
        alert('GVCN hiện đang tạm khóa quyền đổi tổ của Cán bộ lớp trong Cài đặt.');
      }
      return;
    }
    playFanfare(soundEnabled);
    if (onChangeStudentGroup) {
      onChangeStudentGroup(studentId, newGroup);
    }
  };

  const handleBatchMoveToGroup = (targetGroup: GroupId) => {
    if (selectedStudentIds.length === 0) return;
    if (!canChangeGroup) {
      if (currentRole === 'viewer') {
        alert('Vui lòng đăng nhập GVCN hoặc chọn Cán bộ lớp để đổi tổ!');
        onOpenLogin();
      } else {
        alert('GVCN hiện đang tạm khóa quyền đổi tổ của Cán bộ lớp trong Cài đặt.');
      }
      return;
    }
    playFanfare(soundEnabled);
    if (onBatchChangeGroup) {
      onBatchChangeGroup(selectedStudentIds, targetGroup);
    }
    alert(`Đã chuyển thành công ${selectedStudentIds.length} học sinh sang Tổ ${targetGroup}!`);
    setSelectedStudentIds([]);
    setBatchMode(false);
  };

  const checkPermissionForStudent = (student: Student): boolean => {
    if (currentRole === 'viewer') {
      alert('Chế độ trình chiếu không được ghi điểm. Vui lòng đăng nhập quyền GVCN hoặc Ban Cán Sự!');
      onOpenLogin();
      return false;
    }
    if (currentRole === 'bcs') {
      if (safeSettings.allowBcsScoring === false) {
        alert('GVCN hiện đang tạm khóa quyền nhập điểm của Cán bộ lớp trong mục Cài đặt.');
        return false;
      }
      if (safeSettings.bcsScope === 'own_group' && activeOfficer?.group && student.group !== activeOfficer.group) {
        alert(`GVCN quy định Tổ trưởng chỉ được chấm điểm học sinh thuộc Tổ ${activeOfficer.group} phụ trách! Học sinh này thuộc Tổ ${student.group}.`);
        return false;
      }
    }
    return true;
  };

  const handleQuickAddClick = (student: Student, points: number, reason?: string) => {
    if (!checkPermissionForStudent(student)) return;
    onQuickAddPoints(student, points, reason);
  };

  // Batch selection methods
  const handleToggleSelectStudent = (student: Student) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(student.id)) {
        return prev.filter(id => id !== student.id);
      } else {
        return [...prev, student.id];
      }
    });
  };

  const handleSelectAllInView = () => {
    playClick(soundEnabled);
    const viewIds = filteredStudents.map(s => s.id);
    const allSelected = viewIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !viewIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...viewIds])));
    }
  };

  const handleApplyBatchScore = (points: number, reason: string) => {
    if (selectedStudentIds.length === 0) return;
    
    // Check viewer
    if (currentRole === 'viewer') {
      alert('Chế độ trình chiếu không được ghi điểm. Vui lòng đăng nhập quyền GVCN hoặc Ban Cán Sự!');
      onOpenLogin();
      return;
    }

    if (currentRole === 'bcs' && safeSettings.allowBcsScoring === false) {
      alert('GVCN hiện đang tạm khóa quyền nhập điểm của Cán bộ lớp.');
      return;
    }

    const targetStudents = students.filter(s => selectedStudentIds.includes(s.id));

    // If bcs own group constraint applies
    if (currentRole === 'bcs' && safeSettings.bcsScope === 'own_group' && activeOfficer?.group) {
      const invalid = targetStudents.filter(s => s.group !== activeOfficer.group);
      if (invalid.length > 0) {
        alert(`Bạn chỉ được chấm điểm học sinh trong Tổ ${activeOfficer.group}. Đã bỏ qua các học sinh ngoài tổ.`);
      }
    }

    if (onBatchAddPoints) {
      onBatchAddPoints(targetStudents, points, reason);
    } else {
      targetStudents.forEach(s => {
        if (checkPermissionForStudent(s)) {
          onQuickAddPoints(s, points, reason);
        }
      });
    }

    setSelectedStudentIds([]);
    setBatchMode(false);
  };

  return (
    <div className="space-y-4 pb-20">

      {/* CÁN BỘ LỚP & TỔ TRƯỞNG - ONE TOUCH QUICK ACCESS BAR */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-3.5 sm:p-4 text-white shadow-md border border-emerald-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-amber-300 shadow-inner shrink-0">
              {currentRole === 'gvcn' ? (
                <Crown className="w-5 h-5 text-amber-300" />
              ) : currentRole === 'bcs' ? (
                <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
              ) : (
                <Eye className="w-5 h-5 text-indigo-100" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-100">
                  {currentRole === 'gvcn' 
                    ? 'Đang đăng nhập: Giáo Viên Chủ Nhiệm (Toàn quyền)' 
                    : currentRole === 'bcs' 
                    ? 'Cán Bộ Lớp / Tổ Trưởng Đang Chấm Điểm:' 
                    : 'Chế Độ Xem (Chưa Đăng Nhập)'}
                </span>
                {currentRole === 'bcs' && activeOfficer && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{activeOfficer.roleTitle}: {activeOfficer.name}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                {currentRole === 'bcs'
                  ? '⚡ Chạm vào tên bạn bên dưới để đổi người chấm ngay (không cần nhập mật khẩu).'
                  : currentRole === 'viewer'
                  ? '👋 Bạn là Ban cán sự hay Tổ trưởng? Chạm vào tên bạn bên dưới để vào chấm điểm ngay 1-chạm!'
                  : 'GVCN có toàn quyền. Bạn có thể chạm chọn một cán bộ bên dưới để xem góc nhìn của học sinh.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {currentRole === 'bcs' && activeOfficer?.group && (
              <button
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setSelectedGroup(activeOfficer.group || 'all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  selectedGroup === activeOfficer.group
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Xem Tổ {activeOfficer.group} của tôi ({getGroupCount(activeOfficer.group)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                onOpenLogin();
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Phân quyền chi tiết</span>
            </button>
          </div>
        </div>

        {/* 8 OFFICERS QUICK TOUCH PILLS */}
        <div className="pt-2.5 flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1">
          <span className="text-[11px] font-black uppercase text-emerald-200 shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Chọn bạn đang trực:</span>
          </span>

          {DEFAULT_CLASS_OFFICERS.map((off, idx) => {
            const isCurrent = currentRole === 'bcs' && activeOfficer?.name === off.name && activeOfficer?.roleTitle === off.roleTitle;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  playFanfare(soundEnabled);
                  if (onSelectRole) onSelectRole('bcs');
                  if (onSelectOfficer) onSelectOfficer(off);
                  if (off.group) {
                    setSelectedGroup(off.group);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-white/70 shadow-md scale-105 font-black'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/20 hover:border-white/40'
                }`}
                title={`Đổi sang ${off.roleTitle} (${off.name})`}
              >
                <span>{off.roleTitle.includes('Lớp trưởng') ? '👑' : off.roleTitle.includes('Lớp phó') ? '⭐' : '🌿'}</span>
                <span className="truncate">{off.name}</span>
                <span className="text-[10px] opacity-85 font-semibold">
                  ({off.roleTitle.replace('Tổ trưởng Tổ ', 'T').replace('Lớp phó ', 'LP ')})
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* FILTER, SEARCH & MOBILE QUICK BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col gap-3.5">
        
        {/* ROW 1: GROUP TABS */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tổ:</span>
            </span>

            {(['all', '1', '2', '3', '4'] as const).map((grp) => {
              const isActive = selectedGroup === grp;
              const isOfficerGroup = currentRole === 'bcs' && activeOfficer?.group === grp;
              const label = grp === 'all' ? 'Tất cả' : `Tổ ${grp}`;
              const count = getGroupCount(grp);

              return (
                <button
                  key={grp}
                  onClick={() => {
                    playClick(soundEnabled);
                    setSelectedGroup(grp);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isOfficerGroup
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{label}</span>
                  {isOfficerGroup && <span className="text-[10px]">⭐</span>}
                  <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* QUICK TOOL MODES TOGGLE (MOBILE & DESKTOP) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick(soundEnabled);
                setFastScoreMode(!fastScoreMode);
              }}
              title="Bật/tắt nút tích điểm nhanh 1 chạm trên mỗi học sinh"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                fastScoreMode 
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300/40' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${fastScoreMode ? 'fill-slate-950' : ''}`} />
              <span>⚡ Chấm Nhanh 1 Chạm</span>
            </button>

            <button
              onClick={() => {
                playClick(soundEnabled);
                setBatchMode(!batchMode);
                if (batchMode) setSelectedStudentIds([]);
              }}
              title="Tích chọn nhiều bạn để cộng/trừ điểm cùng lúc"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                batchMode 
                  ? 'bg-indigo-600 text-white font-black' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{batchMode ? 'Tắt Chọn Nhiều' : 'Chọn Nhiều Bạn'}</span>
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH & CRUD BUTTON */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, chức vụ (Lớp trưởng, Tổ trưởng)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/60"
            />
          </div>

          <div className="flex items-center gap-2">
            {batchMode && (
              <button
                onClick={handleSelectAllInView}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id))
                  ? 'Bỏ chọn trang'
                  : 'Chọn cả trang'
                }
              </button>
            )}

            <button
              onClick={handleGroupTransferClick}
              title="Mở giao diện quản lý và đổi thành viên giữa các tổ"
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-300" />
              <span>Đổi Tổ Thành Viên</span>
            </button>

            <button
              onClick={handleQuickImportClick}
              title="Dán nhanh danh sách học sinh từ file Excel hoặc Word"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Dán DS Lớp</span>
            </button>

            <button
              onClick={handleAddStudentClick}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm HS</span>
            </button>
          </div>
        </div>

      </div>

      {/* ROLE & OFFICER STATUS BAR */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3.5 text-xs sm:text-sm text-blue-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-2xs">
            {currentRole === 'gvcn' ? <Crown className="w-4 h-4 text-amber-300" /> : <Star className="w-4 h-4 text-amber-200" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <b>Đang thao tác: </b>
              {currentRole === 'gvcn' && (
                <span className="text-amber-900 font-black bg-amber-200/70 px-2 py-0.5 rounded-md">
                  GVCN Cô Ngô Thị Phương (Toàn quyền quản trị)
                </span>
              )}
              {currentRole === 'bcs' && (
                <span className="text-emerald-900 font-black bg-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{activeOfficer ? `${activeOfficer.roleTitle}: ${activeOfficer.name}` : 'Ban Cán Sự Lớp'}</span>
                  {activeOfficer?.group && <span>(Tổ {activeOfficer.group})</span>}
                </span>
              )}
              {currentRole === 'viewer' && (
                <span className="text-slate-700 font-bold bg-slate-200 px-2 py-0.5 rounded-md">
                  Chế độ Trình chiếu (Chỉ xem)
                </span>
              )}
            </div>

            <p className="text-slate-600 text-xs mt-0.5">
              {currentRole === 'bcs' ? (
                safeSettings.allowBcsScoring ? (
                  safeSettings.bcsScope === 'own_group' && activeOfficer?.group ? (
                    <span>Được GVCN phân quyền chấm điểm cho các bạn trong <b>Tổ {activeOfficer.group}</b>. Tích 1 chạm để cho điểm ngay!</span>
                  ) : (
                    <span>Được GVCN phân quyền chấm điểm thi đua cho cả 4 Tổ trong lớp. Chạm vào nút điểm để ghi nhận tức thì!</span>
                  )
                ) : (
                  <span className="text-rose-700 font-bold">GVCN đang tạm tắt quyền nhập điểm của Cán bộ lớp.</span>
                )
              ) : (
                <span>Danh sách lớp 54 học sinh chia 4 tổ. Bấm <b>"+2đ"</b> hoặc chọn <b>"Chấm Nhanh 1 Chạm"</b> để tích điểm ngay trên điện thoại!</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs">
            <Users className="w-3.5 h-3.5" />
            <span>{filteredStudents.length}/{students.length} HS</span>
          </div>
        </div>
      </div>

      {/* STUDENTS GRID */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
          <p className="text-base font-bold">Không tìm thấy học sinh nào phù hợp với bộ lọc.</p>
          <button
            onClick={() => {
              setSelectedGroup('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredStudents.map((st) => (
            <StudentCard
              key={st.id}
              student={st}
              onOpenScoreModal={onOpenScoreModal}
              onQuickAddPoints={(s, p, r) => handleQuickAddClick(s, p, r)}
              onOpenEditModal={(s) => handleEditStudentClick(s)}
              soundEnabled={soundEnabled}
              fastScoreMode={fastScoreMode}
              batchMode={batchMode}
              isSelected={selectedStudentIds.includes(st.id)}
              onToggleSelect={handleToggleSelectStudent}
              onChangeGroup={(studentId, newGroup) => handleDirectChangeGroup(studentId, newGroup)}
            />
          ))}
        </div>
      )}

      {/* FLOATING ACTION DRAWER FOR BATCH SCORING & GROUP TRANSFER */}
      {batchMode && selectedStudentIds.length > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/20 flex flex-col lg:flex-row items-center justify-between gap-3 animate-slide-up">
          
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs">
                {selectedStudentIds.length}
              </span>
              <span>Đã chọn {selectedStudentIds.length} bạn</span>
            </div>
            
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-center flex-wrap">
            {/* SCORING BUTTONS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleApplyBatchScore(2, 'Phát biểu bài xây dựng tiết học')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                +2đ Phát biểu
              </button>

              <button
                onClick={() => handleApplyBatchScore(1, 'Làm bài tập / Việc tốt')}
                className="px-2.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                +1đ Bài tập
              </button>

              <button
                onClick={() => handleApplyBatchScore(-2, 'Mất trật tự / Thiếu bài tập')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                -2đ Quên bài
              </button>

              <button
                onClick={() => handleApplyBatchScore(-1, 'Vi phạm nề nếp / Đi muộn')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                -1đ Nề nếp
              </button>
            </div>

            {/* BATCH GROUP TRANSFER ACTIONS */}
            <div className="flex items-center gap-1.5 pt-1 lg:pt-0 lg:border-l lg:border-white/20 lg:pl-2.5">
              <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                <span>Đổi sang:</span>
              </span>
              {(['1', '2', '3', '4'] as GroupId[]).map((gid) => (
                <button
                  key={gid}
                  type="button"
                  onClick={() => handleBatchMoveToGroup(gid)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer shadow-2xs ${
                    gid === '1' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                    gid === '2' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                    gid === '3' ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                    'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                  title={`Chuyển ${selectedStudentIds.length} học sinh sang Tổ ${gid}`}
                >
                  Tổ {gid}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setBatchMode(false);
                setSelectedStudentIds([]);
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer ml-1"
              title="Đóng thanh chọn nhiều"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* QUICK IMPORT MODAL */}
      {onBulkImport && (
        <QuickImportModal
          isOpen={isQuickImportOpen}
          onClose={() => setIsQuickImportOpen(false)}
          onImport={onBulkImport}
          soundEnabled={soundEnabled}
          currentCount={students.length}
        />
      )}

      {/* GROUP TRANSFER & SWAP MODAL */}
      <GroupTransferModal
        isOpen={isGroupTransferOpen}
        onClose={() => setIsGroupTransferOpen(false)}
        students={students}
        onChangeGroup={(studentId, newGroup) => {
          if (onChangeStudentGroup) onChangeStudentGroup(studentId, newGroup);
        }}
        onSwapGroups={(studentId1, studentId2) => {
          if (onSwapStudentsGroup) onSwapStudentsGroup(studentId1, studentId2);
        }}
        soundEnabled={soundEnabled}
      />

    </div>
  );
};
