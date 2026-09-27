import { Student, PointLog, AttendanceRecord, ClassSettings, RANK_TIERS, RankTier, UserRole, ClassRule, DEFAULT_CLASS_RULES, ActiveOfficer, MonthlyRecord, MonthlyStore } from '../types';

const blockedKeys = new Set<string>();
const storageErrors = new Map<string, string>();
export function hasUnreadableStorage(): boolean { return blockedKeys.size > 0; }
export function getStorageError(): string {
  return Array.from(storageErrors.values()).join(' ');
}
function reportStorage(key: string, message?: string) {
  if (message) storageErrors.set(key, message); else storageErrors.delete(key);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('classroom-storage-status'));
}
function readStorage(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null && key !== 'classroom_user_role_v1' && key !== 'classroom_auth_remember_v1') JSON.parse(raw);
    return raw;
  } catch (error) {
    blockedKeys.add(key);
    reportStorage(key, 'Không đọc được dữ liệu đã lưu. Dữ liệu gốc được giữ nguyên; hãy sao lưu trước khi khôi phục.');
    throw error;
  }
}
function writeStorage(key: string, value: string) {
  if (blockedKeys.has(key)) throw new Error('Dữ liệu gốc đang được bảo vệ');
  try {
    localStorage.setItem(key, value);
    reportStorage(key);
  } catch (error) {
    reportStorage(key, 'Chưa lưu được dữ liệu trên trình duyệt. Hãy tải bản sao lưu JSON trước khi đóng trang.');
    throw error;
  }
}
export function prepareRestore(data: ClassroomBackup) {
  validateBackup(data);
  const keys = [STORAGE_KEYS.STUDENTS, STORAGE_KEYS.LOGS, STORAGE_KEYS.ATTENDANCE, STORAGE_KEYS.MONTHLY_DATA];
  if (data.settings) keys.push(STORAGE_KEYS.SETTINGS);
  if (data.rules) keys.push(STORAGE_KEYS.RULES);
  keys.forEach(key => { blockedKeys.delete(key); reportStorage(key); });
}
function invalidStoredData(key: string): never {
  blockedKeys.add(key);
  reportStorage(key, 'Dữ liệu đã lưu không hợp lệ; dữ liệu gốc được giữ nguyên. Hãy khôi phục từ JSON hợp lệ.');
  throw new Error('Invalid saved data: ' + key);
}
export function isStudentList(value: unknown): value is Student[] {
  return Array.isArray(value) && value.every(s => s && typeof s.id === 'string' &&
    typeof s.name === 'string' && Number.isFinite(s.points) && ['1','2','3','4'].includes(s.group) &&
    ['male','female'].includes(s.gender) && typeof s.role === 'string' && Number.isFinite(s.avatarIndex)) &&
    new Set(value.map(s => s.id)).size === value.length;
}
export function isMonthlyStore(value: any): value is MonthlyStore {
  return !!value && typeof value.activeMonthId === 'string' && !!value.months &&
    typeof value.months === 'object' && !Array.isArray(value.months) && !!value.months[value.activeMonthId] &&
    Object.entries(value.months).every(([id, m]: [string, any]) => m && m.id === id &&
      typeof m.name === 'string' && m.studentScores && typeof m.studentScores === 'object' &&
      Object.values(m.studentScores).every(Number.isFinite) && Array.isArray(m.pointLogs));
}
export interface ClassroomBackup {
  students: Student[];
  settings?: ClassSettings;
  pointLogs?: PointLog[];
  attendance?: Record<string, AttendanceRecord>;
  rules?: ClassRule[];
  monthlyStore?: MonthlyStore;
}
export function validateBackup(data: any): asserts data is ClassroomBackup {
  if (!data || !isStudentList(data.students)) throw new Error('Danh sách học sinh không hợp lệ hoặc trùng mã.');
  if (data.monthlyStore !== undefined && !isMonthlyStore(data.monthlyStore)) throw new Error('Dữ liệu tháng không hợp lệ.');
  if (data.pointLogs !== undefined && !Array.isArray(data.pointLogs)) throw new Error('Nhật ký không hợp lệ.');
  if (data.rules !== undefined && !Array.isArray(data.rules)) throw new Error('Nội quy không hợp lệ.');
  if (data.settings !== undefined && (!data.settings || typeof data.settings.className !== 'string')) throw new Error('Thông tin lớp không hợp lệ.');
  if (data.attendance !== undefined && (!data.attendance || typeof data.attendance !== 'object' || Array.isArray(data.attendance))) throw new Error('Điểm danh không hợp lệ.');
}

