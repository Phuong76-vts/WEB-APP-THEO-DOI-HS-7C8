export type Gender = 'male' | 'female';

export type GroupId = '1' | '2' | '3' | '4';

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'unexcused';

export type UserRole = 'gvcn' | 'bcs' | 'viewer';

export interface RoleInfo {
  role: UserRole;
  title: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  description: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  gvcn: {
    role: 'gvcn',
    title: 'Giáo Viên Chủ Nhiệm (GVCN)',
    badgeText: 'text-amber-900 font-black',
    badgeBg: 'bg-amber-400',
    badgeBorder: 'border-amber-300',
    icon: 'fa-crown',
    description: 'Toàn quyền quản trị hệ thống: Đánh giá cho điểm, quản lý học sinh, cài đặt lớp học và đặt lại điểm tuần.'
  },
  bcs: {
    role: 'bcs',
    title: 'Ban Cán Sự Lớp',
    badgeText: 'text-emerald-900 font-bold',
    badgeBg: 'bg-emerald-400',
    badgeBorder: 'border-emerald-300',
    icon: 'fa-star',
    description: 'Quyền đánh giá thi đua & xếp loại cho điểm các bạn trong lớp, sử dụng tiện ích tương tác và điểm danh.'
  },
  viewer: {
    role: 'viewer',
    title: 'Chế Độ Trình Chiếu (Chỉ Xem)',
    badgeText: 'text-slate-200 font-semibold',
    badgeBg: 'bg-slate-700/80',
    badgeBorder: 'border-slate-600',
    icon: 'fa-eye',
    description: 'Chỉ xem bảng thi đua và tiện ích, chống thao tác nhầm khi chiếu Tivi hoặc gửi phụ huynh xem.'
  }
};

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  group: GroupId;
  role: string; // Lớp trưởng, Lớp phó học tập, Tổ trưởng, Học sinh...
  points: number;
  avatarIndex?: number;
}

export interface PointLog {
  id: string;
  studentId: string;
  studentName: string;
  group: GroupId;
  points: number; // +2, +5, -2, etc.
  reason: string;
  timestamp: number;
  authorRole?: UserRole;
  authorName?: string;
}

export interface ActiveOfficer {
  id?: string;
  name: string;
  roleTitle: string;
  group?: GroupId;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt: number;
}

export interface ClassSettings {
  className: string;
  schoolName: string;
  teacherName: string;
  academicYear: string;
  soundEnabled: boolean;
  gvcnPin: string;
  bcsPin: string;
  allowBcsScoring?: boolean; // GVCN phân quyền cho cán bộ lớp nhập điểm (true/false)
  bcsScope?: 'all' | 'own_group'; // Phạm vi nhập điểm: toàn lớp hoặc chỉ tổ phụ trách
  requireBcsPin?: boolean; // Yêu cầu mã PIN cho Ban cán sự (mặc định false: 1-chạm vào ngay)
  allowBcsChangeGroup?: boolean; // Cán bộ lớp được quyền đổi tổ cho thành viên (mặc định true)
  requireLoginOnEntry?: boolean; // Bắt buộc đăng nhập khi vào ứng dụng (mặc định true)
}

export interface MonthlyRecord {
  id: string; // e.g. '2026-09', '2026-10'
  name: string; // e.g. 'Tháng 9/2026'
  year: number; // 2026
  month: number; // 9
  theme?: string; // e.g. 'Khai giảng & Tháng ATGT'
  studentScores: Record<string, number>; // studentId -> points in this month
  pointLogs: PointLog[]; // logs for this month
  attendance?: Record<string, AttendanceRecord>;
  isArchived?: boolean; // đã chốt thi đua tháng
  archivedAt?: number;
  note?: string; // nhận xét tổng kết tháng của GVCN
}

export interface MonthlyStore {
  activeMonthId: string;
  months: Record<string, MonthlyRecord>;
}

export interface RankTier {
  id: string;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'sprout',
    name: 'Mầm Non',
    icon: '🌱',
    minPoints: -999,
    maxPoints: 14,
    color: 'emerald',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-700',
    description: 'Khởi đầu tích lũy điểm số'
  },
  {
    id: 'warrior',
    name: 'Chiến Binh',
    icon: '⚡',
    minPoints: 15,
    maxPoints: 24,
    color: 'blue',
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-700',
    description: 'Hăng hái thi đua'
  },
  {
    id: 'elite',
    name: 'Tinh Anh',
    icon: '🌟',
    minPoints: 25,
    maxPoints: 29,
    color: 'amber',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-700',
    description: 'Xuất sắc tiêu biểu'
  },
  {
    id: 'legend',
    name: 'Huyền Thoại',
    icon: '⭐',
    minPoints: 30,
    color: 'purple',
    badgeBg: 'bg-purple-100 border-purple-300 shadow-sm',
    badgeText: 'text-purple-700 font-bold',
    description: 'Gương mẫu đỉnh cao'
  }
];

