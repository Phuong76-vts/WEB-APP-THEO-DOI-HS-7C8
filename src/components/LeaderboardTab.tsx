import React from 'react';
import { Student, ClassSettings, RANK_TIERS } from '../types';
import { getRankTier, exportToCSV } from '../utils/storage';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Medal, 
  FileSpreadsheet, 
  BarChart3, 
  Flame,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playFanfare, playClick } from '../utils/audio';

interface LeaderboardTabProps {
  students: Student[];
  settings: ClassSettings;
  onOpenScoreModal: (student: Student) => void;
  soundEnabled: boolean;
  currentMonthName?: string;
  isArchived?: boolean;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  students,
  settings,
  onOpenScoreModal,
  soundEnabled,
  currentMonthName,
  isArchived
}) => {
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);
  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  // Group Stats
  const groups: Array<'1' | '2' | '3' | '4'> = ['1', '2', '3', '4'];
  const groupStats = groups.map((gId) => {
    const members = students.filter(s => s.group === gId);
    const totalPoints = members.reduce((sum, s) => sum + s.points, 0);
    const avgPoints = members.length ? Number((totalPoints / members.length).toFixed(1)) : 0;
    return {
      groupId: gId,
      totalPoints,
      avgPoints,
      memberCount: members.length
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const maxGroupPoints = Math.max(...groupStats.map(g => g.totalPoints), 1);

  const handleTriggerConfetti = () => {
    playFanfare(soundEnabled);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleExportCSV = () => {
    playClick(soundEnabled);
    exportToCSV(students, settings);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. PODIUM TOP 3 CELEBRATION */}
      <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-700/50">
        
        {/* Background glow & subtle pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="text-center relative z-10 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black mb-2 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>VINH DANH NGÔI SAO {settings.className}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Nunito',sans-serif] tracking-wide text-white">
            {currentMonthName ? `TOP 3 XUẤT SẮC - ${currentMonthName.toUpperCase()}` : 'BỤC VINH DANH TOP 3 XUẤT SẮC NHẤT'}
            {isArchived ? ' (ĐÃ CHỐT)' : ''}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Ghi nhận những nỗ lực học tập và rèn luyện thi đua nổi bật nhất
          </p>
        </div>

        {/* Podium Pillars */}
        {sortedStudents.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-2xl mx-auto items-end pt-4 pb-2 relative z-10">
            
            {/* TOP 2 (SILVER) */}
            <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl mb-1">
                {top2.gender === 'female' ? '👧' : '👦'}
              </div>
              <div className="font-bold text-xs sm:text-sm text-center truncate max-w-[95px] sm:max-w-[160px] text-slate-200">
                {top2.name}
              </div>
              <div className="text-xs font-black text-slate-300">
                {top2.points} điểm
              </div>
              <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-2xl flex flex-col items-center justify-center text-slate-900 font-black shadow-lg mt-2 border-t-2 border-slate-200">
                <span className="text-xl sm:text-2xl">🥈</span>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-slate-800">
                  HẠNG 2
                </span>
              </div>
            </div>

            {/* TOP 1 (GOLD) */}
            <div className="flex flex-col items-center">
              <Crown className="w-7 h-7 text-amber-300 animate-bounce mb-1 drop-shadow-md" />
              <div className="text-4xl sm:text-5xl mb-1">
                {top1.gender === 'female' ? '👧' : '👦'}
              </div>
              <div className="font-black text-xs sm:text-base text-center truncate max-w-[110px] sm:max-w-[180px] text-amber-300">
                {top1.name}
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-400">
                {top1.points} điểm
              </div>
              <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 rounded-t-2xl flex flex-col items-center justify-center text-slate-950 font-black shadow-2xl mt-2 border-t-2 border-yellow-100">
                <span className="text-2xl sm:text-3xl">🥇</span>
                <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-950">
                  QUÁN QUÂN
                </span>
              </div>
            </div>

            {/* TOP 3 (BRONZE) */}
            <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl mb-1">
                {top3.gender === 'female' ? '👧' : '👦'}
              </div>
              <div className="font-bold text-xs sm:text-sm text-center truncate max-w-[95px] sm:max-w-[160px] text-slate-200">
                {top3.name}
              </div>
              <div className="text-xs font-black text-amber-200">
                {top3.points} điểm
              </div>
              <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-2xl flex flex-col items-center justify-center text-amber-100 font-black shadow-lg mt-2 border-t-2 border-amber-600">
                <span className="text-xl sm:text-2xl">🥉</span>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-amber-100">
                  HẠNG 3
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Confetti Trigger Button */}
        <div className="text-center mt-6 relative z-10">
          <button
            onClick={handleTriggerConfetti}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Bắn Pháo Hoa Vinh Danh 🎉</span>
          </button>
        </div>

      </div>

      {/* 2. GROUP RANKINGS & TIER SYSTEM (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GROUP COMPETITION (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  BẢNG XẾP HẠNG THI ĐUA 4 TỔ
                </h3>
                <p className="text-xs text-slate-500">Tự động tổng hợp và tính điểm trung bình từng tổ</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              4 Tổ thi đua
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {groupStats.map((grp, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';
              const percent = Math.min(100, Math.round((grp.totalPoints / maxGroupPoints) * 100));

              return (
                <div
                  key={grp.groupId}
                  className={`p-4 rounded-2xl border transition ${
                    idx === 0
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80'
                  } flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{medal}</span>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">TỔ {grp.groupId}</h4>
                        <span className="text-[11px] text-slate-500">{grp.memberCount} thành viên</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Hạng {idx + 1}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-slate-500">Tổng điểm: <b className="text-indigo-700 text-sm">{grp.totalPoints}đ</b></span>
                      <span className="text-slate-600 font-bold">TB: {grp.avgPoints}đ/bạn</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIER TIERS GUIDE (1 col) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                HỆ THỐNG DANH HIỆU
              </h3>
              <p className="text-xs text-slate-500">Tự động thăng cấp theo điểm tích lũy</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {RANK_TIERS.slice().reverse().map((tier) => (
              <div
                key={tier.id}
                className={`p-3 rounded-2xl border ${tier.badgeBg} flex items-center justify-between`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <div className={`font-black text-xs sm:text-sm ${tier.badgeText}`}>
                      {tier.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{tier.description}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-white/80 border border-slate-200 text-slate-800 shadow-xs shrink-0">
                  {tier.maxPoints ? `${tier.minPoints === -999 ? '< 15' : `${tier.minPoints} - ${tier.maxPoints}`} đ` : `≥ ${tier.minPoints} đ`}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. FULL LEADERBOARD TABLE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <span>BẢNG TỔNG SẮP THI ĐUA TOÀN BỘ LỚP {settings.className} {currentMonthName ? `• ${currentMonthName}` : ''}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách xếp hạng thi đua được sắp xếp tự động theo điểm số
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất File CSV / Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
                <th className="py-3 px-3 text-center w-14">Hạng</th>
                <th className="py-3 px-3">Học sinh</th>
                <th className="py-3 px-3 text-center">Tổ</th>
                <th className="py-3 px-3">Chức vụ</th>
                <th className="py-3 px-3 text-center">Danh hiệu</th>
                <th className="py-3 px-3 text-right">Tổng điểm</th>
                <th className="py-3 px-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.map((st, idx) => {
                const tier = getRankTier(st.points);
                const rankBadge = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : (idx + 1);

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className={`py-3 px-3 text-center font-bold ${
                      idx < 3 ? 'text-amber-600 font-black' : 'text-slate-500'
                    }`}>
                      {rankBadge}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2.5">
                      <span className="text-xl shrink-0">
                        {st.gender === 'female' ? '👧' : '👦'}
                      </span>
                      <span className="truncate">{st.name}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        Tổ {st.group}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 text-xs font-medium truncate">
                      {st.role}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${tier.badgeBg} ${tier.badgeText}`}>
                        <span>{tier.icon}</span>
                        <span>{tier.name}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-black text-indigo-600 text-base">
                      {st.points}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onOpenScoreModal(st)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                      >
                        Ghi điểm
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
