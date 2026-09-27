import React, { useState } from 'react';
import { Student, GroupId, ActiveOfficer } from '../types';
import { 
  X, 
  ArrowLeftRight, 
  Users, 
  Search, 
  Check, 
  Sparkles, 
  UserCheck,
  ShieldCheck,
  ChevronRight,
  MoveRight
} from 'lucide-react';
import { playClick, playFanfare } from '../utils/audio';

interface GroupTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onChangeGroup: (studentId: string, newGroup: GroupId) => void;
  onSwapGroups: (studentId1: string, studentId2: string) => void;
  soundEnabled: boolean;
}

const GROUP_CONFIG: Record<GroupId, { name: string; color: string; bgLight: string; border: string; badge: string; text: string }> = {
  '1': {
    name: 'Tổ 1',
    color: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-900'
  },
  '2': {
    name: 'Tổ 2',
    color: 'from-blue-600 to-indigo-700',
    bgLight: 'bg-blue-50/70',
    border: 'border-blue-200',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-900'
  },
  '3': {
    name: 'Tổ 3',
    color: 'from-purple-600 to-fuchsia-700',
    bgLight: 'bg-purple-50/70',
    border: 'border-purple-200',
    badge: 'bg-purple-600 text-white',
    text: 'text-purple-900'
  },
  '4': {
    name: 'Tổ 4',
    color: 'from-amber-600 to-orange-700',
    bgLight: 'bg-amber-50/70',
    border: 'border-amber-200',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-900'
  }
};

