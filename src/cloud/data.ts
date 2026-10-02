import {
  ClassroomBackup, DEFAULT_SETTINGS, INITIAL_LOGS, INITIAL_STUDENTS,
  createDefaultMonthlyStore, validateBackup
} from '../utils/storage';
import { DEFAULT_CLASS_RULES } from '../types';

export type CloudData = Required<ClassroomBackup>;

/** Chuẩn hoá mọi nguồn dữ liệu (mẫu, localStorage, JSON, Firebase) về đúng một hình dạng. */
export function normalizeData(input: ClassroomBackup): CloudData {
  validateBackup(input);
  const students = input.students;
  const monthlyStore = input.monthlyStore ?? createDefaultMonthlyStore(students, input.pointLogs ?? []);
  const active = monthlyStore.months[monthlyStore.activeMonthId];
  return JSON.parse(JSON.stringify({
    students: students.map(s => ({ ...s, points: active.studentScores[s.id] ?? s.points })),
    settings: { ...DEFAULT_SETTINGS, ...input.settings },
    pointLogs: active.pointLogs,
    attendance: input.attendance ?? {}, rules: input.rules ?? DEFAULT_CLASS_RULES, monthlyStore
  }));
}

export function emptyData(): CloudData {
  const now = new Date(); const year = now.getFullYear(); const month = now.getMonth() + 1;
  const id = `${year}-${String(month).padStart(2,'0')}`;
  return normalizeData({students: [], settings: {...DEFAULT_SETTINGS, className:'LỚP CỦA TÔI', schoolName:'', teacherName:'', requireLoginOnEntry:false},
    pointLogs: [], attendance:{}, rules:DEFAULT_CLASS_RULES,
    monthlyStore:{activeMonthId:id, months:{[id]:{id,name:`Tháng ${month}/${year}`,year,month,studentScores:{},pointLogs:[],isArchived:false}}}});
}

/** Dữ liệu mẫu dựng sẵn trong app: 54 học sinh lớp 7C8, nội quy, nhật ký và 10 tháng học. */
export function sampleData(): CloudData {
  const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  const logs = JSON.parse(JSON.stringify(INITIAL_LOGS));
  return normalizeData({
    students,
    settings: { ...DEFAULT_SETTINGS },
    pointLogs: logs,
    attendance: {},
    rules: JSON.parse(JSON.stringify(DEFAULT_CLASS_RULES)),
    monthlyStore: createDefaultMonthlyStore(students, logs)
  });
}

const LEGACY_KEYS = {
  students: 'classroom_students_v7c8_54',
  settings: 'classroom_settings_v1',
  pointLogs: 'classroom_logs_v7c8',
  attendance: 'classroom_attendance_v1',
  rules: 'classroom_rules_v1',
  monthlyStore: 'classroom_monthly_data_v1'
};

function readLocal(prefix: string, key: string) {
  const raw = localStorage.getItem(prefix + key);
  if (raw === null) return undefined;
  const parsed = JSON.parse(raw);
  return parsed ?? undefined;
}

/**
 * Đọc dữ liệu lớp đang nằm trong localStorage của trình duyệt này.
 * prefix rỗng = bản cũ trước khi có Firebase; `firebase:<uid>:` = bản nháp của chính tài khoản đó.
 */
export function readLocalClassroom(prefix = ''): CloudData | null {
  try {
    const students = readLocal(prefix, LEGACY_KEYS.students);
    if (!students) return null;
    return normalizeData({
      students,
      settings: readLocal(prefix, LEGACY_KEYS.settings),
      pointLogs: readLocal(prefix, LEGACY_KEYS.pointLogs),
      attendance: readLocal(prefix, LEGACY_KEYS.attendance),
      rules: readLocal(prefix, LEGACY_KEYS.rules),
      monthlyStore: readLocal(prefix, LEGACY_KEYS.monthlyStore)
    });
  } catch { return null; }
}

export const legacyLocalData = () => readLocalClassroom('');
export const deviceLocalData = (uid: string) => readLocalClassroom(`firebase:${uid}:`);