export const DEFAULT_SETTINGS: ClassSettings = {
  className: 'LỚP 7C8',
  schoolName: 'THCS VÕ THỊ SÁU',
  teacherName: 'Cô Ngô Thị Phương',
  academicYear: '2026 - 2027',
  soundEnabled: true,
  gvcnPin: '123456',
  bcsPin: '1234',
  allowBcsScoring: true,
  bcsScope: 'all',
  requireBcsPin: false,
  allowBcsChangeGroup: true,
  requireLoginOnEntry: true
};

export const DEFAULT_CLASS_OFFICERS: ActiveOfficer[] = [
  { name: 'Phạm Bảo Linh', roleTitle: 'Lớp trưởng', group: '2' },
  { name: 'Bùi Nguyễn Hải Nam', roleTitle: 'Lớp phó', group: '2' },
  { name: 'Nguyễn Bích Lam', roleTitle: 'Tổ trưởng Tổ 1', group: '1' },
  { name: 'Đặng Thuỳ Trâm', roleTitle: 'Tổ trưởng Tổ 2', group: '2' },
  { name: 'Phạm Ngọc Hà My', roleTitle: 'Tổ trưởng Tổ 3', group: '3' },
  { name: 'Nguyễn Anh Thư', roleTitle: 'Tổ trưởng Tổ 4', group: '4' },
  { name: 'Nguyễn Vân Khánh', roleTitle: 'Lớp phó học tập', group: '2' },
  { name: 'Đoàn Văn Dũng', roleTitle: 'Lớp phó lao động', group: '4' }
];

