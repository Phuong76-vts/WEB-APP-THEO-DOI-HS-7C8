import React, { useState, useEffect } from 'react';
import { UserRole, ClassSettings, ROLE_DEFINITIONS, ActiveOfficer } from '../types';
import { DEFAULT_CLASS_OFFICERS } from '../utils/storage';
import { 
  X, 
  Crown, 
  Star, 
  Eye, 
  KeyRound, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  EyeOff,
  LogOut,
  Info,
  UserCheck,
  ShieldAlert,
  Zap,
  Sparkles
} from 'lucide-react';
import { playClick, playFanfare, playGentleReminder } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  settings: ClassSettings;
  soundEnabled: boolean;
  activeOfficer?: ActiveOfficer | null;
  onSelectOfficer?: (officer: ActiveOfficer | null) => void;
  onSuccessLogin?: (role: UserRole, officer: ActiveOfficer | null, rememberDevice: boolean) => void;
  onLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
  currentRole,
  onSelectRole,
  settings,
  soundEnabled,
  activeOfficer,
  onSelectOfficer,
  onSuccessLogin,
  onLogout
}) => {
  const [targetRole, setTargetRole] = useState<UserRole>(currentRole);
  const [selectedOfficer, setSelectedOfficer] = useState<ActiveOfficer>(
    activeOfficer || DEFAULT_CLASS_OFFICERS[0]
  );
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTargetRole(currentRole);
      if (activeOfficer) setSelectedOfficer(activeOfficer);
      setPinInput('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowPin(false);
    }
  }, [isOpen, currentRole, activeOfficer]);

  if (!isOpen) return null;

  const handleRoleCardClick = (role: UserRole) => {
    playClick(soundEnabled);
    setTargetRole(role);
    setPinInput('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (targetRole === 'viewer') {
      // Viewer does not require PIN
      playFanfare(soundEnabled);
      if (onSelectOfficer) onSelectOfficer(null);
      onSelectRole('viewer');
      if (onSuccessLogin) {
        onSuccessLogin('viewer', null, rememberDevice);
      }
      setSuccessMsg('Đăng nhập thành công: Chế độ Trình Chiếu (Chỉ xem)!');
      setTimeout(() => {
        onClose();
      }, 500);
      return;
    }

    // If BCS and requireBcsPin is false, allow 1-touch entry
    if (targetRole === 'bcs' && settings.requireBcsPin !== true) {
      playFanfare(soundEnabled);
      if (onSelectOfficer) onSelectOfficer(selectedOfficer);
      onSelectRole('bcs');
      if (onSuccessLogin) {
        onSuccessLogin('bcs', selectedOfficer, rememberDevice);
      }
      setSuccessMsg(`Đăng nhập thành công với vai trò: ${selectedOfficer.roleTitle} (${selectedOfficer.name})!`);
      setTimeout(() => {
        onClose();
      }, 500);
      return;
    }

    const expectedPin = targetRole === 'gvcn' ? (settings.gvcnPin || '123456') : (settings.bcsPin || '1234');
    
    if (pinInput.trim() === expectedPin.trim()) {
      playFanfare(soundEnabled);
      if (targetRole === 'bcs') {
        if (onSelectOfficer) onSelectOfficer(selectedOfficer);
      } else {
        if (onSelectOfficer) onSelectOfficer(null);
      }
      onSelectRole(targetRole);
      if (onSuccessLogin) {
        onSuccessLogin(targetRole, targetRole === 'bcs' ? selectedOfficer : null, rememberDevice);
      }
      setSuccessMsg(targetRole === 'gvcn' 
        ? 'Đăng nhập GVCN thành công! Bạn có TOÀN QUYỀN quản trị.' 
        : `Đăng nhập thành công với vai trò: ${selectedOfficer.roleTitle} (${selectedOfficer.name})!`
      );
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      playGentleReminder(soundEnabled);
      setErrorMsg('Mã PIN không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  const handleDirectOfficerLogin = (off: ActiveOfficer) => {
    playFanfare(soundEnabled);
    setSelectedOfficer(off);
    if (onSelectOfficer) onSelectOfficer(off);
    onSelectRole('bcs');
    if (onSuccessLogin) {
      onSuccessLogin('bcs', off, rememberDevice);
    }
    setSuccessMsg(`Đăng nhập thành công: ${off.roleTitle} (${off.name})!`);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const fillDefaultPin = () => {
    playClick(soundEnabled);
    const defaultPin = targetRole === 'gvcn' ? (settings.gvcnPin || '123456') : (settings.bcsPin || '1234');
    setPinInput(defaultPin);
    setErrorMsg('');
  };

  return (
    <div className={`fixed inset-0 z-50 p-4 flex items-center justify-center animate-fade-in ${
      isMandatory 
        ? 'bg-slate-950/90 backdrop-blur-md' 
        : 'bg-slate-900/60 backdrop-blur-xs'
    }`}>
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {isMandatory ? 'CỔNG ĐĂNG NHẬP' : 'QUẢN TRỊ VIÊN'}
                </span>
                <span className="text-xs text-indigo-200">
                  Năm học {settings.academicYear}
                </span>
              </div>
              <h3 className="text-lg font-black font-['Nunito',sans-serif]">
                {isMandatory ? 'ĐĂNG NHẬP VÀO ỨNG DỤNG' : 'CHẾ ĐỘ SỬ DỤNG TRÊN MÁY'}
              </h3>
              <p className="text-xs text-indigo-100">
                {settings.className} - {settings.schoolName} • GVCN: <b className="text-white">{settings.teacherName}</b>
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="px-5 pt-4 text-sm text-blue-900">Các chế độ và PIN dưới đây chỉ dùng trên tài khoản Google đang mở. Không cấp quyền Firebase cho tài khoản Google khác.</p>
        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scroll flex-1">
          
          {/* CURRENT STATUS OR MANDATORY BANNER */}
          {isMandatory ? (
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="text-xs text-indigo-950">
                <div className="font-bold text-slate-900">Bắt buộc đăng nhập khi vào ứng dụng</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Vui lòng chọn vai trò của bạn dưới đây để bắt đầu làm việc hoặc xem bảng thi đua.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Đang đăng nhập:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${ROLE_DEFINITIONS[currentRole].badgeBg} ${ROLE_DEFINITIONS[currentRole].badgeText} ${ROLE_DEFINITIONS[currentRole].badgeBorder}`}>
                  {ROLE_DEFINITIONS[currentRole].title}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    onLogout();
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          )}

          {/* ROLE SELECT CARDS */}
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Chọn vai trò đăng nhập:
            </div>

            {/* 1. GVCN Card */}
            <div
              onClick={() => handleRoleCardClick('gvcn')}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                targetRole === 'gvcn'
                  ? 'border-amber-400 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                targetRole === 'gvcn' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'
              }`}>
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Giáo Viên Chủ Nhiệm (GVCN)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200 text-amber-900">
                    TOÀN QUYỀN
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Toàn quyền hệ thống: Đánh giá cho điểm, quản lý học sinh, cài đặt hệ thống, xóa và đặt lại điểm tuần.
                </p>
              </div>
            </div>

            {/* 2. Ban Cán Sự Card */}
            <div
              onClick={() => handleRoleCardClick('bcs')}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                targetRole === 'bcs'
                  ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                targetRole === 'bcs' ? 'bg-emerald-500 text-white font-black' : 'bg-slate-100 text-slate-600'
              }`}>
                <Star className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Ban Cán Sự Lớp</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
                    CHO ĐIỂM & TIỆN ÍCH
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Được quyền đánh giá xếp loại cho điểm mỗi loại (cộng/trừ), quay số may mắn, đồng hồ đếm ngược, điểm danh.
                </p>
              </div>
            </div>

            {/* 3. Viewer Card */}
            <div
              onClick={() => handleRoleCardClick('viewer')}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                targetRole === 'viewer'
                  ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                targetRole === 'viewer' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-600'
              }`}>
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">
                    Chế Độ Trình Chiếu (Chỉ Xem)
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                    KHÔNG CẦN PIN
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Trình chiếu an toàn trên màn hình Tivi hoặc gửi máy tính lớp học, không cho phép sửa đổi điểm số.
                </p>
              </div>
            </div>
          </div>

          {/* PIN INPUT FORM (If not viewer) */}
          {targetRole !== 'viewer' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              
              {/* CHOOSE OFFICER (IF BCS) */}
              {targetRole === 'bcs' && (
                <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Chọn danh tính Cán bộ lớp / Tổ trưởng:</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                      Tổ {selectedOfficer.group || 'Toàn lớp'}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    ⚡ <b>Chế độ 1-chạm:</b> Bấm trực tiếp vào tên bạn dưới đây để vào chấm điểm ngay, không cần gõ mã PIN!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scroll pr-1">
                    {DEFAULT_CLASS_OFFICERS.map((off, idx) => {
                      const isChosen = selectedOfficer.roleTitle === off.roleTitle && selectedOfficer.name === off.name;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            playClick(soundEnabled);
                            setSelectedOfficer(off);
                          }}
                          className={`p-2 rounded-xl text-left border text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                            isChosen
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold ring-2 ring-emerald-400/50'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          <div className="min-w-0 pr-1 truncate">
                            <div className="font-bold truncate text-[11px] flex items-center gap-1">
                              <span>{off.roleTitle.includes('Lớp trưởng') ? '👑' : off.roleTitle.includes('Lớp phó') ? '⭐' : '🌿'}</span>
                              <span>{off.roleTitle}</span>
                            </div>
                            <div className={`text-[10px] truncate ${isChosen ? 'text-emerald-100' : 'text-slate-600 font-medium'}`}>
                              {off.name}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {off.group && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                isChosen ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                Tổ {off.group}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectOfficerLogin(off);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-0.5 shadow-2xs ${
                                isChosen
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              }`}
                              title={`Vào ngay với vai trò ${off.name}`}
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>Vào ngay</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {settings.allowBcsScoring === false && (
                    <div className="p-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 mt-2">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>GVCN đang tạm khóa quyền nhập điểm của Cán bộ lớp.</span>
                    </div>
                  )}

                  {/* QUICK 1-TOUCH ENTER BUTTON FOR SELECTED OFFICER */}
                  <button
                    type="button"
                    onClick={() => handleDirectOfficerLogin(selectedOfficer)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Vào Chấm Điểm 1-Chạm: {selectedOfficer.roleTitle} ({selectedOfficer.name})</span>
                  </button>
                </div>
              )}

              {/* PIN INPUT (ONLY FOR GVCN OR IF BCS REQUIRES PIN) */}
              {(targetRole === 'gvcn' || settings.requireBcsPin === true) && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        Nhập mã PIN {targetRole === 'gvcn' ? 'GVCN' : 'Cán Bộ Lớp'}:
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={fillDefaultPin}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Gợi ý PIN mặc định ({targetRole === 'gvcn' ? '123456' : '1234'})
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder={`Nhập mã PIN ${targetRole === 'gvcn' ? '6 số của GVCN' : '4 số của Ban cán sự'}...`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* REMEMBER DEVICE OPTION */}
              <div className="pt-0.5 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  targetRole === 'gvcn'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {targetRole === 'gvcn' 
                    ? 'Xác Nhận Đăng Nhập GVCN (Mã 123456)' 
                    : `Xác Nhận Đăng Nhập: ${selectedOfficer.roleTitle} (${selectedOfficer.name})`}
                </span>
              </button>
            </form>
          ) : (
            <div className="pt-2 space-y-3">
              {/* REMEMBER DEVICE OPTION FOR VIEWER */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleLoginSubmit}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isMandatory ? 'Đăng Nhập Chế Độ Trình Chiếu (Xem Điểm)' : 'Chuyển Sang Chế Độ Trình Chiếu (Xem)'}</span>
              </button>
            </div>
          )}

          {/* HELP NOTE */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <b>Lưu ý:</b> GVCN có thể thay đổi mã PIN đăng nhập của GVCN và Ban Cán Sự bất kỳ lúc nào trong mục <b>Cài đặt</b>.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