export interface ScorePreset {
  title: string;
  points: number;
  icon: string;
  type: 'reward' | 'penalty';
  color: string;
}

export const REWARD_PRESETS: ScorePreset[] = [
  { title: 'Phát biểu bài', points: 2, icon: 'fa-hand', type: 'reward', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { title: 'Sáng tạo / Toán hay', points: 5, icon: 'fa-lightbulb', type: 'reward', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { title: 'Hợp tác nhóm', points: 3, icon: 'fa-users', type: 'reward', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { title: 'Bài tập đầy đủ', points: 2, icon: 'fa-book-open', type: 'reward', color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { title: 'Điểm 9 - 10', points: 5, icon: 'fa-award', type: 'reward', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { title: 'Dự án STEM', points: 10, icon: 'fa-rocket', type: 'reward', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' }
];

export const PENALTY_PRESETS: ScorePreset[] = [
  { title: 'Mất trật tự', points: -2, icon: 'fa-comment-slash', type: 'penalty', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { title: 'Đi muộn / Sai trang phục', points: -2, icon: 'fa-user-clock', type: 'penalty', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { title: 'Chưa làm bài tập', points: -3, icon: 'fa-file-circle-xmark', type: 'penalty', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { title: 'Làm việc riêng', points: -5, icon: 'fa-eye-slash', type: 'penalty', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' }
];

export type RuleCategory = 'conduct' | 'reward' | 'penalty' | 'duty';

export interface ClassRule {
  id: string;
  category: RuleCategory;
  title: string;
  points?: number; // e.g. +2, +5, -2, or undefined for conduct/duty
  icon: string;
  description: string;
  roleScope: string; // e.g. 'Toàn thể học sinh', 'Ban cán sự chấm', 'GVCN phụ trách'
}

export const DEFAULT_CLASS_RULES: ClassRule[] = [
  // 1. CONDUCT (Nề nếp & 5 Điều Bác Hồ dạy)
  {
    id: 'rule-bac-ho',
    category: 'conduct',
    title: '5 Điều Bác Hồ Dạy Thiếu Niên Nhi Đồng',
    icon: 'fa-heart',
    description: '1. Yêu Tổ quốc, yêu đồng bào. 2. Học tập tốt, lao động tốt. 3. Đoàn kết tốt, kỷ luật tốt. 4. Giữ gìn vệ sinh thật tốt. 5. Khiêm tốn, thật thà, dũng cảm.',
    roleScope: 'Toàn thể học sinh lớp 7C8'
  },
  {
    id: 'rule-trang-phuc',
    category: 'conduct',
    title: 'Trang Phục & Tác Phong Học Đường',
    icon: 'fa-shirt',
    description: 'Mặc đúng đồng phục của trường THCS Võ Thị Sáu, đeo khăn quàng đỏ đầy đủ, đi giày/dép có quai hậu, đầu tóc gọn gàng chuẩn nếp học sinh.',
    roleScope: 'Toàn thể học sinh lớp 7C8'
  },
  {
    id: 'rule-chuyen-can',
    category: 'conduct',
    title: 'Chuyên Cần & Đúng Giờ',
    icon: 'fa-clock',
    description: 'Có mặt tại lớp trước giờ truy bài 15 phút. Nghỉ học phải có đơn xin phép hoặc phụ huynh liên hệ trực tiếp với GVCN Cô Ngô Thị Phương.',
    roleScope: 'Toàn thể học sinh lớp 7C8'
  },
  {
    id: 'rule-ung-xu',
    category: 'conduct',
    title: 'Văn Hóa Ứng Xử & Kính Thầy Mến Bạn',
    icon: 'fa-hands-holding-child',
    description: 'Lễ phép chào hỏi thầy cô giáo, nhân viên nhà trường; hòa đồng, tương trợ giúp đỡ bạn bè cùng tiến bộ; nói không với bạo lực và phát ngôn tiêu cực.',
    roleScope: 'Toàn thể học sinh lớp 7C8'
  },
  {
    id: 'rule-ve-sinh',
    category: 'conduct',
    title: 'Giữ Gìn Vệ Sinh & Bảo Vệ Của Công',
    icon: 'fa-broom',
    description: 'Giữ lớp học luôn sáng - xanh - sạch - đẹp. Không ăn quà vặt trong lớp, vứt rác đúng nơi quy định, bảo vệ bàn ghế, bảng tương tác Tivi và thiết bị học tập.',
    roleScope: 'Tổ trực nhật & toàn lớp'
  },

  // 2. REWARD (Barem Điểm cộng thi đua)
  {
    id: 'rule-phat-bieu',
    category: 'reward',
    title: 'Phát biểu bài hăng hái, xây dựng bài',
    points: 2,
    icon: 'fa-hand',
    description: 'Chủ động giơ tay phát biểu ý kiến, trả lời câu hỏi bài học đúng và tự tin trước lớp.',
    roleScope: 'Ban cán sự & GVCN chấm'
  },
  {
    id: 'rule-diem-muoi',
    category: 'reward',
    title: 'Bài kiểm tra đạt điểm 9 hoặc điểm 10',
    points: 5,
    icon: 'fa-award',
    description: 'Đạt điểm giỏi trong các bài kiểm tra miệng, 15 phút hoặc bài đánh giá thường xuyên.',
    roleScope: 'Ban cán sự & GVCN chấm'
  },
  {
    id: 'rule-toan-hay',
    category: 'reward',
    title: 'Giải bài tập khó / Sáng tạo độc đáo',
    points: 5,
    icon: 'fa-lightbulb',
    description: 'Tìm ra phương pháp giải sáng tạo, phát hiện ý tưởng mới hoặc hỗ trợ nhóm làm bài xuất sắc.',
    roleScope: 'Ban cán sự & GVCN chấm'
  },
  {
    id: 'rule-bai-tap',
    category: 'reward',
    title: 'Vở sạch chữ đẹp, đủ bài tập về nhà',
    points: 2,
    icon: 'fa-book-open',
    description: 'Hoàn thành đầy đủ 100% bài tập về nhà, vở ghi chép cẩn thận, trình bày sạch sẽ.',
    roleScope: 'Lớp phó học tập chấm'
  },
  {
    id: 'rule-giup-ban',
    category: 'reward',
    title: 'Đôi bạn cùng tiến, kèm bạn học tập',
    points: 3,
    icon: 'fa-user-group',
    description: 'Tận tình hướng dẫn bạn học chưa hiểu, hỗ trợ bạn yếu vươn lên đạt kết quả tốt hơn.',
    roleScope: 'Tổ trưởng ghi nhận'
  },
  {
    id: 'rule-truc-nhat',
    category: 'reward',
    title: 'Trực nhật xuất sắc, lớp sạch sẽ',
    points: 5,
    icon: 'fa-sparkles',
    description: 'Tổ trực nhật đến sớm, quét dọn sạch sẽ, kê ngay ngắn bàn ghế, lau bảng sạch trước giờ học.',
    roleScope: 'Lớp phó lao động chấm'
  },
  {
    id: 'rule-stem-doi',
    category: 'reward',
    title: 'Dự án STEM / Hoạt động Đội xuất sắc',
    points: 10,
    icon: 'fa-rocket',
    description: 'Đạt thành tích nổi bật trong phong trào Đoàn - Đội, văn nghệ, thể thao, hội thi STEM cấp trường.',
    roleScope: 'GVCN xét duyệt'
  },
  {
    id: 'rule-viec-tot',
    category: 'reward',
    title: 'Làm việc tốt, nhặt được của rơi trả người mất',
    points: 5,
    icon: 'fa-shield-heart',
    description: 'Thể hiện tính trung thực cao đẹp, dũng cảm cứu giúp bạn hoặc nhặt đồ đánh rơi nộp lại nhà trường.',
    roleScope: 'GVCN & Lớp trưởng ghi nhận'
  },

  // 3. PENALTY (Barem Nhắc nhở & Điểm trừ)
  {
    id: 'rule-mat-trat-tu',
    category: 'penalty',
    title: 'Nói chuyện riêng, làm mất trật tự',
    points: -2,
    icon: 'fa-comment-slash',
    description: 'Gây ồn ào ảnh hưởng tiết học, bị thầy cô giáo bộ môn nhắc nhở trong giờ.',
    roleScope: 'Ban cán sự chấm'
  },
  {
    id: 'rule-di-muon',
    category: 'penalty',
    title: 'Đi học muộn, trễ giờ truy bài',
    points: -2,
    icon: 'fa-user-clock',
    description: 'Đến sau thời gian quy định mà không có lý do chính đáng hoặc không có giấy báo từ phụ huynh.',
    roleScope: 'Lớp phó chấm điểm danh'
  },
  {
    id: 'rule-sai-tac-phong',
    category: 'penalty',
    title: 'Sai đồng phục / Thiếu khăn quàng',
    points: -2,
    icon: 'fa-triangle-exclamation',
    description: 'Không mặc đúng đồng phục lớp 7C8, quên khăn quàng, dép lê hoặc đầu tóc không đúng chuẩn.',
    roleScope: 'Ban cán sự kiểm tra'
  },
  {
    id: 'rule-quen-bai-tap',
    category: 'penalty',
    title: 'Chưa làm bài tập về nhà / Quên sách vở',
    points: -3,
    icon: 'fa-file-circle-xmark',
    description: 'Không chuẩn bị bài trước ở nhà, quên đem dụng cụ học tập hoặc sách giáo khoa môn học.',
    roleScope: 'Lớp phó học tập chấm'
  },
  {
    id: 'rule-viec-rieng',
    category: 'penalty',
    title: 'Làm việc riêng / Dùng thiết bị trái phép',
    points: -5,
    icon: 'fa-mobile-screen',
    description: 'Sử dụng điện thoại di động, đọc truyện, chơi game hoặc ăn quà vặt trong giờ học.',
    roleScope: 'Ban cán sự & GVCN xử lý'
  },
  {
    id: 'rule-bo-truc-nhat',
    category: 'penalty',
    title: 'Không trực nhật theo phân công của tổ',
    points: -5,
    icon: 'fa-trash-can',
    description: 'Trốn trực nhật, không thực hiện phần việc vệ sinh lớp được lớp phó lao động giao.',
    roleScope: 'Lớp phó lao động chấm'
  },
  {
    id: 'rule-vi-pham-nang',
    category: 'penalty',
    title: 'Nói tục, cãi vã, vi phạm kỷ luật nặng',
    points: -10,
    icon: 'fa-skull-crossbones',
    description: 'Có hành vi thiếu tôn trọng thầy cô giáo, xích mích xô xát bạn bè, gian lận thi cử.',
    roleScope: 'GVCN xử lý trực tiếp'
  },

  // 4. DUTY (Quy định Phân công & Quyền hạn)
  {
    id: 'duty-gvcn',
    category: 'duty',
    title: 'Giáo Viên Chủ Nhiệm (Cô Ngô Thị Phương)',
    icon: 'fa-chalkboard-user',
    description: 'Chỉ đạo toàn diện, ban hành và cập nhật nội quy, phê duyệt bảng tổng sắp thi đua tuần/tháng, vinh danh các ngôi sao xuất sắc và liên hệ gia đình khi cần thiết.',
    roleScope: 'Toàn quyền điều hành cao nhất'
  },
  {
    id: 'duty-lop-truong',
    category: 'duty',
    title: 'Lớp Trưởng (Nguyễn Minh Quân)',
    icon: 'fa-star',
    description: 'Bao quát nề nếp chung của 4 tổ, điều hành các buổi sinh hoạt lớp 15 phút đầu giờ, nhắc nhở các tổ trưởng và thay mặt lớp báo cáo với GVCN.',
    roleScope: 'Đại diện tập thể lớp 7C8'
  },
  {
    id: 'duty-hoc-tap',
    category: 'duty',
    title: 'Lớp Phó Học Tập & Văn Thể',
    icon: 'fa-pen-ruler',
    description: 'Theo dõi tình hình học bài và làm bài tập về nhà mỗi sáng, tổng hợp số điểm tốt của các bạn trong tuần, tổ chức hoạt động văn hóa - thể thao cho lớp.',
    roleScope: 'Phụ trách học tập & phong trào'
  },
  {
    id: 'duty-to-truong',
    category: 'duty',
    title: 'Tổ Trưởng (Tổ 1, 2, 3, 4)',
    icon: 'fa-users-gear',
    description: 'Theo dõi sát sao từng thành viên trong tổ, ghi nhận điểm cộng khi bạn phát biểu/làm việc tốt và điểm trừ khi vi phạm nề nếp, đảm bảo công bằng - khách quan.',
    roleScope: 'Phụ trách thi đua từng tổ'
  },
  {
    id: 'duty-thanh-vien',
    category: 'duty',
    title: 'Thành Viên Học Sinh Toàn Lớp',
    icon: 'fa-graduation-cap',
    description: 'Chấp hành nghiêm túc 100% nội quy, tự giác phấn đấu rèn luyện tích điểm từ Mầm Non -> Chiến Binh -> Tinh Anh -> Huyền Thoại, có quyền thắc mắc nếu điểm chưa chuẩn.',
    roleScope: 'Toàn thể học sinh lớp 7C8'
  }
];