export const INITIAL_STUDENTS: Student[] = [
  // TỔ 1
  { id: 'hs-01', name: 'Đặng Hoài An', gender: 'female', group: '1', role: 'Thành viên', points: 28, avatarIndex: 1 },
  { id: 'hs-02', name: 'Nguyễn Bảo An', gender: 'male', group: '1', role: 'Thành viên', points: 22, avatarIndex: 2 },
  { id: 'hs-03', name: 'Bùi Quang Anh', gender: 'male', group: '1', role: 'Thành viên', points: 26, avatarIndex: 3 },
  { id: 'hs-04', name: 'Lê Nhật Anh', gender: 'male', group: '1', role: 'Thành viên', points: 20, avatarIndex: 4 },
  { id: 'hs-05', name: 'Bùi Đức Gia Bảo', gender: 'male', group: '1', role: 'Tổ phó Tổ 1', points: 24, avatarIndex: 5 },
  { id: 'hs-06', name: 'Ngô Thái Bảo', gender: 'male', group: '1', role: 'Thành viên', points: 19, avatarIndex: 6 },
  { id: 'hs-07', name: 'Nguyễn Quỳnh Chi', gender: 'female', group: '1', role: 'Thành viên', points: 25, avatarIndex: 7 },
  { id: 'hs-08', name: 'Đào Ngọc Doanh', gender: 'male', group: '1', role: 'Thành viên', points: 21, avatarIndex: 8 },
  { id: 'hs-09', name: 'Nguyễn Tuấn Đạt', gender: 'male', group: '1', role: 'Thành viên', points: 18, avatarIndex: 9 },
  { id: 'hs-10', name: 'Bùi Nguyễn Hải Đăng', gender: 'male', group: '1', role: 'Thành viên', points: 23, avatarIndex: 10 },
  { id: 'hs-11', name: 'Nguyễn Việt Đức', gender: 'male', group: '1', role: 'Thành viên', points: 19, avatarIndex: 11 },
  { id: 'hs-12', name: 'Vũ Hương Giang', gender: 'female', group: '1', role: 'Thành viên', points: 24, avatarIndex: 12 },
  { id: 'hs-13', name: 'Đỗ Thái Hà', gender: 'female', group: '1', role: 'Thành viên', points: 20, avatarIndex: 13 },
  { id: 'hs-14', name: 'Lưu Chấn Hùng', gender: 'male', group: '1', role: 'Thành viên', points: 22, avatarIndex: 14 },
  { id: 'hs-20', name: 'Nguyễn Bích Lam', gender: 'female', group: '1', role: 'Tổ trưởng Tổ 1', points: 24, avatarIndex: 20 },

  // TỔ 2
  { id: 'hs-15', name: 'Nguyễn Kiệt Hữu', gender: 'male', group: '2', role: 'Thành viên', points: 27, avatarIndex: 15 },
  { id: 'hs-16', name: 'Nguyễn Vân Khánh', gender: 'female', group: '2', role: 'Lớp phó học tập', points: 25, avatarIndex: 16 },
  { id: 'hs-17', name: 'Lê Bảo Khôi', gender: 'male', group: '2', role: 'Tổ phó Tổ 2', points: 22, avatarIndex: 17 },
  { id: 'hs-18', name: 'Vũ Bá Anh Khôi', gender: 'male', group: '2', role: 'Thành viên', points: 21, avatarIndex: 18 },
  { id: 'hs-19', name: 'Hoàng Trung Kiên', gender: 'male', group: '2', role: 'Thành viên', points: 20, avatarIndex: 19 },
  { id: 'hs-21', name: 'Nguyễn Diệu Thảo Linh', gender: 'female', group: '2', role: 'Thành viên', points: 25, avatarIndex: 21 },
  { id: 'hs-22', name: 'Phạm Bảo Linh', gender: 'female', group: '2', role: 'Lớp trưởng', points: 28, avatarIndex: 22 },
  { id: 'hs-23', name: 'Nguyễn Huy Minh', gender: 'male', group: '2', role: 'Thành viên', points: 32, avatarIndex: 23 },
  { id: 'hs-24', name: 'Phạm Hoàng Minh', gender: 'male', group: '2', role: 'Thành viên', points: 19, avatarIndex: 24 },
  { id: 'hs-26', name: 'Bùi Nguyễn Hải Nam', gender: 'male', group: '2', role: 'Lớp phó', points: 21, avatarIndex: 26 },
  { id: 'hs-27', name: 'Lại Khánh Nga', gender: 'female', group: '2', role: 'Thành viên', points: 24, avatarIndex: 27 },
  { id: 'hs-28', name: 'Phạm Thúy Nga', gender: 'female', group: '2', role: 'Thành viên', points: 23, avatarIndex: 28 },
  { id: 'hs-44', name: 'Đặng Thuỳ Trâm', gender: 'female', group: '2', role: 'Tổ trưởng Tổ 2', points: 24, avatarIndex: 44 },

  // TỔ 3
  { id: 'hs-25', name: 'Phạm Ngọc Hà My', gender: 'female', group: '3', role: 'Tổ trưởng Tổ 3', points: 28, avatarIndex: 25 },
  { id: 'hs-29', name: 'Lại Khánh Ngân', gender: 'female', group: '3', role: 'Thành viên', points: 27, avatarIndex: 29 },
  { id: 'hs-30', name: 'Nguyễn Đức Nguyên', gender: 'male', group: '3', role: 'Thành viên', points: 21, avatarIndex: 30 },
  { id: 'hs-31', name: 'Trần Khôi Nguyên', gender: 'male', group: '3', role: 'Tổ phó Tổ 3', points: 23, avatarIndex: 31 },
  { id: 'hs-32', name: 'Trịnh Hải Nguyên', gender: 'male', group: '3', role: 'Thành viên', points: 18, avatarIndex: 32 },
  { id: 'hs-33', name: 'Lưu Thảo Nhi', gender: 'female', group: '3', role: 'Thành viên', points: 24, avatarIndex: 33 },
  { id: 'hs-34', name: 'Phạm Phương Nhi', gender: 'female', group: '3', role: 'Thành viên', points: 22, avatarIndex: 34 },
  { id: 'hs-35', name: 'Nguyễn Tiến Nam Phong', gender: 'male', group: '3', role: 'Thành viên', points: 20, avatarIndex: 35 },
  { id: 'hs-36', name: 'Nguyễn Nhật Phương', gender: 'female', group: '3', role: 'Thành viên', points: 25, avatarIndex: 36 },
  { id: 'hs-37', name: 'Đặng Tú Quỳnh', gender: 'female', group: '3', role: 'Thành viên', points: 23, avatarIndex: 37 },
  { id: 'hs-38', name: 'Lương Xuân Thành', gender: 'male', group: '3', role: 'Thành viên', points: 29, avatarIndex: 38 },
  { id: 'hs-39', name: 'Nguyễn Phương Thảo', gender: 'female', group: '3', role: 'Thành viên', points: 24, avatarIndex: 39 },
  { id: 'hs-40', name: 'Hà Duy Thắng', gender: 'male', group: '3', role: 'Thành viên', points: 19, avatarIndex: 40 },
  { id: 'hs-41', name: 'Nguyễn Anh Thư A', gender: 'female', group: '3', role: 'Thành viên', points: 22, avatarIndex: 41 },

  // TỔ 4
  { id: 'hs-42', name: 'Nguyễn Anh Thư', gender: 'female', group: '4', role: 'Tổ trưởng Tổ 4', points: 21, avatarIndex: 42 },
  { id: 'hs-43', name: 'Nguyễn Ngọc Bảo Tiên', gender: 'female', group: '4', role: 'Thành viên', points: 27, avatarIndex: 43 },
  { id: 'hs-45', name: 'Nguyễn Ngân Hà', gender: 'female', group: '4', role: 'Thành viên', points: 23, avatarIndex: 45 },
  { id: 'hs-46', name: 'Bùi Hoàng Trung', gender: 'male', group: '4', role: 'Tổ phó Tổ 4', points: 22, avatarIndex: 46 },
  { id: 'hs-47', name: 'Bùi Anh Tú', gender: 'male', group: '4', role: 'Thành viên', points: 20, avatarIndex: 47 },
  { id: 'hs-48', name: 'Vũ Thảo Vân', gender: 'female', group: '4', role: 'Thủ quỹ', points: 26, avatarIndex: 48 },
  { id: 'hs-49', name: 'Lương Thành Vũ', gender: 'male', group: '4', role: 'Thành viên', points: 19, avatarIndex: 49 },
  { id: 'hs-50', name: 'Vũ Phương Vy', gender: 'female', group: '4', role: 'Thành viên', points: 25, avatarIndex: 50 },
  { id: 'hs-51', name: 'Phạm Kha Vỹ', gender: 'male', group: '4', role: 'Thành viên', points: 18, avatarIndex: 51 },
  { id: 'hs-52', name: 'Đào Uyển Thư', gender: 'female', group: '4', role: 'Thành viên', points: 24, avatarIndex: 52 },
  { id: 'hs-53', name: 'Nhật Dương', gender: 'male', group: '4', role: 'Thành viên', points: 21, avatarIndex: 53 },
  { id: 'hs-54', name: 'Đoàn Văn Dũng', gender: 'male', group: '4', role: 'Lớp phó lao động', points: 20, avatarIndex: 54 }
];

