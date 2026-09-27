import React, { useState, useEffect } from 'react';
import { ClassSettings, Student, PointLog, AttendanceRecord, UserRole } from '../types';
import { INITIAL_STUDENTS, ClassroomBackup, validateBackup, saveStoredSettings, getStorageError } from '../utils/storage';
import { 
  X, 
  Settings, 
  RotateCcw, 
  RefreshCw, 
  Download, 
  Upload, 
  Users, 
  Check, 
  FileCode,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Crown,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  ClipboardList
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClassSettings;
  onUpdateSettings: (newSettings: ClassSettings) => void;
  onResetWeeklyPoints: () => void;
  onResetToDefaultSample: () => void;
  onBulkImport: (names: string[]) => void;
  students: Student[];
  pointLogs: PointLog[];
  attendance: Record<string, AttendanceRecord>;
  rules: import('../types').ClassRule[];
  monthlyStore: import('../types').MonthlyStore;
  onRestoreData: (data: ClassroomBackup) => void;
  onExportStandaloneHtml: () => void;
  soundEnabled: boolean;
  currentRole: UserRole;
  onOpenLogin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetWeeklyPoints,
  onResetToDefaultSample,
  onBulkImport,
  students,
  pointLogs,
  attendance,
  rules,
  monthlyStore,
  onRestoreData,
  onExportStandaloneHtml,
  soundEnabled,
  currentRole,
  onOpenLogin
}) => {
  const [formData, setFormData] = useState<ClassSettings>(settings);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const isGvcn = currentRole === 'gvcn';

  const checkGvcnPermission = (actionDesc: string): boolean => {
    if (isGvcn) return true;
    alert(`Chức năng "${actionDesc}" chỉ dành cho Giáo Viên Chủ Nhiệm (GVCN) toàn quyền! Vui lòng đăng nhập quyền GVCN.`);
    onOpenLogin();
    return false;
  };

  const handleFillSample54 = () => {
    const list = INITIAL_STUDENTS.map(s => s.name).join('\n');
    setBulkText(list);
  };

  const handleSaveClassInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkGvcnPermission('Thay đổi thông tin lớp học')) return;

    playClick(soundEnabled);
    onUpdateSettings(formData);
    saveStoredSettings(formData);
    alert(getStorageError() || 'Đã lưu thông tin lớp học và cài đặt bảo mật thành công!');
  };

  const handleBackupJson = () => {
    playClick(soundEnabled);
    const data = {
      version: '3.0',
      settings,
      rules,
      monthlyStore,
      students,
      pointLogs,
      attendance,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Lop7C8_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkGvcnPermission('Khôi phục dữ liệu từ JSON')) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        validateBackup(parsed);
        if (parsed && Array.isArray(parsed.students)) {
          onRestoreData(parsed);
          alert('Đã nạp dữ liệu JSON. Nếu trình duyệt không lưu được, thông báo lỗi sẽ hiện trên trang.');
          onClose();
        } else {
          alert('File JSON không đúng cấu trúc hệ thống!');
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
  };

  const handleRunBulkImport = () => {
    if (!checkGvcnPermission('Nhập danh sách học sinh hàng loạt')) return;

    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      alert('Vui lòng dán danh sách tên học sinh (mỗi dòng 1 tên)!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn thay thế toàn bộ danh sách lớp bằng ${lines.length} học sinh mới này không?`)) {
      onBulkImport(lines);
      setBulkText('');
      onClose();
      alert(`Đã nạp thành công ${lines.length} học sinh mới vào 4 Tổ lớp 7C8!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">CÀI ĐẶT & QUẢN LÝ DỮ LIỆU</h3>
              <p className="text-xs text-slate-400">Lớp 7C8 • Năm học {formData.academicYear}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ROLE NOTICE */}
        {isGvcn ? (
          <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Bạn đang đăng nhập quyền <b>GVCN (Toàn quyền quản trị)</b></span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-black text-[10px]">ĐÃ XÁC THỰC</span>
          </div>
        ) : (
          <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Vai trò hiện tại: <b>{currentRole === 'bcs' ? 'Ban Cán Sự Lớp' : 'Chế độ xem'}</b></span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
            >
              Đăng nhập GVCN
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scroll flex-1 text-sm text-slate-700">
          
          {/* SECTION 1: THÔNG TIN LỚP HỌC */}
          <form onSubmit={handleSaveClassInfo} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>1. Thông tin Lớp học & Giáo viên</span>
                {!isGvcn && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </h4>
              {!isGvcn && (
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Cần quyền GVCN để sửa
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Lớp</label>
                <input
                  type="text"
                  disabled={!isGvcn}
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="LỚP 7C8"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Năm Học</label>
                <input
                  type="text"
                  disabled={!isGvcn}
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="2026 - 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Trường</label>
                <input
                  type="text"
                  disabled={!isGvcn}
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="THCS VÕ THỊ SÁU"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Giáo viên chủ nhiệm (GVCN)</label>
                <input
                  type="text"
                  disabled={!isGvcn}
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Cô Ngô Thị Phương"
                />
              </div>
            </div>

            {/* MÃ PIN & PHÂN QUYỀN CÁN BỘ LỚP */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Phân Quyền Cho Cán Bộ Lớp / Tổ Trưởng Nhập Điểm:</span>
              </div>

              {/* TOGGLE MANDATORY LOGIN ON APP ENTRY */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>Bắt buộc đăng nhập khi vào ứng dụng</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">Khuyến nghị</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.requireLoginOnEntry !== false 
                      ? 'Đang BẬT: Khi mở hoặc tải lại ứng dụng, bắt buộc phải chọn vai trò & đăng nhập trước khi vào lớp' 
                      : 'Đang TẮT: Tự động vào trực tiếp giao diện lớp học'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isGvcn}
                  onClick={() => {
                    playClick(soundEnabled);
                    setFormData({ ...formData, requireLoginOnEntry: formData.requireLoginOnEntry === false ? true : false });
                  }}
                  className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0 ml-2 ${
                    formData.requireLoginOnEntry !== false
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {formData.requireLoginOnEntry !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Bắt Buộc</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Không Khóa</span>
                    </>
                  )}
                </button>
              </div>

              {/* TOGGLE ALLOW BCS SCORING */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Cho phép Cán bộ lớp (Tổ trưởng, Lớp phó) nhập điểm
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.allowBcsScoring !== false 
                      ? 'Đang BẬT: Cán bộ lớp có thể tích điểm trên điện thoại hoặc máy tính' 
                      : 'Đang TẮT: Khóa quyền nhập điểm của cán bộ lớp (chỉ GVCN mới được cho điểm)'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isGvcn}
                  onClick={() => {
                    playClick(soundEnabled);
                    setFormData({ ...formData, allowBcsScoring: formData.allowBcsScoring === false ? true : false });
                  }}
                  className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                    formData.allowBcsScoring !== false
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {formData.allowBcsScoring !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Đang Bật</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Đang Khóa</span>
                    </>
                  )}
                </button>
              </div>

              {/* TOGGLE BCS ONE-TOUCH (NO PIN REQUIRED) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Chế độ 1-chạm cho Cán bộ lớp & Tổ trưởng (Không cần gõ mã PIN)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.requireBcsPin !== true 
                      ? 'Đang BẬT 1-chạm: Học sinh chỉ cần bấm tên mình là vào chấm điểm ngay, cực kỳ tiện lợi và dễ thao tác' 
                      : 'Đang YÊU CẦU PIN: Bắt buộc học sinh phải gõ đúng mã PIN mới được chấm điểm'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isGvcn}
                  onClick={() => {
                    playClick(soundEnabled);
                    setFormData({ ...formData, requireBcsPin: formData.requireBcsPin === true ? false : true });
                  }}
                  className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0 ml-2 ${
                    formData.requireBcsPin !== true
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {formData.requireBcsPin !== true ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>1-Chạm Ngay</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Cần PIN</span>
                    </>
                  )}
                </button>
              </div>

              {/* TOGGLE BCS CHANGE GROUP PERMISSION */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Quyền đổi thành viên giữa các tổ (Cán bộ lớp & GVCN)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.allowBcsChangeGroup !== false 
                      ? 'Đang BẬT: Ban cán sự và GVCN đều được quyền chuyển tổ và hoán đổi học sinh giữa các tổ' 
                      : 'Đang TẮT: Chỉ riêng GVCN mới được quyền đổi tổ cho học sinh'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isGvcn}
                  onClick={() => {
                    playClick(soundEnabled);
                    setFormData({ ...formData, allowBcsChangeGroup: formData.allowBcsChangeGroup === false ? true : false });
                  }}
                  className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0 ml-2 ${
                    formData.allowBcsChangeGroup !== false
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {formData.allowBcsChangeGroup !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Được Đổi Tổ</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Chỉ GVCN</span>
                    </>
                  )}
                </button>
              </div>

              {/* BCS SCOPE SELECTION */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Phạm vi chấm điểm của Tổ trưởng:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isGvcn}
                    onClick={() => {
                      playClick(soundEnabled);
                      setFormData({ ...formData, bcsScope: 'all' });
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-medium transition cursor-pointer ${
                      formData.bcsScope !== 'own_group'
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Chấm Cả 4 Tổ (54 Học sinh)</div>
                    <div className="text-[10px] text-slate-500">Tổ trưởng có thể chấm điểm cho bất kỳ ai trong lớp</div>
                  </button>

                  <button
                    type="button"
                    disabled={!isGvcn}
                    onClick={() => {
                      playClick(soundEnabled);
                      setFormData({ ...formData, bcsScope: 'own_group' });
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-medium transition cursor-pointer ${
                      formData.bcsScope === 'own_group'
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Chỉ Chấm Tổ Phụ Trách</div>
                    <div className="text-[10px] text-slate-500">Tổ 1 chỉ chấm Tổ 1, Tổ 2 chỉ chấm Tổ 2...</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã PIN GVCN (Mặc định: 123456)</label>
                  <input
                    type="text"
                    disabled={!isGvcn}
                    value={formData.gvcnPin}
                    onChange={(e) => setFormData({ ...formData, gvcnPin: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs font-bold bg-white disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã PIN Cán Bộ Lớp (Mặc định: 1234)</label>
                  <input
                    type="text"
                    disabled={!isGvcn}
                    value={formData.bcsPin}
                    onChange={(e) => setFormData({ ...formData, bcsPin: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs font-bold bg-white disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {isGvcn && (
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Thông Tin Lớp & Cài Đặt Phân Quyền</span>
              </button>
            )}
          </form>

          <hr className="border-slate-100" />

          {/* SECTION 2: QUẢN LÝ THI ĐUA & RESET */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              2. Quản lý Thi Đua & Điểm Số
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (!checkGvcnPermission('Đặt lại điểm về 0')) return;
                  playClick(soundEnabled);
                  onResetWeeklyPoints();
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isGvcn
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                    : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Đặt Lại Điểm Về 0 (Đầu Tuần)</span>
              </button>

              <button
                onClick={() => {
                  if (!checkGvcnPermission('Khôi phục danh sách chuẩn 54 HS')) return;
                  playClick(soundEnabled);
                  onResetToDefaultSample();
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isGvcn
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Khôi Phục Chuẩn 54 HS Lớp 7C8</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 3: SAO LƯU & KHÔI PHỤC JSON */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              3. Sao Lưu & Khôi Phục Dữ Liệu
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBackupJson}
                className="p-3 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Sao Lưu Ra File JSON</span>
              </button>

              <label className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isGvcn
                  ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}>
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Khôi Phục Từ File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  disabled={!isGvcn}
                  onChange={handleRestoreJsonFile}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={() => {
                playClick(soundEnabled);
                onExportStandaloneHtml();
              }}
              className="w-full p-3 rounded-2xl border border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>Tải Xuống 1 File HTML Duy Nhất (Chạy Độc Lập Lớp 7C8 Offline)</span>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 4: NHẬP DANH SÁCH HÀNG LOẠT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                4. Nhập Danh Sách Học Sinh Hàng Loạt
              </h4>
              {isGvcn && (
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    handleFillSample54();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Nạp 54 Tên Mẫu Vào Khung</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Dán danh sách học sinh từ Excel hoặc Word (mỗi dòng một học sinh). Hệ thống sẽ tự động phân bổ đều vào 4 Tổ (hiện tại chuẩn lớp 54 học sinh):
            </p>

            <textarea
              value={bulkText}
              disabled={!isGvcn}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Hoàng C&#10;Phạm Thuỳ D..."
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
            />

            <button
              onClick={handleRunBulkImport}
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                isGvcn ? 'bg-slate-800 hover:bg-slate-900' : 'bg-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Nạp Danh Sách Học Sinh Này Vào Lớp 7C8</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
