import React, { useState, useEffect, useRef } from 'react';
import { Student, PointLog, AttendanceRecord, GroupId, UserRole } from '../types';
import { 
  Sparkles, 
  RotateCw, 
  Play, 
  Pause, 
  RotateCcw, 
  Users, 
  Shuffle, 
  Clock, 
  History, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playTingTing, playWheelTick, playFanfare, playTimerAlert, playClick } from '../utils/audio';

interface UtilitiesTabProps {
  students: Student[];
  attendance: Record<string, AttendanceRecord>;
  pointLogs: PointLog[];
  onAddScore: (studentId: string, points: number, reason: string) => void;
  onClearLogs: () => void;
  soundEnabled: boolean;
  currentRole: UserRole;
  onOpenLogin: () => void;
}

const TEAM_NAMES = [
  { name: 'Biệt Đội Rồng Lửa', icon: '🐉', color: 'from-rose-500 to-red-600', border: 'border-rose-200', bg: 'bg-rose-50/50' },
  { name: 'Chiến Binh Phượng Hoàng', icon: '🦅', color: 'from-amber-500 to-orange-600', border: 'border-amber-200', bg: 'bg-amber-50/50' },
  { name: 'Biệt Đội Sao Băng', icon: '⭐', color: 'from-blue-500 to-indigo-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
  { name: 'Đội Thần Tốc', icon: '⚡', color: 'from-emerald-500 to-teal-600', border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
  { name: 'Hiệp Sĩ Ánh Sáng', icon: '🛡️', color: 'from-purple-500 to-indigo-600', border: 'border-purple-200', bg: 'bg-purple-50/50' },
  { name: 'Đại Bàng Xanh', icon: '🦅', color: 'from-sky-500 to-cyan-600', border: 'border-sky-200', bg: 'bg-sky-50/50' }
];

export const UtilitiesTab: React.FC<UtilitiesTabProps> = ({
  students,
  attendance,
  pointLogs,
  onAddScore,
  onClearLogs,
  soundEnabled,
  currentRole,
  onOpenLogin
}) => {
  // --- 1. RANDOM PICKER STATE ---
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<Student | null>(null);
  const [tempDisplayStudent, setTempDisplayStudent] = useState<Student | null>(null);
  const [wheelGroupFilter, setWheelGroupFilter] = useState<string>('all');
  const [wheelOnlyPresent, setWheelOnlyPresent] = useState(true);

  // --- 2. TIMER STATE ---
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(180); // default 3 min
  const [timerRemaining, setTimerRemaining] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 3. TEAMS STATE ---
  const [numTeams, setNumTeams] = useState<number>(4);
  const [generatedTeams, setGeneratedTeams] = useState<Array<{ name: string; icon: string; color: string; border: string; bg: string; members: Student[] }>>([]);

  // Setup initial teams on load
  useEffect(() => {
    handleGenerateTeams(numTeams);
  }, [students, numTeams]);

  // Timer interval cleanup
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            playTimerAlert(soundEnabled);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, soundEnabled]);

  // --- RANDOM WHEEL HANDLER ---
  const handleSpinWheel = () => {
    if (isSpinning || students.length === 0) return;

    let pool = students.filter((s) => {
      if (wheelGroupFilter !== 'all' && s.group !== wheelGroupFilter) return false;
      if (wheelOnlyPresent && attendance[s.id]?.status !== 'present' && attendance[s.id]?.status) return false;
      return true;
    });

    if (pool.length === 0) pool = students;

    setIsSpinning(true);
    setWheelWinner(null);

    let counter = 0;
    const totalSteps = 28;
    const interval = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setTempDisplayStudent(rand);
      playWheelTick(soundEnabled);
      counter++;

      if (counter >= totalSteps) {
        clearInterval(interval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setWheelWinner(finalPick);
        setTempDisplayStudent(finalPick);
        setIsSpinning(false);
        playFanfare(soundEnabled);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }, 85);
  };

  // --- TIMER HANDLERS ---
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSetTimerPreset = (seconds: number) => {
    playClick(soundEnabled);
    setIsTimerRunning(false);
    setTimerTotalSeconds(seconds);
    setTimerRemaining(seconds);
  };

  const handleToggleTimer = () => {
    playClick(soundEnabled);
    if (!isTimerRunning && timerRemaining === 0) {
      setTimerRemaining(timerTotalSeconds);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    playClick(soundEnabled);
    setIsTimerRunning(false);
    setTimerRemaining(timerTotalSeconds);
  };

  // --- TEAM SPLITTER HANDLER ---
  const handleGenerateTeams = (teamCount: number) => {
    playClick(soundEnabled);
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const teams = Array.from({ length: teamCount }, (_, i) => ({
      name: TEAM_NAMES[i]?.name || `Nhóm ${i + 1}`,
      icon: TEAM_NAMES[i]?.icon || '👥',
      color: TEAM_NAMES[i]?.color || 'from-indigo-500 to-indigo-700',
      border: TEAM_NAMES[i]?.border || 'border-indigo-200',
      bg: TEAM_NAMES[i]?.bg || 'bg-indigo-50/50',
      members: [] as Student[]
    }));

    shuffled.forEach((student, idx) => {
      teams[idx % teamCount].members.push(student);
    });

    setGeneratedTeams(teams);
  };

  return (
    <div className="space-y-8">
      
      {/* 2 MAIN CARDS: LUCKY WHEEL & TIMER (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* UTILITY 1: LUCKY WHEEL / RANDOM PICKER */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg shadow-inner">
                🎯
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  VÒNG QUAY MAY MẮN
                </h3>
                <p className="text-xs text-slate-500">Gọi tên ngẫu nhiên học sinh lên bảng</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              Pháo hoa & Âm thanh
            </span>
          </div>

          {/* Wheel / Slot Display */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-full max-w-sm h-48 rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-4 border-amber-400/80 shadow-2xl flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
              <div className="text-4xl mb-1.5 animate-pulse-subtle">
                {tempDisplayStudent ? (tempDisplayStudent.gender === 'female' ? '👧' : '👦') : '🎯'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-['Nunito',sans-serif] tracking-wide truncate max-w-full px-2">
                {tempDisplayStudent ? tempDisplayStudent.name : 'SẴN SÀNG QUAY'}
              </div>
              <div className="text-xs sm:text-sm text-indigo-300 font-semibold mt-1">
                {tempDisplayStudent
                  ? `Tổ ${tempDisplayStudent.group} • ${tempDisplayStudent.role}`
                  : 'Bấm nút bốc thăm để bắt đầu'}
              </div>

              {wheelWinner && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                    TRÚNG THƯỞNG 🎉
                  </span>
                </div>
              )}
            </div>

            {/* Quick Reward Buttons for Winner */}
            {wheelWinner && (
              <div className="mt-3 flex items-center gap-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-600">Thưởng nhanh cho bạn:</span>
                <button
                  onClick={() => {
                    if (currentRole === 'viewer') {
                      alert('Chế độ trình chiếu không được ghi điểm. Vui lòng đăng nhập quyền Ban Cán Sự hoặc GVCN!');
                      onOpenLogin();
                      return;
                    }
                    onAddScore(wheelWinner.id, 2, 'Lên bảng phát biểu xuất sắc');
                    playTingTing(soundEnabled);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" /> +2đ
                </button>
                <button
                  onClick={() => {
                    if (currentRole === 'viewer') {
                      alert('Chế độ trình chiếu không được ghi điểm. Vui lòng đăng nhập quyền Ban Cán Sự hoặc GVCN!');
                      onOpenLogin();
                      return;
                    }
                    onAddScore(wheelWinner.id, 5, 'Giải bài tập xuất sắc');
                    playTingTing(soundEnabled);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" /> +5đ
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelOnlyPresent}
                  onChange={(e) => setWheelOnlyPresent(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Chỉ bốc thăm bạn có mặt</span>
              </label>

              <select
                value={wheelGroupFilter}
                onChange={(e) => setWheelGroupFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả các Tổ</option>
                <option value="1">Chỉ Tổ 1</option>
                <option value="2">Chỉ Tổ 2</option>
                <option value="3">Chỉ Tổ 3</option>
                <option value="4">Chỉ Tổ 4</option>
              </select>
            </div>

            <button
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 active:scale-98 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'ĐANG BỐC THĂM...' : 'BỐC THĂM NGAY!'}</span>
            </button>
          </div>

        </div>

        {/* UTILITY 2: SMART COUNTDOWN TIMER */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-inner">
                ⏱️
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  ĐỒNG HỒ ĐẾM NGƯỢC
                </h3>
                <p className="text-xs text-slate-500">Hẹn giờ thảo luận nhóm & làm bài tập</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Chuông báo 3 hồi
            </span>
          </div>

          {/* Big Digital Display */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-full max-w-sm h-48 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-4 border-indigo-500/80 shadow-2xl flex flex-col items-center justify-center text-center p-4">
              <div className={`font-mono text-5xl sm:text-6xl font-black tracking-widest drop-shadow-md ${
                timerRemaining <= 10 && timerRemaining > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}>
                {formatTime(timerRemaining)}
              </div>
              <div className="text-xs font-bold text-indigo-200 mt-2 uppercase tracking-widest">
                {timerRemaining === 0 ? '⏰ HẾT GIỜ LÀM BÀI!' : isTimerRunning ? 'Đang đếm ngược...' : 'Thời gian thảo luận'}
              </div>
            </div>
          </div>

          {/* Presets & Controls */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1 Phút', sec: 60 },
                { label: '3 Phút', sec: 180 },
                { label: '5 Phút', sec: 300 },
                { label: '10 Phút', sec: 600 }
              ].map((preset) => (
                <button
                  key={preset.sec}
                  onClick={() => handleSetTimerPreset(preset.sec)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    timerTotalSeconds === preset.sec && !isTimerRunning
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-3 rounded-2xl font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Bắt Đầu</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* UTILITY 3: RANDOM TEAM GENERATOR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
              👥
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                CHIA NHÓM TỰ ĐỘNG (HOẠT ĐỘNG TRẢI NGHIỆM / STEM)
              </h3>
              <p className="text-xs text-slate-500">
                Xáo trộn ngẫu nhiên toàn bộ học sinh thành các nhóm cân bằng
              </p>
            </div>
          </div>

          {/* Team count selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>Số nhóm:</span>
              <div className="flex items-center gap-1">
                {[2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setNumTeams(count);
                      handleGenerateTeams(count);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      numTeams === count
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerateTeams(numTeams)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo Trộn Lại</span>
            </button>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {generatedTeams.map((team, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${team.border} ${team.bg} flex flex-col justify-between space-y-3 shadow-xs`}
            >
              <div className="border-b border-slate-200/60 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{team.icon}</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{team.name}</h4>
                    <span className="text-[11px] text-slate-500 font-medium">Nhóm {idx + 1}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 shadow-xs">
                  {team.members.length} bạn
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-700">
                {team.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{m.gender === 'female' ? '👧' : '👦'}</span>
                      <span className="font-semibold truncate">{m.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-1">
                      T{m.group}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* UTILITY 4: POINT LOGS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
              📜
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                NHẬT KÝ GHI ĐIỂM THI ĐUA HÔM NAY
              </h3>
              <p className="text-xs text-slate-500">Lịch sử khen thưởng và nhắc nhở chi tiết</p>
            </div>
          </div>

          {pointLogs.length > 0 && (
            <button
              onClick={() => {
                if (currentRole !== 'gvcn') {
                  alert('Chỉ Giáo Viên Chủ Nhiệm (GVCN) mới có quyền xóa nhật ký điểm thi đua!');
                  onOpenLogin();
                  return;
                }
                if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử ghi điểm?')) {
                  onClearLogs();
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-600 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa nhật ký</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto custom-scroll pr-1">
          {pointLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              Chưa có lượt chấm điểm nào trong hôm nay.
            </div>
          ) : (
            pointLogs.slice(0, 40).map((log) => {
              const isPositive = log.points > 0;
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 rounded-xl text-xs font-black shrink-0 ${
                      isPositive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {isPositive ? `+${log.points}` : log.points}đ
                    </span>

                    <div className="truncate">
                      <span className="font-bold text-slate-800">{log.studentName}</span>
                      <span className="text-slate-500 font-medium"> (Tổ {log.group})</span>
                      <span className="text-slate-400 font-normal"> — {log.reason}</span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {timeFormatted}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