export function stableJson(value: unknown): string {
  function sort(v: any): any {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,sort(v[k])]));
    return v;
  }
  return JSON.stringify(sort(value));
}

export function countStudents(data: CloudData | null | undefined) {
  return data?.students.length ?? 0;
}

/** Mô tả ngắn một nguồn dữ liệu để thầy cô biết mình sắp đưa gì lên Firebase. */
export function describeData(data: CloudData): string {
  const months = Object.keys(data.monthlyStore.months).length;
  const active = data.monthlyStore.months[data.monthlyStore.activeMonthId];
  return `${data.students.length} học sinh · ${months} tháng · ${active?.pointLogs.length ?? 0} nhật ký tháng đang mở · ${data.settings.className}`;
}

export function downloadBackup(data: ClassroomBackup, name='SaoLuu_LopHoc') {
  const url=URL.createObjectURL(new Blob([JSON.stringify({...data,version:'4.0',exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`${name}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function firebaseMessage(error: any): string {
  const code=String(error?.code ?? '');
  const messages: Record<string,string> = {
    'auth/unauthorized-domain':'Tên miền này chưa được cho phép. Vào Authentication → Settings → Authorized domains để thêm tên miền web.',
    'auth/operation-not-allowed':'Chưa bật đăng nhập Google. Vào Authentication → Sign-in method → Google → Enable.',
    'auth/popup-blocked':'Trình duyệt chặn cửa sổ đăng nhập. Cho phép popup rồi bấm đăng nhập lại.',
    'auth/popup-closed-by-user':'Cửa sổ đăng nhập đã đóng. Bấm đăng nhập lại để tiếp tục.',
    'auth/cancelled-popup-request':'Đang có một cửa sổ đăng nhập khác. Hãy hoàn thành cửa sổ đó.',
    'auth/operation-not-supported-in-this-environment':'Trình duyệt không hỗ trợ cửa sổ đăng nhập. Ứng dụng sẽ chuyển sang cách đăng nhập chuyển trang.',
    'auth/invalid-api-key':'API key không hợp lệ hoặc bị hạn chế. Kiểm tra cấu hình dự án Firebase.',
    'auth/network-request-failed':'Không kết nối được dịch vụ đăng nhập. Kiểm tra mạng và thử lại.',
    'auth/too-many-requests':'Firebase tạm khoá do thử quá nhiều lần. Chờ vài phút rồi đăng nhập lại.',
    'auth/web-storage-unsupported':'Trình duyệt đang chặn lưu trữ cục bộ. Hãy tắt chế độ chặn cookie cho trang này.',
    'permission-denied':'Firestore từ chối quyền truy cập. Hãy Publish file firestore.rules đi kèm vào đúng dự án web-quan-ly-lop-gvcn.',
    'unauthenticated':'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại bằng Google.',
    'unavailable':'Chưa kết nối được Firebase. Thay đổi đang giữ trên máy này; kết nối mạng rồi bấm Lưu lại.',
    'deadline-exceeded':'Firebase phản hồi quá chậm. Thay đổi vẫn giữ trên máy này; bấm Lưu lại để thử tiếp.',
    'aborted':'Có thao tác lưu khác chen ngang. Bấm Lưu lại để thử tiếp.',
    'failed-precondition':'Firestore chưa sẵn sàng. Kiểm tra đã tạo database (default) trong dự án Firebase chưa.',
    'not-found':'Chưa tạo Cloud Firestore cho dự án này. Vào Firebase Console → Firestore → Create database.',
    'invalid-argument':'Dữ liệu gửi lên không hợp lệ hoặc vượt giới hạn một document của Firestore.',
    'resource-exhausted':'Firebase đã hết hạn mức. Hãy tải sao lưu JSON, kiểm tra Usage trong Firebase và thử lưu lại khi có hạn mức.',
    'conflict':'Có bản mới trên thiết bị khác. Tải bản nháp trước khi chọn nhận dữ liệu từ Firebase.'
  };
  return messages[code] ?? `${error?.message || 'Không thể kết nối Firebase.'}${code ? ` (${code})` : ''}`;
}