export const INITIAL_LOGS: PointLog[] = [
  { id: 'log-1', studentId: 'hs-22', studentName: 'Phạm Bảo Linh', group: '2', points: 2, reason: 'Phát biểu bài xây dựng tiết học', timestamp: Date.now() - 3600000 * 2, authorRole: 'gvcn', authorName: 'GVCN Cô Ngô Thị Phương' },
  { id: 'log-2', studentId: 'hs-20', studentName: 'Nguyễn Bích Lam', group: '1', points: 1, reason: 'Trực nhật lớp sạch sẽ', timestamp: Date.now() - 3600000 * 1.8, authorRole: 'bcs', authorName: 'Lớp phó (Bùi Nguyễn Hải Nam)' },
  { id: 'log-3', studentId: 'hs-25', studentName: 'Phạm Ngọc Hà My', group: '3', points: 5, reason: 'Sáng tạo / Giải bài toán khó', timestamp: Date.now() - 3600000 * 1.5, authorRole: 'gvcn', authorName: 'GVCN Cô Ngô Thị Phương' },
  { id: 'log-4', studentId: 'hs-42', studentName: 'Nguyễn Anh Thư', group: '4', points: 2, reason: 'Chuẩn bị bài đầy đủ 100%', timestamp: Date.now() - 3600000, authorRole: 'bcs', authorName: 'Tổ trưởng Tổ 4 (Nguyễn Anh Thư)' }
];

