import React, { useState, useEffect } from 'react';
import { Student, ClassSettings, PointLog, AttendanceRecord, AttendanceStatus, UserRole, ClassRule, ActiveOfficer, GroupId, MonthlyRecord, MonthlyStore } from './types';
import { 
  loadStoredStudents, 
  saveStoredStudents, 
  loadStoredSettings, 
  saveStoredSettings, 
  loadStoredLogs, 
  saveStoredLogs, 
  loadStoredAttendance, 
  saveStoredAttendance,
  loadStoredRole,
  saveStoredRole,
  loadStoredRules,
  saveStoredRules,
  loadStoredOfficer,
  saveStoredOfficer,
  checkIsAuthenticated,
  saveAuthenticationState,
  loadStoredMonthlyData,
  saveStoredMonthlyData,
  INITIAL_STUDENTS,
  DEFAULT_SETTINGS,
  getStorageError,
  hasUnreadableStorage,
  validateBackup,
  prepareRestore,
  ClassroomBackup,
  createDefaultMonthlyStore
} from './utils/storage';
import { downloadStandaloneHtml } from './utils/htmlExporter';
import { playTingTing, playGentleReminder, playClick } from './utils/audio';

import { Header } from './components/Header';
import { ClassroomTab } from './components/ClassroomTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { AttendanceTab } from './components/AttendanceTab';
import { UtilitiesTab } from './components/UtilitiesTab';
import { RulesTab } from './components/RulesTab';
import { ScoreModal } from './components/ScoreModal';
import { SettingsModal } from './components/SettingsModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { LoginModal } from './components/LoginModal';
import { MonthBar } from './components/MonthBar';
import { MonthlyArchiveModal } from './components/MonthlyArchiveModal';
import { ArchiveNextMonthModal } from './components/ArchiveNextMonthModal';

