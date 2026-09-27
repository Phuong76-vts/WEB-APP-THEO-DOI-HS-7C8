import React, { useState, useEffect } from 'react';
import { ClassSettings, UserRole, ROLE_DEFINITIONS, ActiveOfficer } from '../types';
import { 
  Users, 
  Trophy, 
  ClipboardCheck, 
  Wand2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Download, 
  GraduationCap,
  Crown,
  Star,
  Eye,
  ShieldCheck,
  BookOpen,
  LogOut,
  CalendarDays
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface HeaderProps {
  settings: ClassSettings;
  activeTab: 'classroom' | 'leaderboard' | 'attendance' | 'utilities' | 'rules';
  onTabChange: (tab: 'classroom' | 'leaderboard' | 'attendance' | 'utilities' | 'rules') => void;
  totalStudents: number;
  totalRules?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onExportStandaloneHtml: () => void;
  currentRole: UserRole;
  onOpenLogin: () => void;
  onLogout?: () => void;
  activeOfficer?: ActiveOfficer | null;
  currentMonthName?: string;
  onOpenMonthArchive?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  onTabChange,
  totalStudents,
  totalRules,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onExportStandaloneHtml,
  currentRole,
  onOpenLogin,
  onLogout,
  activeOfficer,
  currentMonthName,
  onOpenMonthArchive
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFullscreen = () => {
    playClick(soundEnabled);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white shadow-lg sticky top-0 z-40 border-b border-indigo-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3.5 pb-2">
        {/* TOP ROW */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
          
          {/* BRAND & CLASS INFO */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <GraduationCap className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black font-['Nunito',sans-serif] tracking-wide text-white drop-shadow-xs">
                  {settings.className} - {settings.schoolName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-900 shadow-xs">
                  NĂM HỌC {settings.academicYear}
                </span>
                {currentMonthName && (
                  <button
                    onClick={() => {
                      playClick(soundEnabled);
                      if (onOpenMonthArchive) onOpenMonthArchive();
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 hover:bg-white/30 text-amber-200 border border-white/20 shadow-xs flex items-center gap-1 transition cursor-pointer"
                    title="Nhấn để xem kho lưu trữ và báo cáo thi đua theo tháng"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
                    <span>{currentMonthName}</span>
                  </button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-indigo-100 flex items-center gap-2.5 mt-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-amber-300 font-bold">GVCN:</span>
                  <span className="text-white font-bold">{settings.teacherName}</span>
                </span>
                <span className="opacity-40">|</span>
                <span className="font-mono text-xs opacity-90 bg-indigo-900/40 px-2 py-0.5 rounded-md border border-white/10">
                  {timeStr}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            
            {/* ROLE BADGE & AUTH SWITCH */}
            <button
              onClick={() => {
                playClick(soundEnabled);
                onOpenLogin();
              }}
              title="Nhấp để đăng nhập hoặc chuyển đổi vai trò (GVCN / Ban cán sự / Chế độ xem)"
              className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                currentRole === 'gvcn'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 ring-2 ring-amber-300/40'
                  : currentRole === 'bcs'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-400 ring-2 ring-emerald-300/40'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
              }`}
            >
              {currentRole === 'gvcn' && <Crown className="w-4 h-4 text-slate-950" />}
              {currentRole === 'bcs' && <Star className="w-4 h-4 text-amber-200 fill-amber-200" />}
              {currentRole === 'viewer' && <Eye className="w-4 h-4 text-slate-300" />}

              <span>
                {currentRole === 'gvcn' 
                  ? 'GVCN: Toàn quyền' 
                  : currentRole === 'bcs' 
                  ? (activeOfficer ? `${activeOfficer.roleTitle}: ${activeOfficer.name.split(' ').pop()}` : 'Ban Cán Sự: Cho điểm') 
                  : 'Chế độ xem'}
              </span>
              <span className="text-[10px] opacity-75 underline font-normal hidden sm:inline ml-0.5">
                (Đổi)
              </span>
            </button>

            {/* LOGOUT BUTTON */}
            {onLogout && (
              <button
                onClick={() => {
                  playClick(soundEnabled);
                  onLogout();
                }}
                title="Đăng xuất khỏi hệ thống và khóa màn hình đăng nhập"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/90 text-white border border-white/20 hover:border-rose-400 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            )}

            {/* Standalone HTML download */}
            <button
              onClick={() => {
                playClick(soundEnabled);
                onExportStandaloneHtml();
              }}
              title="Tải về 1 file HTML duy nhất để mở đúp chuột chạy offline bất kỳ đâu"
              className="px-3 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 border border-emerald-400/50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Tải File HTML Độc Lập</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Tắt âm thanh tương tác' : 'Bật âm thanh tương tác'}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Âm thanh: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">Âm thanh: Tắt</span>
                </>
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={handleToggleFullscreen}
              title="Trình chiếu toàn màn hình trên Tivi hoặc máy chiếu"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-sky-300" />
                  <span className="hidden md:inline">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-sky-300" />
                  <span className="hidden md:inline">Toàn màn hình</span>
                </>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                playClick(soundEnabled);
                onOpenSettings();
              }}
              title="Cài đặt thông tin lớp & quản lý dữ liệu"
              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </button>

          </div>
        </div>

        {/* 4 TABS NAVIGATION */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto text-xs sm:text-sm font-bold no-scrollbar pt-1">
          
          <button
            onClick={() => {
              playClick(soundEnabled);
              onTabChange('classroom');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition border-b-4 cursor-pointer ${
              activeTab === 'classroom'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>1. LỚP HỌC & GHI ĐIỂM</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white text-indigo-900 font-black shadow-xs">
              {totalStudents}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              onTabChange('leaderboard');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition border-b-4 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>2. BẢNG VÀNG THI ĐUA</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              onTabChange('attendance');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition border-b-4 cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-300" />
            <span>3. ĐIỂM DANH & CHUYÊN CẦN</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              onTabChange('utilities');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition border-b-4 cursor-pointer ${
              activeTab === 'utilities'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 text-pink-300" />
            <span>4. BỘ TIỆN ÍCH TƯƠNG TÁC</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              onTabChange('rules');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl transition border-b-4 cursor-pointer ${
              activeTab === 'rules'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-300" />
            <span>5. NỘI QUY & BAREM (RULES)</span>
            {totalRules !== undefined && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-400 text-slate-950 font-black shadow-xs">
                {totalRules}
              </span>
            )}
          </button>

        </nav>
      </div>
    </header>
  );
};