export const GroupTransferModal: React.FC<GroupTransferModalProps> = ({
  isOpen,
  onClose,
  students,
  onChangeGroup,
  onSwapGroups,
  soundEnabled
}) => {
  const [activeTabGroup, setActiveTabGroup] = useState<GroupId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForMove, setSelectedStudentForMove] = useState<Student | null>(null);
  
  // Swap mode states
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [swapStudent1, setSwapStudent1] = useState<Student | null>(null);
  const [swapStudent2, setSwapStudent2] = useState<Student | null>(null);
  const [recentActionMsg, setRecentActionMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setRecentActionMsg(msg);
    setTimeout(() => {
      setRecentActionMsg(null);
    }, 3500);
  };

  const handleStudentClick = (student: Student) => {
    playClick(soundEnabled);
    if (isSwapMode) {
      if (!swapStudent1) {
        setSwapStudent1(student);
      } else if (swapStudent1.id === student.id) {
        // Deselect
        setSwapStudent1(null);
      } else if (!swapStudent2) {
        if (swapStudent1.group === student.group) {
          showFeedback(`⚠️ ${student.name} cũng cùng Tổ ${student.group}. Vui lòng chọn 1 bạn ở tổ khác để hoán đổi!`);
          return;
        }
        setSwapStudent2(student);
      } else if (swapStudent2.id === student.id) {
        setSwapStudent2(null);
      } else {
        // Replace second student
        if (swapStudent1.group === student.group) {
          setSwapStudent1(student);
          setSwapStudent2(null);
        } else {
          setSwapStudent2(student);
        }
      }
    } else {
      if (selectedStudentForMove?.id === student.id) {
        setSelectedStudentForMove(null);
      } else {
        setSelectedStudentForMove(student);
      }
    }
  };

  const handleExecuteMove = (targetGroup: GroupId) => {
    if (!selectedStudentForMove) return;
    if (selectedStudentForMove.group === targetGroup) {
      showFeedback(`${selectedStudentForMove.name} đã ở sẵn Tổ ${targetGroup}!`);
      return;
    }

    playFanfare(soundEnabled);
    const oldGroup = selectedStudentForMove.group;
    onChangeGroup(selectedStudentForMove.id, targetGroup);
    showFeedback(`Đã chuyển bạn "${selectedStudentForMove.name}" từ Tổ ${oldGroup} sang Tổ ${targetGroup} thành công!`);
    setSelectedStudentForMove(null);
  };

  const handleExecuteSwap = () => {
    if (!swapStudent1 || !swapStudent2) return;
    if (swapStudent1.group === swapStudent2.group) {
      showFeedback('Hai bạn đang cùng một tổ, không thể hoán đổi chéo tổ!');
      return;
    }

    playFanfare(soundEnabled);
    const s1Name = swapStudent1.name;
    const s1OldGroup = swapStudent1.group;
    const s2Name = swapStudent2.name;
    const s2OldGroup = swapStudent2.group;

    onSwapGroups(swapStudent1.id, swapStudent2.id);
    showFeedback(`Hoán đổi thành công: [${s1Name} sang Tổ ${s2OldGroup}] ⇄ [${s2Name} sang Tổ ${s1OldGroup}]!`);
    setSwapStudent1(null);
    setSwapStudent2(null);
  };

  const getGroupMembers = (gid: GroupId) => {
    return students.filter(s => {
      const matchGroup = s.group === gid;
      const matchSearch = !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchGroup && matchSearch;
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-5xl w-full h-[92vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-teal-700 via-indigo-700 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner font-black text-amber-300">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  QUẢN LÝ & ĐỔI THÀNH VIÊN GIỮA CÁC TỔ
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-2xs">
                  {students.length} Học Sinh
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Chuyển tổ nhanh chóng cho từng bạn hoặc hoán đổi vị trí chéo giữa 2 thành viên của 2 tổ.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {recentActionMsg && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-inner animate-pulse shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{recentActionMsg}</span>
          </div>
        )}

        {/* TOOLBAR: SEARCH & MODE TOGGLE */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* MODE SELECTOR */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setIsSwapMode(false);
                setSwapStudent1(null);
                setSwapStudent2(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                !isSwapMode
                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span>Chuyển Tổ (1 Bạn)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setIsSwapMode(true);
                setSelectedStudentForMove(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isSwapMode
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Hoán Đổi Chéo (2 Bạn)</span>
            </button>
          </div>
        </div>

        {/* ACTIVE OPERATION CONTROL CARD */}
        {!isSwapMode && selectedStudentForMove && (
          <div className="bg-teal-50 border-b border-teal-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 animate-slide-down">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                {selectedStudentForMove.gender === 'female' ? '👧' : '👦'}
              </div>
              <div>
                <span className="text-slate-600 font-medium">Đang chọn chuyển bạn: </span>
                <b className="text-slate-900 text-sm">{selectedStudentForMove.name}</b>
                <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-200 text-teal-900">
                  Hiện thuộc Tổ {selectedStudentForMove.group}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1">Chuyển sang:</span>
              {(['1', '2', '3', '4'] as GroupId[]).map((gid) => {
                const isCurrent = selectedStudentForMove.group === gid;
                return (
                  <button
                    key={gid}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleExecuteMove(gid)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer border ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                        : gid === '1' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : gid === '2'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-2xs'
                        : gid === '3'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-2xs'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 shadow-2xs'
                    }`}
                  >
                    <span>Tổ {gid}</span>
                    {isCurrent && <span className="text-[10px] font-normal">(Hiện tại)</span>}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedStudentForMove(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 ml-2"
                title="Hủy chọn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SWAP CONTROLS BANNER */}
        {isSwapMode && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
              <span className="font-bold text-amber-950 flex items-center gap-1">
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                <span>Hoán đổi 2 bạn:</span>
              </span>

              {/* STUDENT 1 */}
              {swapStudent1 ? (
                <span className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-slate-900 font-bold flex items-center gap-1.5 shadow-2xs">
                  <span>{swapStudent1.name} (Tổ {swapStudent1.group})</span>
                  <button onClick={() => setSwapStudent1(null)} className="text-slate-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 border border-dashed border-amber-300 text-amber-800 text-xs italic">
                  1. Chạm chọn bạn thứ nhất
                </span>
              )}

              <span className="font-black text-amber-600">⇄</span>

              {/* STUDENT 2 */}
              {swapStudent2 ? (
                <span className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-slate-900 font-bold flex items-center gap-1.5 shadow-2xs">
                  <span>{swapStudent2.name} (Tổ {swapStudent2.group})</span>
                  <button onClick={() => setSwapStudent2(null)} className="text-slate-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 border border-dashed border-amber-300 text-amber-800 text-xs italic">
                  2. Chạm chọn bạn thứ hai (tổ khác)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!swapStudent1 || !swapStudent2}
                onClick={handleExecuteSwap}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                  swapStudent1 && swapStudent2
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Thực Hiện Hoán Đổi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSwapStudent1(null);
                  setSwapStudent2(null);
                }}
                className="px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700"
              >
                Làm lại
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-4 gap-2 px-3 sm:px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-xs shrink-0">
          {(['1', '2', '3', '4'] as GroupId[]).map((gid) => {
            const count = students.filter(s => s.group === gid).length;
            const cfg = GROUP_CONFIG[gid];
            return (
              <div 
                key={gid}
                className={`p-2 rounded-xl border ${cfg.border} ${cfg.bgLight} flex items-center justify-between`}
              >
                <span className="font-bold text-slate-700">{cfg.name}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${cfg.badge}`}>
                  {count} bạn
                </span>
              </div>
            );
          })}
        </div>

        {/* 4 COLUMNS CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full">
            {(['1', '2', '3', '4'] as GroupId[]).map((gid) => {
              const members = getGroupMembers(gid);
              const cfg = GROUP_CONFIG[gid];
              
              return (
                <div 
                  key={gid}
                  className={`rounded-2xl border ${cfg.border} flex flex-col bg-white shadow-2xs overflow-hidden`}
                >
                  {/* COLUMN HEADER */}
                  <div className={`p-3 bg-gradient-to-r ${cfg.color} text-white flex items-center justify-between shrink-0 shadow-xs`}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm tracking-wide">{cfg.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white/25 backdrop-blur-xs">
                      {members.length} học sinh
                    </span>
                  </div>

                  {/* MEMBER LIST */}
                  <div className="p-2 space-y-1.5 flex-1 overflow-y-auto max-h-[460px] custom-scroll">
                    {members.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        Không có học sinh nào phù hợp
                      </div>
                    ) : (
                      members.map((st) => {
                        const isMoveSelected = selectedStudentForMove?.id === st.id;
                        const isSwap1 = swapStudent1?.id === st.id;
                        const isSwap2 = swapStudent2?.id === st.id;
                        const isSelectedInSwap = isSwap1 || isSwap2;

                        return (
                          <div
                            key={st.id}
                            onClick={() => handleStudentClick(st)}
                            className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between group ${
                              isMoveSelected
                                ? 'bg-teal-100/90 border-teal-500 ring-2 ring-teal-400 font-bold shadow-xs'
                                : isSelectedInSwap
                                ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 font-bold shadow-xs'
                                : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="text-sm shrink-0">
                                {st.gender === 'female' ? '👧' : '👦'}
                              </span>
                              <div className="truncate">
                                <div className="font-bold text-slate-800 truncate flex items-center gap-1">
                                  <span>{st.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {st.role && st.role !== 'Thành viên' ? (
                                    <span className="font-semibold text-amber-700">{st.role} • </span>
                                  ) : null}
                                  <span>{st.points}đ</span>
                                </div>
                              </div>
                            </div>

                            {/* RIGHT ACTION INDICATOR */}
                            <div className="shrink-0 ml-1.5 flex items-center gap-1">
                              {isMoveSelected ? (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-teal-600 text-white">
                                  Đang chọn
                                </span>
                              ) : isSwap1 ? (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950">
                                  Bạn 1
                                </span>
                              ) : isSwap2 ? (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950">
                                  Bạn 2
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStudentClick(st);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition"
                                  title="Chọn để chuyển tổ"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            💡 Mẹo: Mọi thay đổi về tổ sẽ được tự động lưu ngay vào hệ thống và cập nhật danh sách lớp.
          </p>

          <button
            type="button"
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-black transition cursor-pointer shadow-md ml-auto"
          >
            Hoàn Tất & Đóng Lại
          </button>
        </div>

      </div>
    </div>
  );
};