export default function App() {
  // --- CORE APPLICATION STATES ---
  const [initialData] = useState(() => {
    const loadedStudents = loadStoredStudents();
    const loadedLogs = loadStoredLogs();
    const store = loadStoredMonthlyData(loadedStudents, loadedLogs);
    const month = store.months[store.activeMonthId];
    return { students: loadedStudents.map(s => ({ ...s, points: month?.studentScores[s.id] ?? s.points })),
      logs: month?.pointLogs ?? loadedLogs, store };
  });
  const [storageError, setStorageError] = useState(getStorageError);
  useEffect(() => {
    const update = () => setStorageError(getStorageError());
    window.addEventListener('classroom-storage-status', update);
    update();
    return () => window.removeEventListener('classroom-storage-status', update);
  }, []);
  const [students, setStudents] = useState<Student[]>(initialData.students);
  const [settings, setSettings] = useState<ClassSettings>(() => loadStoredSettings());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const s = loadStoredSettings();
    return checkIsAuthenticated(s.requireLoginOnEntry !== false);
  });
  const [pointLogs, setPointLogs] = useState<PointLog[]>(initialData.logs);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>(() => loadStoredAttendance());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => loadStoredRole());
  const [activeOfficer, setActiveOfficer] = useState<ActiveOfficer | null>(() => loadStoredOfficer());
  const [rules, setRules] = useState<ClassRule[]>(() => loadStoredRules());

  const [activeTab, setActiveTab] = useState<'classroom' | 'leaderboard' | 'attendance' | 'utilities' | 'rules'>('classroom');

  // --- MONTHLY DATA ARCHIVE STATES ---
  const [monthlyStore, setMonthlyStore] = useState<MonthlyStore>(initialData.store);
  const [isMonthlyArchiveOpen, setIsMonthlyArchiveOpen] = useState(false);
  const [isArchiveNextMonthOpen, setIsArchiveNextMonthOpen] = useState(false);

  const allMonthsList: MonthlyRecord[] = Object.values(monthlyStore.months);
  const currentMonthRecord: MonthlyRecord = monthlyStore.months[monthlyStore.activeMonthId] || allMonthsList[0];
  const availableMonths: MonthlyRecord[] = [...allMonthsList].sort((a, b) => a.id.localeCompare(b.id));

  // --- MODAL STATES ---
  const [scoreModalStudent, setScoreModalStudent] = useState<Student | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- LOCALSTORAGE PERSISTENCE EFFECTS ---
  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredOfficer(activeOfficer);
  }, [activeOfficer]);

  useEffect(() => {
    saveStoredLogs(pointLogs);
  }, [pointLogs]);

  useEffect(() => {
    saveStoredAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveStoredRules(rules);
  }, [rules]);

  // Sync active month's student scores whenever students or pointLogs change
  useEffect(() => {
    setMonthlyStore(prev => {
      const curr = prev.months[prev.activeMonthId];
      if (!curr || curr.isArchived || hasUnreadableStorage()) return prev;
      const scores: Record<string, number> = {};
      students.forEach(s => {
        scores[s.id] = s.points;
      });
      const updatedMonths = {
        ...prev.months,
        [prev.activeMonthId]: {
          ...curr,
          studentScores: scores,
          pointLogs: pointLogs
        }
      };
      const updatedStore = {
        ...prev,
        months: updatedMonths
      };
      saveStoredMonthlyData(updatedStore);
      return updatedStore;
    });
  }, [students, pointLogs]);

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    saveStoredRole(newRole);
  };

  const handleSelectMonth = (monthId: string) => {
    const targetMonth = monthlyStore.months[monthId];
    if (!targetMonth) return;

    // 1. Snapshot current scores & logs into current active month
    const currentScores: Record<string, number> = {};
    students.forEach(s => {
      currentScores[s.id] = s.points;
    });

    const updatedMonths = {
      ...monthlyStore.months,
      [monthlyStore.activeMonthId]: {
        ...monthlyStore.months[monthlyStore.activeMonthId],
        studentScores: currentScores,
        pointLogs: pointLogs
      }
    };

    // 2. Load target month's scores and logs
    const targetScores = targetMonth.studentScores || {};
    const updatedStudents = students.map(st => ({
      ...st,
      points: targetScores[st.id] !== undefined ? targetScores[st.id] : 10
    }));

    const newStore: MonthlyStore = {
      ...monthlyStore,
      activeMonthId: monthId,
      months: updatedMonths
    };

    setMonthlyStore(newStore);
    saveStoredMonthlyData(newStore);
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setPointLogs(targetMonth.pointLogs || []);
    saveStoredLogs(targetMonth.pointLogs || []);
  };

  const handleUpdateMonth = (updatedMonth: MonthlyRecord) => {
    setMonthlyStore(prev => {
      const nextStore = {
        ...prev,
        months: {
          ...prev.months,
          [updatedMonth.id]: updatedMonth
        }
      };
      saveStoredMonthlyData(nextStore);
      return nextStore;
    });
  };

  const handleAddNewMonth = (newMonth: MonthlyRecord) => {
    setMonthlyStore(prev => {
      const nextStore = {
        ...prev,
        months: {
          ...prev.months,
          [newMonth.id]: newMonth
        }
      };
      saveStoredMonthlyData(nextStore);
      return nextStore;
    });
  };

  const handleConfirmArchiveAndNext = (nextMonthId: string, resetPointsMode: 'reset_10' | 'reset_0' | 'keep') => {
    const currentScores: Record<string, number> = {};
    students.forEach(s => {
      currentScores[s.id] = s.points;
    });

    const archivedCurrent: MonthlyRecord = {
      ...currentMonthRecord,
      studentScores: currentScores,
      pointLogs: pointLogs,
      isArchived: true,
      archivedAt: Date.now()
    };

    const targetMonth = monthlyStore.months[nextMonthId] || {
      id: nextMonthId,
      name: nextMonthId,
      year: 2026,
      month: 10,
      studentScores: {},
      pointLogs: [],
      isArchived: false
    };

    const nextScores: Record<string, number> = {};
    const updatedStudents = students.map(st => {
      let newPoints = st.points;
      if (resetPointsMode === 'reset_10') newPoints = 10;
      else if (resetPointsMode === 'reset_0') newPoints = 0;
      nextScores[st.id] = newPoints;
      return { ...st, points: newPoints };
    });

    const updatedNextMonth: MonthlyRecord = {
      ...targetMonth,
      studentScores: nextScores,
      pointLogs: [],
      isArchived: false
    };

    const updatedStore: MonthlyStore = {
      ...monthlyStore,
      activeMonthId: nextMonthId,
      months: {
        ...monthlyStore.months,
        [currentMonthRecord.id]: archivedCurrent,
        [nextMonthId]: updatedNextMonth
      }
    };

    setMonthlyStore(updatedStore);
    saveStoredMonthlyData(updatedStore);
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setPointLogs([]);
    saveStoredLogs([]);
    setIsArchiveNextMonthOpen(false);
  };

  const handleSuccessLogin = (role: UserRole, officer: ActiveOfficer | null, rememberDevice: boolean) => {
    setIsAuthenticated(true);
    saveAuthenticationState(true, rememberDevice);
    setCurrentRole(role);
    saveStoredRole(role);
    setActiveOfficer(officer);
    saveStoredOfficer(officer);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    saveAuthenticationState(false, false);
    setIsLoginOpen(true);
  };

  // --- SOUND TOGGLE ---
  const handleToggleSound = () => {
    const nextState = !settings.soundEnabled;
    const nextSettings = { ...settings, soundEnabled: nextState };
    setSettings(nextSettings);
  };

  // --- SCORING & LOGIC ---
  const handleAddScore = (studentId: string, points: number, reason: string) => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (points > 0) {
      playTingTing(settings.soundEnabled);
    } else {
      playGentleReminder(settings.soundEnabled);
    }

    // Update student
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, points: s.points + points };
      }
      return s;
    }));

    // Add log
    const authorTitle = currentRole === 'gvcn' 
      ? 'GVCN' 
      : (activeOfficer ? `${activeOfficer.roleTitle} (${activeOfficer.name})` : 'Ban Cán Sự');

    const newLog: PointLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: student.id,
      studentName: student.name,
      group: student.group,
      points,
      reason,
      timestamp: Date.now(),
      authorRole: currentRole,
      authorName: authorTitle
    };
    setPointLogs(prev => [newLog, ...prev]);
  };

  const handleQuickAddPoints = (student: Student, points: number, reason?: string) => {
    handleAddScore(student.id, points, reason || (points > 0 ? 'Phát biểu bài xây dựng tiết học' : 'Nhắc nhở nề nếp / Thiếu bài tập'));
  };

  const handleBatchAddPoints = (targetStudents: Student[], points: number, reason: string) => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    if (targetStudents.length === 0) return;
    if (points > 0) {
      playTingTing(settings.soundEnabled);
    } else {
      playGentleReminder(settings.soundEnabled);
    }

    const ids = targetStudents.map(s => s.id);
    setStudents(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, points: s.points + points };
      }
      return s;
    }));

    const now = Date.now();
    const authorTitle = currentRole === 'gvcn' 
      ? 'GVCN' 
      : (activeOfficer ? `${activeOfficer.roleTitle} (${activeOfficer.name})` : 'Ban Cán Sự');

    const newLogs: PointLog[] = targetStudents.map((st, i) => ({
      id: `log-${now}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: st.id,
      studentName: st.name,
      group: st.group,
      points,
      reason,
      timestamp: now,
      authorRole: currentRole,
      authorName: authorTitle
    }));

    setPointLogs(prev => [...newLogs, ...prev]);
  };

  // --- ATTENDANCE ACTIONS ---
  const handleUpdateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        updatedAt: Date.now()
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach(s => {
      updated[s.id] = {
        studentId: s.id,
        status: 'present',
        updatedAt: Date.now()
      };
    });
    setAttendance(updated);
  };

  // --- STUDENT CRUD ---
  const handleSaveStudentDetail = (data: Partial<Student>) => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    if (data.id) {
      // Edit existing
      setStudents(prev => prev.map(s => s.id === data.id ? { ...s, ...data } as Student : s));
    } else {
      // Create new
      const newStudent: Student = {
        id: `hs-${Date.now()}`,
        name: data.name || 'Học sinh mới',
        gender: data.gender || 'male',
        group: data.group || '1',
        role: data.role || 'Thành viên',
        points: data.points ?? 10,
        avatarIndex: students.length + 1
      };
      setStudents(prev => [...prev, newStudent]);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // --- RESET & BULK IMPORT ---
  const handleResetWeeklyPoints = () => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    if (confirm('Bạn có chắc chắn muốn đặt lại điểm thi đua của tất cả học sinh về 0 để khởi động tuần mới?')) {
      playClick(settings.soundEnabled);
      setStudents(prev => prev.map(s => ({ ...s, points: 0 })));
      alert('Đã đặt lại toàn bộ điểm thi đua về 0 điểm thành công!');
    }
  };

  const handleResetToDefaultSample = () => {
    if (confirm('Khôi phục danh sách mẫu chuẩn 54 học sinh lớp 7C8? Mọi dữ liệu sửa đổi sẽ được đặt lại.')) {
      playClick(settings.soundEnabled);
      setStudents(INITIAL_STUDENTS);
      setSettings(DEFAULT_SETTINGS);
      setAttendance({});
      setPointLogs([]);
      const resetStore = createDefaultMonthlyStore(INITIAL_STUDENTS, []);
      setMonthlyStore(resetStore);
      saveStoredMonthlyData(resetStore);
      alert('Đã khôi phục dữ liệu mẫu chuẩn 54 học sinh lớp 7C8 thành công!');
    }
  };

  const handleBulkImport = (names: string[]) => {
    if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; }
    const newStudents: Student[] = names.map((name, idx) => {
      const groupNum = ((idx % 4) + 1).toString() as '1' | '2' | '3' | '4';
      return {
        id: `hs-${Date.now()}-${idx + 1}`,
        name,
        gender: idx % 2 === 0 ? 'male' : 'female',
        group: groupNum,
        role: 'Thành viên',
        points: 10,
        avatarIndex: idx + 1
      };
    });
    setStudents(newStudents);
  };

  const handleRestoreData = (data: ClassroomBackup) => {
    validateBackup(data);
    prepareRestore(data);
    const store = data.monthlyStore ?? createDefaultMonthlyStore(data.students, data.pointLogs ?? []);
    const month = store.months[store.activeMonthId];
    setMonthlyStore(store);
    saveStoredMonthlyData(store);
    setStudents(data.students.map(s => ({ ...s, points: month.studentScores[s.id] ?? s.points })));
    setPointLogs(month.pointLogs);
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    setAttendance(data.attendance ?? {});
    if (data.rules) setRules(data.rules);
  };

  const handleChangeStudentGroup = (studentId: string, newGroup: GroupId) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, group: newGroup } : s);
      saveStoredStudents(updated);
      return updated;
    });
  };

  const handleBatchChangeGroup = (studentIds: string[], newGroup: GroupId) => {
    setStudents(prev => {
      const idSet = new Set(studentIds);
      const updated = prev.map(s => idSet.has(s.id) ? { ...s, group: newGroup } : s);
      saveStoredStudents(updated);
      return updated;
    });
  };

  const handleSwapStudentsGroup = (studentId1: string, studentId2: string) => {
    setStudents(prev => {
      const st1 = prev.find(s => s.id === studentId1);
      const st2 = prev.find(s => s.id === studentId2);
      if (!st1 || !st2) return prev;
      const group1 = st1.group;
      const group2 = st2.group;
      const updated = prev.map(s => {
        if (s.id === studentId1) return { ...s, group: group2 };
        if (s.id === studentId2) return { ...s, group: group1 };
        return s;
      });
      saveStoredStudents(updated);
      return updated;
    });
  };

  const handleExportStandaloneHtml = () => {
    downloadStandaloneHtml(students, settings, { attendance, pointLogs, rules, monthlyStore });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-['Be_Vietnam_Pro',sans-serif]">
      
      {storageError && <div role="alert" className="bg-red-100 text-red-900 p-4 font-bold">{storageError}</div>}
      {/* 1. TOP HEADER */}
      <Header
        settings={settings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalStudents={students.length}
        totalRules={rules.length}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportStandaloneHtml={handleExportStandaloneHtml}
        currentRole={currentRole}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        activeOfficer={activeOfficer}
        currentMonthName={currentMonthRecord.name}
        onOpenMonthArchive={() => setIsMonthlyArchiveOpen(true)}
      />

      {/* 2. MAIN ACTIVE TAB VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* MONTH CONTROLS BAR */}
        <MonthBar
          currentMonth={currentMonthRecord}
          availableMonths={availableMonths}
          onSelectMonth={handleSelectMonth}
          onOpenArchiveModal={() => setIsMonthlyArchiveOpen(true)}
          onArchiveAndNextMonth={() => setIsArchiveNextMonthOpen(true)}
          currentRole={currentRole}
          soundEnabled={settings.soundEnabled}
          latestActiveMonthId={monthlyStore.activeMonthId}
        />

        {activeTab === 'classroom' && (
          <ClassroomTab
            students={students}
            onOpenScoreModal={(st) => setScoreModalStudent(st)}
            onQuickAddPoints={handleQuickAddPoints}
            onBatchAddPoints={handleBatchAddPoints}
            onOpenEditModal={(st) => {
              setDetailModalStudent(st);
              setIsDetailModalOpen(true);
            }}
            onOpenAddModal={() => {
              setDetailModalStudent(null);
              setIsDetailModalOpen(true);
            }}
            onBulkImport={handleBulkImport}
            soundEnabled={settings.soundEnabled}
            currentRole={currentRole}
            onOpenLogin={() => setIsLoginOpen(true)}
            onSelectRole={handleRoleChange}
            onSelectOfficer={setActiveOfficer}
            activeOfficer={activeOfficer}
            settings={settings}
            onChangeStudentGroup={handleChangeStudentGroup}
            onBatchChangeGroup={handleBatchChangeGroup}
            onSwapStudentsGroup={handleSwapStudentsGroup}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            students={students}
            settings={settings}
            onOpenScoreModal={(st) => setScoreModalStudent(st)}
            soundEnabled={settings.soundEnabled}
            currentMonthName={currentMonthRecord.name}
            isArchived={currentMonthRecord.isArchived}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            students={students}
            attendance={attendance}
            onUpdateAttendance={handleUpdateAttendance}
            onMarkAllPresent={handleMarkAllPresent}
            settings={settings}
            soundEnabled={settings.soundEnabled}
            currentRole={currentRole}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesTab
            students={students}
            attendance={attendance}
            pointLogs={pointLogs}
            onAddScore={handleAddScore}
            onClearLogs={() => { if (currentMonthRecord.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trước khi sửa dữ liệu.'); return; } setPointLogs([]); }}
            soundEnabled={settings.soundEnabled}
            currentRole={currentRole}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {activeTab === 'rules' && (
          <RulesTab
            rules={rules}
            onUpdateRules={setRules}
            settings={settings}
            currentRole={currentRole}
            onOpenLogin={() => setIsLoginOpen(true)}
            soundEnabled={settings.soundEnabled}
            students={students}
            onSelectRuleToGrade={(rule) => {
              setActiveTab('classroom');
              alert(`Bạn đã chọn tiêu chí: "${rule.title}" (${rule.points && rule.points > 0 ? `+${rule.points}` : rule.points} điểm). Hãy nhấp vào học sinh để ghi điểm!`);
            }}
          />
        )}

      </main>

      {/* 3. APPLICATION FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <b>Hệ Thống Quản Lý Lớp Học & Thi Đua Số</b> • {settings.className} - {settings.schoolName}
          </div>
          <div>
            GVCN: <b>{settings.teacherName}</b> • Tự động lưu LocalStorage 100% Offline
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}
      <ScoreModal
        student={scoreModalStudent}
        onClose={() => setScoreModalStudent(null)}
        onAddScore={handleAddScore}
        currentRole={currentRole}
        onOpenLogin={() => setIsLoginOpen(true)}
        activeOfficer={activeOfficer}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetWeeklyPoints={handleResetWeeklyPoints}
        onResetToDefaultSample={handleResetToDefaultSample}
        onBulkImport={handleBulkImport}
        students={students}
        pointLogs={pointLogs}
        attendance={attendance}
        rules={rules}
        monthlyStore={monthlyStore}
        onRestoreData={handleRestoreData}
        onExportStandaloneHtml={handleExportStandaloneHtml}
        soundEnabled={settings.soundEnabled}
        currentRole={currentRole}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailModalStudent(null);
        }}
        student={detailModalStudent}
        onSave={handleSaveStudentDetail}
        onDelete={handleDeleteStudent}
        soundEnabled={settings.soundEnabled}
      />

      <LoginModal
        isOpen={!isAuthenticated || isLoginOpen}
        isMandatory={!isAuthenticated}
        onClose={() => {
          if (isAuthenticated) {
            setIsLoginOpen(false);
          }
        }}
        currentRole={currentRole}
        settings={settings}
        soundEnabled={settings.soundEnabled}
        onSelectRole={handleRoleChange}
        activeOfficer={activeOfficer}
        onSelectOfficer={setActiveOfficer}
        onSuccessLogin={handleSuccessLogin}
        onLogout={handleLogout}
      />

      <MonthlyArchiveModal
        isOpen={isMonthlyArchiveOpen}
        onClose={() => setIsMonthlyArchiveOpen(false)}
        months={monthlyStore.months}
        activeMonthId={monthlyStore.activeMonthId}
        onSelectMonth={(mId) => {
          handleSelectMonth(mId);
          setIsMonthlyArchiveOpen(false);
        }}
        onUpdateMonth={handleUpdateMonth}
        onAddNewMonth={handleAddNewMonth}
        students={students}
        settings={settings}
        currentRole={currentRole}
        soundEnabled={settings.soundEnabled}
      />

      <ArchiveNextMonthModal
        isOpen={isArchiveNextMonthOpen}
        onClose={() => setIsArchiveNextMonthOpen(false)}
        currentMonth={currentMonthRecord}
        availableMonths={availableMonths}
        students={students}
        settings={settings}
        onConfirmArchiveAndNext={handleConfirmArchiveAndNext}
        soundEnabled={settings.soundEnabled}
      />

    </div>
  );
}