const STORAGE_KEYS = {
  STUDENTS: 'classroom_students_v7c8_54',
  SETTINGS: 'classroom_settings_v1',
  LOGS: 'classroom_logs_v7c8',
  ATTENDANCE: 'classroom_attendance_v1',
  RULES: 'classroom_rules_v1',
  ACTIVE_OFFICER: 'classroom_active_officer_v1',
  MONTHLY_DATA: 'classroom_monthly_data_v1'
};

export function loadStoredRules(): ClassRule[] {
  try {
    const raw = readStorage(STORAGE_KEYS.RULES);
    if (!raw) return DEFAULT_CLASS_RULES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : invalidStoredData(STORAGE_KEYS.RULES);
  } catch {
    return DEFAULT_CLASS_RULES;
  }
}

export function saveStoredRules(rules: ClassRule[]) {
  try {
    writeStorage(STORAGE_KEYS.RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save rules to localStorage', e);
  }
}

export function loadStoredStudents(): Student[] {
  try {
    const raw = readStorage(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      writeStorage(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed: Student[] = JSON.parse(raw);
    if (!isStudentList(parsed)) { blockedKeys.add(STORAGE_KEYS.STUDENTS); reportStorage(STORAGE_KEYS.STUDENTS, 'Danh sách đã lưu không hợp lệ; dữ liệu gốc được giữ nguyên.'); throw new Error('Danh sách học sinh không hợp lệ'); }
    return parsed;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]) {
  try {
    writeStorage(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to localStorage', e);
  }
}

const ROLE_STORAGE_KEY = 'classroom_user_role_v1';

export function loadStoredOfficer(): ActiveOfficer | null {
  try {
    const raw = readStorage(STORAGE_KEYS.ACTIVE_OFFICER);
    if (!raw) return null;
    const parsed: ActiveOfficer = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredOfficer(officer: ActiveOfficer | null) {
  try {
    if (!officer) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_OFFICER);
    } else {
      writeStorage(STORAGE_KEYS.ACTIVE_OFFICER, JSON.stringify(officer));
    }
  } catch (e) {
    console.error('Failed to save active officer', e);
  }
}

export function loadStoredSettings(): ClassSettings {
  try {
    const raw = readStorage(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) invalidStoredData(STORAGE_KEYS.SETTINGS);
    const updated: ClassSettings = { ...DEFAULT_SETTINGS, ...parsed };
    if (!updated.gvcnPin) updated.gvcnPin = '123456';
    if (!updated.bcsPin) updated.bcsPin = '1234';
    if (updated.allowBcsScoring === undefined) updated.allowBcsScoring = true;
    if (!updated.bcsScope) updated.bcsScope = 'all';
    if (updated.requireBcsPin === undefined) updated.requireBcsPin = false;
    if (updated.allowBcsChangeGroup === undefined) updated.allowBcsChangeGroup = true;
    if (updated.requireLoginOnEntry === undefined) updated.requireLoginOnEntry = true;
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ClassSettings) {
  try {
    writeStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export const AUTH_SESSION_KEY = 'classroom_auth_session_v1';
export const AUTH_REMEMBER_KEY = 'classroom_auth_remember_v1';

export function checkIsAuthenticated(requireLoginOnEntry: boolean = true): boolean {
  try {
    // If the setting is disabled, user is treated as authenticated
    if (!requireLoginOnEntry) return true;
    
    // Check session storage first (valid for current browser tab session)
    if (sessionStorage.getItem(AUTH_SESSION_KEY) === 'true') {
      return true;
    }
    // Check if user previously marked "Remember login on this device"
    if (readStorage(AUTH_REMEMBER_KEY) === 'true') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function saveAuthenticationState(authenticated: boolean, rememberOnDevice: boolean = false) {
  try {
    if (authenticated) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      if (rememberOnDevice) {
        writeStorage(AUTH_REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(AUTH_REMEMBER_KEY);
      }
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_REMEMBER_KEY);
    }
  } catch (e) {
    console.error('Failed to save auth state', e);
  }
}

export function loadStoredRole(): UserRole {
  try {
    const r = readStorage(ROLE_STORAGE_KEY) as UserRole;
    if (r === 'gvcn' || r === 'bcs' || r === 'viewer') return r;
    return 'gvcn'; // Default to GVCN for quick administrative access
  } catch {
    return 'gvcn';
  }
}

export function saveStoredRole(role: UserRole) {
  try {
    writeStorage(ROLE_STORAGE_KEY, role);
  } catch (e) {
    console.error('Failed to save role', e);
  }
}

export function loadStoredLogs(): PointLog[] {
  try {
    const raw = readStorage(STORAGE_KEYS.LOGS);
    if (!raw) return INITIAL_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : invalidStoredData(STORAGE_KEYS.LOGS);
  } catch {
    return INITIAL_LOGS;
  }
}

export function saveStoredLogs(logs: PointLog[]) {
  try {
    writeStorage(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

export function loadStoredAttendance(): Record<string, AttendanceRecord> {
  try {
    const raw = readStorage(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) invalidStoredData(STORAGE_KEYS.ATTENDANCE);
    return parsed;
  } catch {
    return {};
  }
}

export function saveStoredAttendance(attendance: Record<string, AttendanceRecord>) {
  try {
    writeStorage(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  } catch (e) {
    console.error('Failed to save attendance', e);
  }
}

export function getRankTier(points: number): RankTier {
  if (points >= 30) return RANK_TIERS[3]; // Huyền Thoại
  if (points >= 25) return RANK_TIERS[2]; // Tinh Anh
  if (points >= 15) return RANK_TIERS[1]; // Chiến Binh
  return RANK_TIERS[0]; // Mầm Non
}

export function exportToCSV(students: Student[], settings: ClassSettings) {
  const sorted = [...students].sort((a, b) => b.points - a.points);
  
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
  csvContent += `BẢNG VÀNG THI ĐUA ${settings.className} - ${settings.schoolName}\n`;
  csvContent += `Giáo viên chủ nhiệm: ${settings.teacherName} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
  csvContent += 'Hạng,Họ và Tên,Tổ,Chức vụ,Giới tính,Tổng điểm,Danh hiệu\n';

  sorted.forEach((st, idx) => {
    const tier = getRankTier(st.points);
    const genderText = st.gender === 'male' ? 'Nam' : 'Nữ';
    csvContent += `${idx + 1},"${st.name}","Tổ ${st.group}","${st.role}","${genderText}",${st.points},"${tier.name} ${tier.icon}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bang_Vang_Thi_Dua_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAttendanceToCSV(students: Student[], attendance: Record<string, AttendanceRecord>, settings: ClassSettings) {
  let csvContent = '\uFEFF';
  csvContent += `BẢNG ĐIỂM DANH ${settings.className} - ${settings.schoolName}\n`;
  csvContent += `Ngày: ${new Date().toLocaleDateString('vi-VN')} | GVCN: ${settings.teacherName}\n\n`;
  csvContent += 'STT,Họ và Tên,Tổ,Chức vụ,Trạng thái điểm danh\n';

  const statusMap: Record<string, string> = {
    present: 'Có mặt',
    late: 'Đi muộn',
    excused: 'Có phép',
    unexcused: 'Không phép'
  };

  students.forEach((st, idx) => {
    const status = attendance[st.id]?.status || 'present';
    csvContent += `${idx + 1},"${st.name}","Tổ ${st.group}","${st.role}","${statusMap[status]}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Diem_Danh_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const DEFAULT_ACADEMIC_MONTHS = [
  { id: '2026-08', name: 'Tháng 8/2026', year: 2026, month: 8, theme: 'Tập trung & Khởi động năm học' },
  { id: '2026-09', name: 'Tháng 9/2026', year: 2026, month: 9, theme: 'Khai giảng & Tháng ATGT' },
  { id: '2026-10', name: 'Tháng 10/2026', year: 2026, month: 10, theme: 'Thi đua Chăm ngoan - Học tốt' },
  { id: '2026-11', name: 'Tháng 11/2026', year: 2026, month: 11, theme: 'Tri ân Thầy Cô - Ngày Nhà Giáo VN 20/11' },
  { id: '2026-12', name: 'Tháng 12/2026', year: 2026, month: 12, theme: 'Noi gương Chú bộ đội Cụ Hồ 22/12' },
  { id: '2027-01', name: 'Tháng 1/2027', year: 2027, month: 1, theme: 'Sơ kết Học kỳ 1 & Mừng Xuân mới' },
  { id: '2027-02', name: 'Tháng 2/2027', year: 2027, month: 2, theme: 'Thi đua Mừng Đảng Mừng Xuân' },
  { id: '2027-03', name: 'Tháng 3/2027', year: 2027, month: 3, theme: 'Tiến bước lên Đoàn 26/3' },
  { id: '2027-04', name: 'Tháng 4/2027', year: 2027, month: 4, theme: 'Mừng Non sông thống nhất 30/4' },
  { id: '2027-05', name: 'Tháng 5/2027', year: 2027, month: 5, theme: 'Bác Hồ kính yêu & Tổng kết năm học' }
];

export function createDefaultMonthlyStore(currentStudents: Student[], currentLogs: PointLog[]): MonthlyStore {
  const months: Record<string, MonthlyRecord> = {};
  
  DEFAULT_ACADEMIC_MONTHS.forEach(m => {
    const scores: Record<string, number> = {};
    if (m.id === '2026-09') {
      currentStudents.forEach(s => {
        scores[s.id] = s.points;
      });
      months[m.id] = {
        ...m,
        studentScores: scores,
        pointLogs: currentLogs,
        isArchived: false,
        note: 'Tháng đầu năm học mới. Toàn thể 54 học sinh tích cực rèn luyện thi đua.'
      };
    } else if (m.id === '2026-08') {
      // Month 8 sample archived month
      currentStudents.forEach((s, idx) => {
        scores[s.id] = 15 + ((idx * 2) % 15);
      });
      months[m.id] = {
        ...m,
        studentScores: scores,
        pointLogs: [],
        isArchived: true,
        archivedAt: new Date('2026-08-31').getTime(),
        note: 'Đã hoàn thành rèn luyện nề nếp và ổn định tổ chức đầu năm.'
      };
    } else {
      // Future months start with baseline 10 points
      currentStudents.forEach(s => {
        scores[s.id] = 10;
      });
      months[m.id] = {
        ...m,
        studentScores: scores,
        pointLogs: [],
        isArchived: false
      };
    }
  });

  return {
    activeMonthId: '2026-09',
    months
  };
}

export function loadStoredMonthlyData(fallbackStudents?: Student[], fallbackLogs?: PointLog[]): MonthlyStore {
  try {
    const raw = readStorage(STORAGE_KEYS.MONTHLY_DATA);
    if (!raw) {
      const defaultStore = createDefaultMonthlyStore(fallbackStudents || INITIAL_STUDENTS, fallbackLogs || INITIAL_LOGS);
      saveStoredMonthlyData(defaultStore);
      return defaultStore;
    }
    const parsed: MonthlyStore = JSON.parse(raw);
    if (!isMonthlyStore(parsed)) {
      blockedKeys.add(STORAGE_KEYS.MONTHLY_DATA);
      reportStorage(STORAGE_KEYS.MONTHLY_DATA, 'Dữ liệu tháng không hợp lệ; dữ liệu gốc được giữ nguyên.');
      throw new Error('Dữ liệu tháng không hợp lệ');
    }
    return parsed;
  } catch {
    return createDefaultMonthlyStore(fallbackStudents || INITIAL_STUDENTS, fallbackLogs || INITIAL_LOGS);
  }
}

export function saveStoredMonthlyData(store: MonthlyStore) {
  try {
    writeStorage(STORAGE_KEYS.MONTHLY_DATA, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save monthly store', e);
  }
}

export function exportMonthlyReportToCSV(month: MonthlyRecord, students: Student[], settings: ClassSettings) {
  const monthScores = month.studentScores || {};
  const sorted = [...students].map(st => ({
    ...st,
    points: monthScores[st.id] !== undefined ? monthScores[st.id] : st.points
  })).sort((a, b) => b.points - a.points);

  let csvContent = '\uFEFF';
  csvContent += `BÁO CÁO TỔNG KẾT THI ĐUA ${month.name.toUpperCase()}\n`;
  csvContent += `Lớp: ${settings.className} - Trường: ${settings.schoolName}\n`;
  csvContent += `GVCN: ${settings.teacherName} | Năm học: ${settings.academicYear}\n`;
  csvContent += `Chủ đề tháng: ${month.theme || 'Thi đua nề nếp & học tập'}\n`;
  csvContent += `Trạng thái: ${month.isArchived ? 'ĐÃ CHỐT KẾT QUẢ' : 'ĐANG THEO DÕI'}\n`;
  if (month.note) {
    csvContent += `Nhận xét của GVCN: "${month.note.replace(/"/g, '""')}"\n`;
  }
  csvContent += `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

  // 1. Group summary
  csvContent += 'BẢNG XẾP HẠNG 4 TỔ TRONG THÁNG\n';
  csvContent += 'Tổ,Sĩ số,Tổng điểm tháng,Điểm trung bình,Xếp loại tổ\n';
  const groupStats = (['1', '2', '3', '4'] as const).map(gId => {
    const mems = sorted.filter(s => s.group === gId);
    const total = mems.reduce((acc, m) => acc + m.points, 0);
    const avg = mems.length ? Number((total / mems.length).toFixed(1)) : 0;
    return { gId, total, avg, count: mems.length };
  }).sort((a, b) => b.total - a.total);

  groupStats.forEach((g, idx) => {
    const rankTitle = idx === 0 ? 'Tổ Xuất Sắc (Hạng 1)' : idx === 1 ? 'Hạng 2' : idx === 2 ? 'Hạng 3' : 'Hạng 4';
    csvContent += `Tổ ${g.gId},${g.count},${g.total},${g.avg},"${rankTitle}"\n`;
  });
  csvContent += '\n';

  // 2. Student rankings
  csvContent += 'BẢNG XẾP HẠNG CÁ NHÂN TRONG THÁNG\n';
  csvContent += 'Hạng,Họ và Tên,Tổ,Chức vụ,Giới tính,Tổng điểm tháng,Danh hiệu\n';
  sorted.forEach((st, idx) => {
    const tier = getRankTier(st.points);
    const genderText = st.gender === 'male' ? 'Nam' : 'Nữ';
    csvContent += `${idx + 1},"${st.name}","Tổ ${st.group}","${st.role}","${genderText}",${st.points},"${tier.name} ${tier.icon}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Tong_Ket_${month.id}_${settings.className.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
