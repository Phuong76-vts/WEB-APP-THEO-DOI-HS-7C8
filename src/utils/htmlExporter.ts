import { Student, ClassSettings } from '../types';
import type { ClassroomBackup } from './storage';

export function downloadStandaloneHtml(students: Student[], settings: ClassSettings, extra: Omit<ClassroomBackup, 'students' | 'settings'> = {}) {
  const jsonForScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const studentsJson = jsonForScript(students);
  const settingsJson = jsonForScript(settings);
  const extraJson = jsonForScript(extra);
  const exportKeyJson = JSON.stringify('classroom_html_v3_' + Date.now() + '_' + Math.random().toString(36).slice(2));

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.className} - ${settings.schoolName} | Quản Lý Lớp Học & Thi Đua Số</title>
  <!-- Tailwind CSS & FontAwesome CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- Canvas Confetti CDN -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Be Vietnam Pro', sans-serif; }
    .heading-font { font-family: 'Nunito', sans-serif; }
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    @keyframes pulse-subtle {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- TOP HEADER -->
  <header class="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl shadow-inner">
          🏫
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black heading-font tracking-wide text-white" id="header-class-name">${settings.className} - ${settings.schoolName}</h1>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow">NĂM HỌC 2026 - 2027</span>
          </div>
          <p class="text-xs sm:text-sm text-indigo-100 flex items-center gap-2">
            <span><i class="fa-solid fa-chalkboard-user text-amber-300"></i> GVCN: <b class="text-white" id="header-teacher-name">${settings.teacherName}</b></span>
            <span class="opacity-60">|</span>
            <span id="live-clock" class="font-mono text-xs opacity-90"></span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <button id="btn-sound" onclick="toggleSound()" title="Bật/Tắt âm thanh" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition flex items-center gap-2">
          <i id="sound-icon" class="fa-solid fa-volume-high text-amber-300"></i>
          <span class="hidden sm:inline" id="sound-text">Âm thanh: Bật</span>
        </button>

        <button onclick="toggleFullscreen()" title="Chế độ toàn màn hình (Tivi/Máy chiếu)" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition flex items-center gap-2">
          <i class="fa-solid fa-expand text-sky-300"></i>
          <span class="hidden md:inline">Toàn màn hình</span>
        </button>

        <button onclick="openSettingsModal()" title="Cài đặt hệ thống & Quản lý dữ liệu" class="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow transition flex items-center gap-2">
          <i class="fa-solid fa-gear"></i>
          <span class="hidden sm:inline">Cài đặt</span>
        </button>
      </div>
    </div>

    <!-- 4 TABS NAVIGATION -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <nav class="flex space-x-1 sm:space-x-3 overflow-x-auto pb-1 text-sm font-bold no-scrollbar">
        <button onclick="switchTab('class')" id="tab-btn-class" class="tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-amber-400 bg-white/15 text-white">
          <i class="fa-solid fa-users text-amber-300"></i>
          <span>1. LỚP HỌC & GHI ĐIỂM</span>
          <span id="badge-total-students" class="ml-1 px-2 py-0.5 rounded-full text-xs bg-white text-indigo-800 font-black">${students.length}</span>
        </button>
        <button onclick="switchTab('leaderboard')" id="tab-btn-leaderboard" class="tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-transparent text-indigo-100 hover:bg-white/10">
          <i class="fa-solid fa-trophy text-yellow-300"></i>
          <span>2. BẢNG VÀNG THI ĐUA</span>
        </button>
        <button onclick="switchTab('attendance')" id="tab-btn-attendance" class="tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-transparent text-indigo-100 hover:bg-white/10">
          <i class="fa-solid fa-clipboard-check text-emerald-300"></i>
          <span>3. ĐIỂM DANH & CHUYÊN CẦN</span>
        </button>
        <button onclick="switchTab('utilities')" id="tab-btn-utilities" class="tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-transparent text-indigo-100 hover:bg-white/10">
          <i class="fa-solid fa-wand-magic-sparkles text-pink-300"></i>
          <span>4. BỘ TIỆN ÍCH TƯƠNG TÁC</span>
        </button>
        <button onclick="switchTab('rules')" id="tab-btn-rules" class="tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-transparent text-indigo-100 hover:bg-white/10">
          <i class="fa-solid fa-scale-balanced text-sky-300"></i>
          <span>5. NỘI QUY & BAREM (RULES)</span>
        </button>
      </nav>
    </div>
  </header>

  <!-- MAIN VIEWPORT -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
    
    <!-- TAB 1: LỚP HỌC & GHI ĐIỂM -->
    <section id="tab-class" class="tab-content space-y-6">
      <!-- Toolbar Filter & Search -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Group Filter Buttons -->
        <div class="flex flex-wrap items-center gap-2" id="group-filter-container">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1"><i class="fa-solid fa-filter"></i> Lọc Tổ:</span>
          <button onclick="filterGroup('all')" class="group-filter-btn active px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-indigo-600 text-white shadow-sm" data-group="all">Tất cả (${students.length})</button>
          <button onclick="filterGroup('1')" class="group-filter-btn px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200" data-group="1">Tổ 1 (${students.filter(s => s.group === '1').length})</button>
          <button onclick="filterGroup('2')" class="group-filter-btn px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200" data-group="2">Tổ 2 (${students.filter(s => s.group === '2').length})</button>
          <button onclick="filterGroup('3')" class="group-filter-btn px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200" data-group="3">Tổ 3 (${students.filter(s => s.group === '3').length})</button>
          <button onclick="filterGroup('4')" class="group-filter-btn px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200" data-group="4">Tổ 4 (${students.filter(s => s.group === '4').length})</button>
        </div>

        <!-- Search input -->
        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="text" id="search-student-input" oninput="handleSearch(this.value)" placeholder="Tìm kiếm học sinh..." class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50">
          </div>
          <button onclick="openAddStudentModal()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition flex items-center gap-1.5 shrink-0">
            <i class="fa-solid fa-user-plus"></i>
            <span class="hidden sm:inline">Thêm học sinh</span>
          </button>
        </div>
      </div>

      <!-- Instruction banner -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-xs sm:text-sm text-blue-900 flex items-center justify-between gap-2 shadow-xs">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0"><i class="fa-solid fa-lightbulb"></i></span>
          <span><b>Hướng dẫn nhanh:</b> Nhấp vào thẻ học sinh để mở bảng cộng/trừ điểm chi tiết, hoặc bấm nút <b>"+2đ"</b> nhanh ở góc thẻ để thưởng phát biểu tức thì!</span>
        </div>
        <span class="text-xs font-semibold px-2 py-1 bg-white rounded-lg border border-blue-200 shadow-xs hidden md:inline">20 Học sinh</span>
      </div>

      <!-- Students Grid -->
      <div id="students-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Rendered by JS -->
      </div>
    </section>

    <!-- TAB 2: BẢNG VÀNG THI ĐUA -->
    <section id="tab-leaderboard" class="tab-content hidden space-y-8">
      <!-- PODIUM TOP 3 -->
      <div class="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div class="text-center relative z-10 mb-6">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-black mb-2">
            <i class="fa-solid fa-crown text-amber-400"></i> VINH DANH NGÔI SAO ${settings.className}
          </div>
          <h2 class="text-2xl sm:text-3xl font-black heading-font tracking-wide">BỤC VINH DANH TOP 3 XUẤT SẮC NHẤT</h2>
          <p class="text-xs sm:text-sm text-indigo-200 mt-1">Cập nhật điểm thi đua và danh hiệu liên tục theo thời gian thực</p>
        </div>

        <div id="podium-container" class="grid grid-cols-3 gap-2 sm:gap-6 max-w-3xl mx-auto items-end pt-8 pb-4 relative z-10">
          <!-- Rendered by JS -->
        </div>

        <div class="text-center mt-4">
          <button onclick="triggerConfettiRain()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg transition transform hover:scale-105 inline-flex items-center gap-2">
            <i class="fa-solid fa-sparkles"></i> Bắn Pháo Hoa Chúc Mừng Lớp 🎉
          </button>
        </div>
      </div>

      <!-- GROUPS STATS & TIERS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Group rankings (2 cols) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold"><i class="fa-solid fa-chart-simple"></i></span>
              <h3 class="text-lg font-bold text-slate-800">BẢNG XẾP HẠNG THI ĐUA 4 TỔ</h3>
            </div>
            <span class="text-xs font-semibold text-slate-500">Tự động tính điểm TB</span>
          </div>

          <div id="group-stats-container" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Rendered by JS -->
          </div>
        </div>

        <!-- Tier system explanation -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div class="flex items-center gap-2 border-b pb-3">
            <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold"><i class="fa-solid fa-medal"></i></span>
            <h3 class="text-lg font-bold text-slate-800">HỆ THỐNG DANH HIỆU</h3>
          </div>

          <div class="space-y-3">
            <div class="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">⭐</span>
                <div>
                  <div class="font-black text-purple-900 text-sm">Huyền Thoại</div>
                  <div class="text-xs text-purple-700">Gương mẫu đỉnh cao</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-600 text-white">≥ 30 điểm</span>
            </div>

            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌟</span>
                <div>
                  <div class="font-black text-amber-900 text-sm">Tinh Anh</div>
                  <div class="text-xs text-amber-700">Xuất sắc tiêu biểu</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-600 text-white">25 - 29 điểm</span>
            </div>

            <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">⚡</span>
                <div>
                  <div class="font-black text-blue-900 text-sm">Chiến Binh</div>
                  <div class="text-xs text-blue-700">Hăng hái thi đua</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white">15 - 24 điểm</span>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌱</span>
                <div>
                  <div class="font-black text-emerald-900 text-sm">Mầm Non</div>
                  <div class="text-xs text-emerald-700">Khởi đầu tích lũy</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white">&lt; 15 điểm</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FULL LEADERBOARD TABLE -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-list-ol text-indigo-600"></i> BẢNG TỔNG SẮP ĐIỂM TOÀN BỘ ${settings.className}
            </h3>
            <p class="text-xs text-slate-500">Xếp hạng từ cao xuống thấp theo tổng điểm thi đua</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="exportCSVReport()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition flex items-center gap-2">
              <i class="fa-solid fa-file-excel"></i> Xuất file CSV / Excel
            </button>
          </div>
        </div>

        <div class="overflow-x-auto custom-scroll">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider border-y border-slate-200">
                <th class="py-3 px-4 text-center w-16">Hạng</th>
                <th class="py-3 px-4">Họ và Tên</th>
                <th class="py-3 px-4 text-center">Tổ</th>
                <th class="py-3 px-4">Chức vụ</th>
                <th class="py-3 px-4 text-center">Danh hiệu</th>
                <th class="py-3 px-4 text-right">Tổng điểm</th>
                <th class="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody id="leaderboard-table-body" class="divide-y divide-slate-100">
              <!-- Rendered by JS -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 3: ĐIỂM DANH & CHUYÊN CẦN -->
    <section id="tab-attendance" class="tab-content hidden space-y-6">
      <!-- Attendance Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div class="text-2xl font-black text-emerald-600" id="stat-present-count">20</div>
            <div class="text-xs font-bold text-slate-500 uppercase">Có mặt</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div>
            <div class="text-2xl font-black text-amber-600" id="stat-late-count">0</div>
            <div class="text-xs font-bold text-slate-500 uppercase">Đi muộn</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl font-bold">
            <i class="fa-solid fa-envelope-open-text"></i>
          </div>
          <div>
            <div class="text-2xl font-black text-sky-600" id="stat-excused-count">0</div>
            <div class="text-xs font-bold text-slate-500 uppercase">Có phép</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">
            <i class="fa-solid fa-user-xmark"></i>
          </div>
          <div>
            <div class="text-2xl font-black text-rose-600" id="stat-unexcused-count">0</div>
            <div class="text-xs font-bold text-slate-500 uppercase">Không phép</div>
          </div>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-slate-700"><i class="fa-solid fa-calendar-day text-indigo-600 mr-1.5"></i> Điểm danh ngày hôm nay</span>
          <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg" id="attendance-today-date"></span>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button onclick="markAllPresent()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition flex items-center gap-2">
            <i class="fa-solid fa-check-double"></i> Cả Lớp Có Mặt (1 Chạm)
          </button>
          <button onclick="exportAttendanceReport()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition flex items-center gap-2">
            <i class="fa-solid fa-download"></i> Xuất Báo Cáo
          </button>
        </div>
      </div>

      <!-- Status instruction legend -->
      <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-bold p-3 bg-slate-100/80 rounded-xl border border-slate-200">
        <span class="text-slate-500">Quy ước chạm đổi trạng thái:</span>
        <span class="inline-flex items-center gap-1 text-emerald-700"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> 1. Có mặt</span>
        <span>➔</span>
        <span class="inline-flex items-center gap-1 text-amber-700"><span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> 2. Đi muộn</span>
        <span>➔</span>
        <span class="inline-flex items-center gap-1 text-sky-700"><span class="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> 3. Có phép</span>
        <span>➔</span>
        <span class="inline-flex items-center gap-1 text-rose-700"><span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> 4. Không phép</span>
      </div>

      <!-- Attendance Cards Grid -->
      <div id="attendance-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Rendered by JS -->
      </div>
    </section>

    <!-- TAB 4: BỘ TIỆN ÍCH TƯƠNG TÁC -->
    <section id="tab-utilities" class="tab-content hidden space-y-8">
      
      <!-- GRID 2 COLS: RANDOM PICKER & SMART TIMER -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- UTILITY 1: VÒNG QUAY MAY MẮN / BỐC THĂM -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg"><i class="fa-solid fa-dice"></i></span>
              <div>
                <h3 class="font-bold text-slate-800 text-lg">VÒNG QUAY MAY MẮN</h3>
                <p class="text-xs text-slate-500">Gọi tên ngẫu nhiên phát biểu bài</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">Hiệu ứng pháo hoa</span>
          </div>

          <!-- Wheel / Canvas area -->
          <div class="flex flex-col items-center justify-center py-4 relative">
            <!-- Big Slot Machine / Wheel Display -->
            <div id="wheel-display" class="w-full max-w-sm h-48 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 border-4 border-amber-400/80 shadow-xl flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
              <div class="text-amber-400 text-4xl mb-2" id="wheel-avatar">🎯</div>
              <div class="text-2xl sm:text-3xl font-black text-white heading-font tracking-wide" id="wheel-winner-name">SẴN SÀNG QUAY</div>
              <div class="text-xs sm:text-sm text-indigo-300 mt-1 font-semibold" id="wheel-winner-info">Bấm nút bên dưới để chọn ngẫu nhiên</div>
            </div>
          </div>

          <!-- Wheel Controls -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="wheel-filter-present" checked class="rounded text-indigo-600 focus:ring-indigo-500">
                <span>Chỉ bốc thăm bạn có mặt</span>
              </label>
              <select id="wheel-filter-group" class="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50">
                <option value="all">Tất cả các Tổ</option>
                <option value="1">Chỉ Tổ 1</option>
                <option value="2">Chỉ Tổ 2</option>
                <option value="3">Chỉ Tổ 3</option>
                <option value="4">Chỉ Tổ 4</option>
              </select>
            </div>

            <button id="btn-spin-wheel" onclick="spinWheel()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-black text-base shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2">
              <i class="fa-solid fa-rotate text-lg"></i> BỐC THĂM NGAY!
            </button>
          </div>
        </div>

        <!-- UTILITY 2: ĐỒNG HỒ ĐẾM NGƯỢC THÔNG MINH -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg"><i class="fa-solid fa-stopwatch"></i></span>
              <div>
                <h3 class="font-bold text-slate-800 text-lg">ĐỒNG HỒ ĐẾM NGƯỢC</h3>
                <p class="text-xs text-slate-500">Hẹn giờ thảo luận nhóm & làm bài</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Chuông báo 3 hồi</span>
          </div>

          <!-- Big Countdown Display -->
          <div class="flex flex-col items-center justify-center py-4">
            <div id="timer-display-box" class="w-full max-w-sm h-48 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950 border-4 border-indigo-500/80 shadow-xl flex flex-col items-center justify-center text-center p-4">
              <div class="font-mono text-5xl sm:text-6xl font-black text-amber-400 tracking-wider drop-shadow-md" id="timer-numbers">
                03:00
              </div>
              <div class="text-xs font-bold text-indigo-200 mt-2 uppercase tracking-widest" id="timer-status-text">Thời gian làm bài</div>
            </div>
          </div>

          <!-- Timer Presets & Controls -->
          <div class="space-y-3 pt-2">
            <div class="grid grid-cols-4 gap-2">
              <button onclick="setTimerPreset(60)" class="py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">1 Phút</button>
              <button onclick="setTimerPreset(180)" class="py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">3 Phút</button>
              <button onclick="setTimerPreset(300)" class="py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">5 Phút</button>
              <button onclick="setTimerPreset(600)" class="py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">10 Phút</button>
            </div>

            <div class="flex items-center gap-3">
              <button id="btn-timer-toggle" onclick="toggleTimer()" class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-play"></i> <span id="timer-btn-text">Bắt đầu</span>
              </button>
              <button onclick="resetTimer()" class="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-rotate-left"></i> Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- UTILITY 3: CHIA NHÓM TỰ ĐỘNG -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl"><i class="fa-solid fa-people-group"></i></span>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">CHIA NHÓM TỰ ĐỘNG (HOẠT ĐỘNG TRẢI NGHIỆM / STEM)</h3>
              <p class="text-xs text-slate-500">Xáo trộn ngẫu nhiên học sinh thành các nhóm cân bằng</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>Số nhóm:</span>
              <div class="flex items-center gap-1">
                <button onclick="generateTeams(2)" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600">2</button>
                <button onclick="generateTeams(3)" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600">3</button>
                <button onclick="generateTeams(4)" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold">4</button>
                <button onclick="generateTeams(5)" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600">5</button>
                <button onclick="generateTeams(6)" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600">6</button>
              </div>
            </div>

            <button onclick="generateTeams(4)" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5">
              <i class="fa-solid fa-shuffle"></i> Xáo Trộn Lại
            </button>
          </div>
        </div>

        <div id="teams-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <!-- Rendered by JS -->
        </div>
      </div>

      <!-- UTILITY 4: NHẬT KÝ GHI ĐIỂM -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg"><i class="fa-solid fa-clock-rotate-left"></i></span>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">NHẬT KÝ GHI ĐIỂM HÔM NAY</h3>
              <p class="text-xs text-slate-500">Lịch sử khen thưởng và nhắc nhở chi tiết</p>
            </div>
          </div>
          <button onclick="clearLogs()" class="text-xs text-slate-400 hover:text-rose-600 font-semibold transition">Xóa lịch sử</button>
        </div>

        <div id="logs-container" class="space-y-2.5 max-h-80 overflow-y-auto custom-scroll pr-1">
          <!-- Rendered by JS -->
        </div>
      </div>

    </section>

    <!-- TAB 5: NỘI QUY & BAREM THI ĐUA (RULES) -->
    <section id="tab-rules" class="tab-content hidden space-y-6">
      <!-- Rules Header Card -->
      <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-black">
              <i class="fa-solid fa-scale-balanced"></i> QUY CHẾ CHUẨN MỰC SƯ PHẠM
            </div>
            <h2 class="text-2xl sm:text-3xl font-black tracking-wide">
              QUY CHẾ THI ĐUA & NỘI QUY LỚP ${settings.className}
            </h2>
            <p class="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
              Trường ${settings.schoolName} • Năm học ${settings.academicYear} • GVCN: ${settings.teacherName}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button onclick="window.print()" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer backdrop-blur-xs">
              <i class="fa-solid fa-print text-sky-300"></i> In Bảng Nội Quy
            </button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-100">
          <div class="flex items-center gap-2 font-semibold">
            <i class="fa-solid fa-heart text-rose-400"></i>
            <span>Thực hiện nghiêm túc <b>5 Điều Bác Hồ Dạy</b>: Yêu Tổ quốc, chăm học, kỷ luật, vệ sinh và trung thực.</span>
          </div>
          <div>GVCN: <b class="text-white">${settings.teacherName}</b></div>
        </div>
      </div>

      <!-- 5 Điều Bác Hồ Dạy Card -->
      <div class="bg-gradient-to-r from-amber-500 to-rose-600 rounded-2xl p-5 text-white shadow-md">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black text-lg shadow-sm">
            <i class="fa-solid fa-star"></i>
          </div>
          <div>
            <h3 class="text-base font-black uppercase tracking-wide">5 ĐIỀU BÁC HỒ DẠY THIẾU NIÊN, NHI ĐỒNG</h3>
            <p class="text-xs text-amber-100">Kim chỉ nam cho mọi hoạt động rèn luyện của học sinh lớp ${settings.className}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs text-slate-900 font-bold">
          <div class="bg-white/90 p-3 rounded-xl shadow-xs">
            <span class="text-rose-600 block text-xs font-black mb-1">ĐIỀU 1</span>
            Yêu Tổ quốc, yêu đồng bào
          </div>
          <div class="bg-white/90 p-3 rounded-xl shadow-xs">
            <span class="text-rose-600 block text-xs font-black mb-1">ĐIỀU 2</span>
            Học tập tốt, lao động tốt
          </div>
          <div class="bg-white/90 p-3 rounded-xl shadow-xs">
            <span class="text-rose-600 block text-xs font-black mb-1">ĐIỀU 3</span>
            Đoàn kết tốt, kỷ luật tốt
          </div>
          <div class="bg-white/90 p-3 rounded-xl shadow-xs">
            <span class="text-rose-600 block text-xs font-black mb-1">ĐIỀU 4</span>
            Giữ gìn vệ sinh thật tốt
          </div>
          <div class="bg-white/90 p-3 rounded-xl shadow-xs">
            <span class="text-rose-600 block text-xs font-black mb-1">ĐIỀU 5</span>
            Khiêm tốn, thật thà, dũng cảm
          </div>
        </div>
      </div>

      <!-- 3 Columns Barem Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Barem Điểm Cộng -->
        <div class="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-black text-emerald-800 flex items-center gap-2 text-sm">
              <i class="fa-solid fa-award text-emerald-600"></i> BAREM KHEN THƯỞNG (+)
            </h3>
            <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Tích điểm</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Đạt Điểm 9 - 10</b>
                <span class="text-slate-500 text-[11px]">Kiểm tra miệng, 15 phút, giữa kỳ, cuối kỳ</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black shrink-0">+2đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Hăng hái phát biểu xây dựng bài</b>
                <span class="text-slate-500 text-[11px]">Được giáo viên bộ môn khen ngợi</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black shrink-0">+1đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Làm việc tốt, nhặt được của rơi</b>
                <span class="text-slate-500 text-[11px]">Giúp đỡ bạn tiến bộ trong học tập</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black shrink-0">+2đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Đạt giải phong trào / TDTT</b>
                <span class="text-slate-500 text-[11px]">Văn nghệ, thể thao, thi đua cấp trường</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black shrink-0">+5đ</span>
            </div>
          </div>
        </div>

        <!-- Barem Điểm Trừ -->
        <div class="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-black text-rose-800 flex items-center gap-2 text-sm">
              <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> BAREM NHẮC NHỞ (-)
            </h3>
            <span class="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Trừ điểm</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Đi học muộn</b>
                <span class="text-slate-500 text-[11px]">Đến sau tiếng trống truy bài hoặc trống vào tiết</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shrink-0">-2đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Không làm bài tập về nhà</b>
                <span class="text-slate-500 text-[11px]">Thiếu vở ghi hoặc bài tập theo yêu cầu bộ môn</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shrink-0">-2đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Nói chuyện, mất trật tự</b>
                <span class="text-slate-500 text-[11px]">Bị thầy cô nhắc nhở hoặc ghi sổ đầu bài</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shrink-0">-2đ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <div>
                <b class="text-slate-800 block">Sai quy định đồng phục / Khăn quàng</b>
                <span class="text-slate-500 text-[11px]">Không đeo khăn quàng, quên thẻ hoặc phù hiệu</span>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shrink-0">-1đ</span>
            </div>
          </div>
        </div>

        <!-- Quy định Ban Cán Sự -->
        <div class="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-black text-amber-900 flex items-center gap-2 text-sm">
              <i class="fa-solid fa-user-shield text-amber-600"></i> PHÂN CÔNG BAN CÁN SỰ
            </h3>
            <span class="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Trách nhiệm</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <b class="text-slate-800 block">Lớp Trưởng: Quản lý chung</b>
              <p class="text-slate-600 text-[11px] mt-0.5">Bao quát nề nếp toàn lớp, điều hành 15 phút đầu giờ và tiết sinh hoạt.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <b class="text-slate-800 block">Lớp Phó Học Tập & Lao Động</b>
              <p class="text-slate-600 text-[11px] mt-0.5">Kiểm tra bài tập đầu giờ, đôn đốc trực nhật lớp sạch sẽ trước 7h00 sáng.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <b class="text-slate-800 block">4 Tổ Trưởng: Theo dõi thi đua tổ</b>
              <p class="text-slate-600 text-[11px] mt-0.5">Theo dõi chấm điểm học sinh tổ mình hàng ngày, báo cáo tổng hợp thứ 6.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <b class="text-slate-800 block">GVCN: Thẩm định & Khen thưởng</b>
              <p class="text-slate-600 text-[11px] mt-0.5">Quyết định tuyên dương Bảng Vàng và trao thưởng hàng tuần / tháng.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- FOOTER -->
  <footer class="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>Hệ Thống Quản Lý Lớp Học & Thi Đua Số • <b>${settings.className} - ${settings.schoolName}</b></div>
      <div>Giáo viên chủ nhiệm: <b>${settings.teacherName}</b> • Tự động lưu LocalStorage 100% Offline</div>
    </div>
  </footer>

  <!-- MODAL: GHI ĐIỂM THI ĐUA (REWARD & PENALTY) -->
  <div id="modal-score" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 hidden p-4">
    <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in border border-slate-100">
      <div class="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl" id="modal-student-avatar">👦</div>
          <div>
            <h3 class="text-lg font-black text-white" id="modal-student-name">Nguyễn Minh Quân</h3>
            <p class="text-xs text-indigo-100 flex items-center gap-2">
              <span id="modal-student-group">Tổ 1</span> • <span id="modal-student-role">Lớp trưởng</span> • <span class="font-bold text-amber-300" id="modal-student-points">32 điểm</span>
            </p>
          </div>
        </div>
        <button onclick="closeScoreModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">✕</button>
      </div>

      <div class="p-5 space-y-5">
        <!-- KHEN THƯỞNG -->
        <div>
          <div class="text-xs font-black uppercase text-emerald-700 tracking-wider mb-2.5 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-plus"></i> KHEN THƯỞNG (ĐIỂM CỘNG)
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="applyPresetScore(2, 'Phát biểu bài')" class="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-hand mr-1.5 text-emerald-600"></i> Phát biểu bài</span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[11px]">+2đ</span>
            </button>
            <button onclick="applyPresetScore(5, 'Sáng tạo / Giải toán hay')" class="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-lightbulb mr-1.5 text-amber-600"></i> Sáng tạo / Toán hay</span>
              <span class="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[11px]">+5đ</span>
            </button>
            <button onclick="applyPresetScore(3, 'Hợp tác nhóm tốt')" class="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-users mr-1.5 text-blue-600"></i> Hợp tác nhóm</span>
              <span class="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[11px]">+3đ</span>
            </button>
            <button onclick="applyPresetScore(2, 'Bài tập đầy đủ chu đáo')" class="p-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-book-open mr-1.5 text-teal-600"></i> Bài tập đầy đủ</span>
              <span class="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[11px]">+2đ</span>
            </button>
            <button onclick="applyPresetScore(5, 'Điểm kiểm tra 9 - 10')" class="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-award mr-1.5 text-rose-600"></i> Điểm 9 - 10</span>
              <span class="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[11px]">+5đ</span>
            </button>
            <button onclick="applyPresetScore(10, 'Dự án STEM xuất sắc')" class="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-rocket mr-1.5 text-purple-600"></i> Dự án STEM</span>
              <span class="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[11px]">+10đ</span>
            </button>
          </div>
        </div>

        <!-- NHẮC NHỞ -->
        <div>
          <div class="text-xs font-black uppercase text-rose-700 tracking-wider mb-2.5 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-minus"></i> NHẮC NHỞ (ĐIỂM TRỪ)
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="applyPresetScore(-2, 'Mất trật tự trong giờ học')" class="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-comment-slash mr-1.5 text-rose-600"></i> Mất trật tự</span>
              <span class="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[11px]">-2đ</span>
            </button>
            <button onclick="applyPresetScore(-2, 'Đi muộn / Sai trang phục')" class="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-user-clock mr-1.5 text-amber-600"></i> Đi muộn/Trang phục</span>
              <span class="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[11px]">-2đ</span>
            </button>
            <button onclick="applyPresetScore(-3, 'Chưa hoàn thành bài tập')" class="p-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-file-circle-xmark mr-1.5 text-orange-600"></i> Chưa làm bài tập</span>
              <span class="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[11px]">-3đ</span>
            </button>
            <button onclick="applyPresetScore(-5, 'Làm việc riêng trong giờ')" class="p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold transition flex items-center justify-between text-left">
              <span><i class="fa-solid fa-eye-slash mr-1.5 text-red-600"></i> Làm việc riêng</span>
              <span class="px-1.5 py-0.5 rounded bg-red-600 text-white text-[11px]">-5đ</span>
            </button>
          </div>
        </div>

        <!-- TÙY CHỈNH -->
        <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
          <div class="text-xs font-bold text-slate-700">Tùy chỉnh điểm & lý do riêng:</div>
          <div class="flex gap-2">
            <input type="number" id="custom-points-input" placeholder="Điểm (+/-)" class="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-bold text-center">
            <input type="text" id="custom-reason-input" placeholder="Nhập lý do cụ thể..." class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-sm">
            <button onclick="applyCustomScore()" class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition">Áp dụng</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL: CÀI ĐẶT & QUẢN LÝ DỮ LIỆU -->
  <div id="modal-settings" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 hidden p-4">
    <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
      <div class="bg-slate-800 text-white p-5 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400"><i class="fa-solid fa-sliders"></i></span>
          <h3 class="text-lg font-bold">CÀI ĐẶT & QUẢN LÝ HỆ THỐNG</h3>
        </div>
        <button onclick="closeSettingsModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">✕</button>
      </div>

      <div class="p-6 space-y-6 overflow-y-auto custom-scroll flex-1">
        <!-- Thông tin lớp học -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase text-slate-500 tracking-wider">Thông tin lớp học & Giáo viên</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Tên Lớp</label>
              <input type="text" id="settings-classname" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold" value="${settings.className}">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Tên Trường</label>
              <input type="text" id="settings-schoolname" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold" value="${settings.schoolName}">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-600 mb-1">Giáo viên chủ nhiệm</label>
              <input type="text" id="settings-teachername" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold" value="${settings.teacherName}">
            </div>
          </div>
          <button onclick="saveClassSettings()" class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition">Lưu thông tin lớp học</button>
        </div>

        <hr class="border-slate-200">

        <!-- Quản lý dữ liệu -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase text-slate-500 tracking-wider">Quản lý thi đua & Dữ liệu</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onclick="resetWeekPoints()" class="p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-rotate-left text-amber-600"></i> Đặt lại điểm về 0 (Đầu tuần mới)
            </button>
            <button onclick="resetToDefaultSample()" class="p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-arrows-rotate text-blue-600"></i> Nạp lại mẫu 20 HS lớp 7C8
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button onclick="backupToJson()" class="p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-file-arrow-down text-emerald-600"></i> Sao lưu JSON
            </button>
            <label class="p-3 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-solid fa-file-arrow-up text-indigo-600"></i> Khôi phục JSON
              <input type="file" id="restore-json-input" accept=".json" class="hidden" onchange="restoreFromJson(this)">
            </label>
          </div>
        </div>

        <hr class="border-slate-200">

        <!-- Nhập danh sách hàng loạt -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase text-slate-500 tracking-wider">Nhập danh sách học sinh hàng loạt</h4>
          <p class="text-xs text-slate-500">Dán danh sách học sinh từ Word/Excel (Mỗi dòng một tên):</p>
          <textarea id="bulk-import-text" rows="4" placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C" class="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono"></textarea>
          <button onclick="bulkImportStudents()" class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow transition">Nhập vào danh sách lớp</button>
        </div>
      </div>
    </div>
  </div>

  <!-- JAVASCRIPT ENGINE -->
  <script>
    // --- 1. DATA STATE & STORAGE ---
    let students = ${studentsJson};
    let settings = ${settingsJson};
    const initialExtra = ${extraJson};
    let attendance = initialExtra.attendance || {};
    let pointLogs = initialExtra.pointLogs || [];
    let rules = initialExtra.rules || [];
    let monthlyStore = initialExtra.monthlyStore || null;
    const storageKey = ${exportKeyJson};
    const initialSnapshot = JSON.stringify({students, settings, attendance, pointLogs, rules, monthlyStore});
    let storageBlocked = false;
    let currentActiveStudent = null;
    let selectedGroupFilter = 'all';
    let searchQuery = '';
    let soundEnabled = true;

    function showStorageError(message) {
      let banner = document.getElementById('storage-error');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'storage-error';
        banner.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fee2e2;color:#991b1b;padding:16px;font-weight:bold';
        document.body.prepend(banner);
      }
      banner.textContent = message;
    }
    function validSnapshot(data) {
      return data && Array.isArray(data.students) && data.students.every(s => s && typeof s.id === 'string' && typeof s.name === 'string' && Number.isFinite(s.points));
    }
    function useSnapshot(data) {
      students = data.students;
      settings = data.settings || settings;
      attendance = data.attendance || {};
      pointLogs = data.pointLogs || [];
      rules = data.rules || [];
      monthlyStore = data.monthlyStore || null;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        const data = JSON.parse(raw);
        if (!validSnapshot(data)) throw new Error('Invalid saved data');
        useSnapshot(data);
      }
    } catch (e) {
      storageBlocked = true;
      showStorageError('Không đọc được dữ liệu đã lưu. Dữ liệu gốc được giữ nguyên; hãy khôi phục từ bản sao lưu JSON.');
    }

    function snapshot() {
      if (monthlyStore && monthlyStore.months[monthlyStore.activeMonthId]) {
        const month = monthlyStore.months[monthlyStore.activeMonthId];
        if (!month.isArchived) {
          month.studentScores = Object.fromEntries(students.map(s => [s.id, s.points]));
          month.pointLogs = pointLogs;
        }
      }
      return {version: '3.0', students, settings, attendance, pointLogs, rules, monthlyStore, exportedAt: new Date().toISOString()};
    }
    function saveState() {
      try {
        if (storageBlocked) throw new Error('Protected original data');
        localStorage.setItem(storageKey, JSON.stringify(snapshot()));
        document.getElementById('storage-error')?.remove();
        return true;
      } catch (e) {
        showStorageError('Chưa lưu được dữ liệu. Hãy sao lưu JSON trước khi đóng trang.');
        return false;
      }
    }

    // --- 2. WEB AUDIO API SYNTHESIZER ---
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playTingTing() {
      if (!soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    function playGentleReminder() {
      if (!soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(370, now);
      osc.frequency.setValueAtTime(293.66, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    function playTimerBell() {
      if (!soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      [0, 0.4, 0.8].forEach(offset => {
        const now = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('sound-icon').className = soundEnabled ? 'fa-solid fa-volume-high text-amber-300' : 'fa-solid fa-volume-xmark text-slate-300';
      document.getElementById('sound-text').innerText = soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt';
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // --- 3. TIERS & HELPERS ---
    function getTier(pts) {
      if (pts >= 30) return { name: 'Huyền Thoại', icon: '⭐', bg: 'bg-purple-100 text-purple-700 border-purple-300' };
      if (pts >= 25) return { name: 'Tinh Anh', icon: '🌟', bg: 'bg-amber-100 text-amber-700 border-amber-300' };
      if (pts >= 15) return { name: 'Chiến Binh', icon: '⚡', bg: 'bg-blue-100 text-blue-700 border-blue-300' };
      return { name: 'Mầm Non', icon: '🌱', bg: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
    }

    // --- 4. RENDER TAB 1: CLASSROOM ---
    function renderClassroom() {
      const container = document.getElementById('students-grid');
      const badgeTotal = document.getElementById('badge-total-students');
      if (badgeTotal) badgeTotal.innerText = students.length;

      const filtered = students.filter(st => {
        const matchGroup = selectedGroupFilter === 'all' || st.group === selectedGroupFilter;
        const matchSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchGroup && matchSearch;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 font-semibold">Không tìm thấy học sinh nào phù hợp.</div>';
        return;
      }

      container.innerHTML = filtered.map(st => {
        const tier = getTier(st.points);
        const avatar = st.gender === 'female' ? '👧' : '👦';
        return \`
          <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 transition transform hover:-translate-y-0.5 relative group flex flex-col justify-between">
            <button onclick="event.stopPropagation(); quickAddScore('\${st.id}', 2)" title="Cộng nhanh +2 điểm phát biểu" class="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center gap-1 z-10">
              <i class="fa-solid fa-plus text-[10px]"></i>2đ
            </button>

            <div class="cursor-pointer" onclick="openScoreModal('\${st.id}')">
              <div class="flex items-center gap-3">
                <div class="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  \${avatar}
                </div>
                <div class="min-w-0 flex-1 pr-10">
                  <h4 class="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition">\${st.name}</h4>
                  <div class="text-xs text-slate-500 font-medium truncate">\${st.role}</div>
                  <span class="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">Tổ \${st.group}</span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border \${tier.bg}">
                  \${tier.icon} \${tier.name}
                </span>
                <div class="flex items-center gap-1">
                  <span class="text-xs text-slate-400">Điểm:</span>
                  <span class="font-black text-base \${st.points >= 25 ? 'text-amber-600' : 'text-indigo-600'}">\${st.points}</span>
                </div>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function filterGroup(grp) {
      selectedGroupFilter = grp;
      document.querySelectorAll('.group-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-group') === grp) {
          btn.className = 'group-filter-btn active px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-indigo-600 text-white shadow-sm';
        } else {
          btn.className = 'group-filter-btn px-3.5 py-1.5 rounded-xl text-sm font-bold transition bg-slate-100 text-slate-700 hover:bg-slate-200';
        }
      });
      renderClassroom();
    }

    function handleSearch(val) {
      searchQuery = val.trim();
      renderClassroom();
    }

    // --- 5. SCORE MODAL LOGIC ---
    function openScoreModal(studentId) {
      const st = students.find(s => s.id === studentId);
      if (!st) return;
      currentActiveStudent = st;

      document.getElementById('modal-student-avatar').innerText = st.gender === 'female' ? '👧' : '👦';
      document.getElementById('modal-student-name').innerText = st.name;
      document.getElementById('modal-student-group').innerText = 'Tổ ' + st.group;
      document.getElementById('modal-student-role').innerText = st.role;
      document.getElementById('modal-student-points').innerText = st.points + ' điểm';

      document.getElementById('custom-points-input').value = '';
      document.getElementById('custom-reason-input').value = '';

      document.getElementById('modal-score').classList.remove('hidden');
    }

    function closeScoreModal() {
      document.getElementById('modal-score').classList.add('hidden');
      currentActiveStudent = null;
    }

    function applyPresetScore(pts, reason) {
      if (!currentActiveStudent) return;
      modifyStudentPoints(currentActiveStudent.id, pts, reason);
      closeScoreModal();
    }

    function applyCustomScore() {
      if (!currentActiveStudent) return;
      const pts = parseInt(document.getElementById('custom-points-input').value);
      const reason = document.getElementById('custom-reason-input').value.trim() || (pts > 0 ? 'Khen thưởng giáo viên' : 'Nhắc nhở học tập');
      if (isNaN(pts)) return;
      modifyStudentPoints(currentActiveStudent.id, pts, reason);
      closeScoreModal();
    }

    function quickAddScore(studentId, pts) {
      modifyStudentPoints(studentId, pts, 'Phát biểu bài xây dựng tiết học');
    }

    function modifyStudentPoints(studentId, delta, reason) {
      if (monthlyStore?.months[monthlyStore.activeMonthId]?.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trên bản web rồi xuất HTML mới để chỉnh sửa.'); return; }
      const st = students.find(s => s.id === studentId);
      if (!st) return;
      st.points += delta;

      // Sound
      if (delta > 0) playTingTing();
      else playGentleReminder();

      // Log
      pointLogs.unshift({
        id: 'log-' + Date.now(),
        studentId: st.id,
        studentName: st.name,
        group: st.group,
        points: delta,
        reason: reason,
        timestamp: Date.now()
      });

      saveState();
      renderClassroom();
      renderLeaderboard();
      renderLogs();
    }

    // --- 6. RENDER TAB 2: LEADERBOARD ---
    function renderLeaderboard() {
      const sorted = [...students].sort((a, b) => b.points - a.points);
      
      // Podium top 3
      const podium = document.getElementById('podium-container');
      if (sorted.length >= 3) {
        const top1 = sorted[0];
        const top2 = sorted[1];
        const top3 = sorted[2];

        podium.innerHTML = \`
          <!-- TOP 2 (BẠC) -->
          <div class="flex flex-col items-center">
            <div class="text-3xl mb-1">\${top2.gender === 'female' ? '👧' : '👦'}</div>
            <div class="font-bold text-xs sm:text-sm text-center truncate max-w-[100px] sm:max-w-none text-slate-200">\${top2.name}</div>
            <div class="text-xs font-black text-slate-300">\${top2.points} đ</div>
            <div class="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-2xl flex flex-col items-center justify-center text-slate-800 font-black shadow-lg mt-2">
              <span class="text-xl sm:text-2xl">🥈</span>
              <span class="text-xs sm:text-sm uppercase tracking-wider">HẠNG 2</span>
            </div>
          </div>

          <!-- TOP 1 (VÀNG) -->
          <div class="flex flex-col items-center">
            <div class="text-4xl text-amber-400 animate-bounce mb-1">👑</div>
            <div class="text-4xl mb-1">\${top1.gender === 'female' ? '👧' : '👦'}</div>
            <div class="font-black text-sm sm:text-base text-center truncate max-w-[120px] sm:max-w-none text-amber-300">\${top1.name}</div>
            <div class="text-sm font-black text-amber-400">\${top1.points} đ</div>
            <div class="w-full h-32 sm:h-44 bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 rounded-t-2xl flex flex-col items-center justify-center text-slate-900 font-black shadow-2xl mt-2 border-t-2 border-yellow-200">
              <span class="text-2xl sm:text-3xl">🥇</span>
              <span class="text-xs sm:text-sm uppercase tracking-wider font-extrabold">QUÁN QUÂN</span>
            </div>
          </div>

          <!-- TOP 3 (ĐỒNG) -->
          <div class="flex flex-col items-center">
            <div class="text-3xl mb-1">\${top3.gender === 'female' ? '👧' : '👦'}</div>
            <div class="font-bold text-xs sm:text-sm text-center truncate max-w-[100px] sm:max-w-none text-slate-200">\${top3.name}</div>
            <div class="text-xs font-black text-amber-200">\${top3.points} đ</div>
            <div class="w-full h-20 sm:h-24 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-2xl flex flex-col items-center justify-center text-amber-100 font-black shadow-lg mt-2">
              <span class="text-xl sm:text-2xl">🥉</span>
              <span class="text-xs sm:text-sm uppercase tracking-wider">HẠNG 3</span>
            </div>
          </div>
        \`;
      }

      // Group comparison cards
      const groupContainer = document.getElementById('group-stats-container');
      const groups = ['1', '2', '3', '4'];
      const groupData = groups.map(gId => {
        const members = students.filter(s => s.group === gId);
        const total = members.reduce((sum, s) => sum + s.points, 0);
        const avg = members.length ? (total / members.length).toFixed(1) : 0;
        return { gId, total, avg, count: members.length };
      }).sort((a, b) => b.total - a.total);

      groupContainer.innerHTML = groupData.map((gd, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';
        return \`
          <div class="p-4 rounded-2xl border \${idx === 0 ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">\${medal}</span>
                <span class="font-black text-slate-800 text-sm">TỔ \${gd.gId}</span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded font-bold \${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}">Hạng \${idx + 1}</span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <div>
                <div class="text-xs text-slate-500">Tổng điểm thi đua</div>
                <div class="text-xl font-black text-indigo-700">\${gd.total} đ</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">Điểm TB / bạn</div>
                <div class="text-sm font-bold text-slate-700">\${gd.avg} đ</div>
              </div>
            </div>
          </div>
        \`;
      }).join('');

      // Leaderboard table
      const tbody = document.getElementById('leaderboard-table-body');
      tbody.innerHTML = sorted.map((st, idx) => {
        const tier = getTier(st.points);
        const rankIcon = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : (idx + 1);
        return \`
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-3 px-4 text-center font-bold \${idx < 3 ? 'text-amber-600' : 'text-slate-500'}">\${rankIcon}</td>
            <td class="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
              <span>\${st.gender === 'female' ? '👧' : '👦'}</span>
              <span>\${st.name}</span>
            </td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">Tổ \${st.group}</span></td>
            <td class="py-3 px-4 text-slate-600 text-xs font-medium">\${st.role}</td>
            <td class="py-3 px-4 text-center">
              <span class="px-2 py-0.5 rounded-full text-xs font-bold border \${tier.bg}">\${tier.icon} \${tier.name}</span>
            </td>
            <td class="py-3 px-4 text-right font-black text-indigo-600 text-base">\${st.points}</td>
            <td class="py-3 px-4 text-center">
              <button onclick="openScoreModal('\${st.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition">Chấm điểm</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function triggerConfettiRain() {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }

    function exportCSVReport() {
      let csv = '\\uFEFF';
      csv += 'BẢNG VÀNG THI ĐUA ' + settings.className + ' - ' + settings.schoolName + '\\n';
      csv += 'GVCN: ' + settings.teacherName + ' | Ngày: ' + new Date().toLocaleDateString('vi-VN') + '\\n\\n';
      csv += 'Hạng,Họ và Tên,Tổ,Chức vụ,Tổng điểm,Danh hiệu\\n';

      const sorted = [...students].sort((a, b) => b.points - a.points);
      sorted.forEach((st, idx) => {
        const tier = getTier(st.points);
        csv += \`\${idx + 1},"\${st.name}","Tổ \${st.group}","\${st.role}",\${st.points},"\${tier.name}"\\n\`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bang_Vang_' + settings.className.replace(/\\s+/g, '_') + '.csv';
      a.click();
    }

    // --- 7. RENDER TAB 3: ATTENDANCE ---
    const ATT_STATES = ['present', 'late', 'excused', 'unexcused'];
    const ATT_MAP = {
      present: { text: 'Có mặt', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
      late: { text: 'Đi muộn', bg: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
      excused: { text: 'Có phép', bg: 'bg-sky-50 text-sky-700 border-sky-300', dot: 'bg-sky-500' },
      unexcused: { text: 'Không phép', bg: 'bg-rose-50 text-rose-700 border-rose-300', dot: 'bg-rose-500' }
    };

    function renderAttendance() {
      const container = document.getElementById('attendance-grid');
      const dateElem = document.getElementById('attendance-today-date');
      if (dateElem) dateElem.innerText = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      let presentCount = 0, lateCount = 0, excusedCount = 0, unexcusedCount = 0;

      students.forEach(st => {
        const status = attendance[st.id]?.status || 'present';
        if (status === 'present') presentCount++;
        else if (status === 'late') lateCount++;
        else if (status === 'excused') excusedCount++;
        else if (status === 'unexcused') unexcusedCount++;
      });

      document.getElementById('stat-present-count').innerText = presentCount;
      document.getElementById('stat-late-count').innerText = lateCount;
      document.getElementById('stat-excused-count').innerText = excusedCount;
      document.getElementById('stat-unexcused-count').innerText = unexcusedCount;

      container.innerHTML = students.map(st => {
        const status = attendance[st.id]?.status || 'present';
        const config = ATT_MAP[status];
        return \`
          <div onclick="cycleAttendance('\${st.id}')" class="bg-white rounded-2xl p-4 shadow-sm border \${config.bg} cursor-pointer hover:shadow-md transition transform active:scale-98 flex items-center justify-between select-none">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                \${st.gender === 'female' ? '👧' : '👦'}
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm truncate">\${st.name}</h4>
                <div class="text-[11px] text-slate-500">Tổ \${st.group} • \${st.role}</div>
              </div>
            </div>

            <span class="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 \${config.bg}">
              <span class="w-2 h-2 rounded-full \${config.dot}"></span> \${config.text}
            </span>
          </div>
        \`;
      }).join('');
    }

    function cycleAttendance(studentId) {
      const curr = attendance[studentId]?.status || 'present';
      const nextIdx = (ATT_STATES.indexOf(curr) + 1) % ATT_STATES.length;
      attendance[studentId] = { studentId, status: ATT_STATES[nextIdx], updatedAt: Date.now() };
      saveState();
      renderAttendance();
    }

    function markAllPresent() {
      students.forEach(st => {
        attendance[st.id] = { studentId: st.id, status: 'present', updatedAt: Date.now() };
      });
      playTingTing();
      saveState();
      renderAttendance();
    }

    function exportAttendanceReport() {
      let csv = '\\uFEFF';
      csv += 'BÁO CÁO ĐIỂM DANH ' + settings.className + '\\n';
      csv += 'Ngày: ' + new Date().toLocaleDateString('vi-VN') + '\\n\\n';
      csv += 'STT,Họ và Tên,Tổ,Trạng thái\\n';

      students.forEach((st, idx) => {
        const status = attendance[st.id]?.status || 'present';
        csv += \`\${idx + 1},"\${st.name}","Tổ \${st.group}","\${ATT_MAP[status].text}"\\n\`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Diem_Danh_' + settings.className.replace(/\\s+/g, '_') + '.csv';
      a.click();
    }

    // --- 8. RENDER TAB 4: UTILITIES ---
    // A. Lucky Wheel / Random Picker
    let isSpinning = false;
    function spinWheel() {
      if (isSpinning) return;
      const filterGroup = document.getElementById('wheel-filter-group').value;
      const onlyPresent = document.getElementById('wheel-filter-present').checked;

      let pool = students.filter(st => {
        if (filterGroup !== 'all' && st.group !== filterGroup) return false;
        if (onlyPresent && attendance[st.id]?.status !== 'present' && attendance[st.id]?.status) return false;
        return true;
      });

      if (pool.length === 0) pool = students;

      isSpinning = true;
      const btn = document.getElementById('btn-spin-wheel');
      btn.disabled = true;
      btn.innerText = 'ĐANG BỐC THĂM...';

      let counter = 0;
      const totalSteps = 28;
      const interval = setInterval(() => {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        document.getElementById('wheel-avatar').innerText = rand.gender === 'female' ? '👧' : '👦';
        document.getElementById('wheel-winner-name').innerText = rand.name;
        document.getElementById('wheel-winner-info').innerText = 'Tổ ' + rand.group + ' • ' + rand.role;
        counter++;

        if (counter >= totalSteps) {
          clearInterval(interval);
          isSpinning = false;
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-rotate text-lg mr-2"></i> BỐC THĂM LẠI';

          const finalWinner = pool[Math.floor(Math.random() * pool.length)];
          document.getElementById('wheel-avatar').innerText = finalWinner.gender === 'female' ? '👧' : '👦';
          document.getElementById('wheel-winner-name').innerText = finalWinner.name;
          document.getElementById('wheel-winner-info').innerText = '🎉 CHÚC MỪNG BẠN LÊN BẢNG (Tổ ' + finalWinner.group + ')';

          playTingTing();
          triggerConfettiRain();
        }
      }, 90);
    }

    // B. Smart Countdown Timer
    let timerTotalSeconds = 180;
    let timerRemaining = 180;
    let timerInterval = null;
    let isTimerRunning = false;

    function formatTime(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return \`\${m}:\${s}\`;
    }

    function setTimerPreset(sec) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerTotalSeconds = sec;
      timerRemaining = sec;
      document.getElementById('timer-numbers').innerText = formatTime(sec);
      document.getElementById('timer-btn-text').innerText = 'Bắt đầu';
      document.getElementById('timer-status-text').innerText = 'Đã đặt: ' + (sec / 60) + ' phút';
    }

    function toggleTimer() {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('timer-btn-text').innerText = 'Tiếp tục';
      } else {
        if (timerRemaining <= 0) timerRemaining = timerTotalSeconds;
        isTimerRunning = true;
        document.getElementById('timer-btn-text').innerText = 'Tạm dừng';
        document.getElementById('timer-status-text').innerText = 'Đang đếm ngược...';

        timerInterval = setInterval(() => {
          timerRemaining--;
          document.getElementById('timer-numbers').innerText = formatTime(timerRemaining);

          if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            document.getElementById('timer-btn-text').innerText = 'Bắt đầu';
            document.getElementById('timer-status-text').innerText = '⏰ HẾT GIỜ LÀM BÀI!';
            playTimerBell();
            triggerConfettiRain();
          }
        }, 1000);
      }
    }

    function resetTimer() {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerRemaining = timerTotalSeconds;
      document.getElementById('timer-numbers').innerText = formatTime(timerRemaining);
      document.getElementById('timer-btn-text').innerText = 'Bắt đầu';
      document.getElementById('timer-status-text').innerText = 'Sẵn sàng đếm ngược';
    }

    // C. Team Generator
    const TEAM_NAMES = ['Biệt Đội Rồng Lửa', 'Chiến Binh Phượng Hoàng', 'Biệt Đội Sao Băng', 'Đội Thần Tốc', 'Hiệp Sĩ Ánh Sáng', 'Đại Bàng Xanh'];
    function generateTeams(numTeams) {
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      const teams = Array.from({ length: numTeams }, (_, i) => ({
        name: TEAM_NAMES[i] || ('Nhóm ' + (i + 1)),
        members: []
      }));

      shuffled.forEach((st, idx) => {
        teams[idx % numTeams].members.push(st);
      });

      const container = document.getElementById('teams-container');
      container.innerHTML = teams.map((tm, tIdx) => {
        return \`
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div class="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
              <h4 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">\${tIdx + 1}</span>
                \${tm.name}
              </h4>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">\${tm.members.length} bạn</span>
            </div>
            <ul class="space-y-1.5 text-xs text-slate-700">
              \${tm.members.map(m => \`
                <li class="flex items-center gap-2 py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span>\${m.gender === 'female' ? '👧' : '👦'}</span>
                  <span class="font-medium truncate">\${m.name}</span>
                  <span class="ml-auto text-[10px] text-slate-400">T\${m.group}</span>
                </li>
              \`).join('')}
            </ul>
          </div>
        \`;
      }).join('');
    }

    // D. Logs
    function renderLogs() {
      const container = document.getElementById('logs-container');
      if (pointLogs.length === 0) {
        container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">Chưa có hoạt động chấm điểm nào hôm nay.</div>';
        return;
      }

      container.innerHTML = pointLogs.slice(0, 30).map(log => {
        const isPos = log.points > 0;
        const timeStr = new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return \`
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-3">
              <span class="font-black px-2 py-1 rounded-lg text-xs \${isPos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                \${isPos ? '+' + log.points : log.points}đ
              </span>
              <div>
                <span class="font-bold text-slate-800">\${log.studentName}</span>
                <span class="text-slate-500 font-medium"> - \${log.reason}</span>
              </div>
            </div>
            <span class="text-[11px] text-slate-400 font-mono shrink-0">\${timeStr}</span>
          </div>
        \`;
      }).join('');
    }

    function clearLogs() {
      if (monthlyStore?.months[monthlyStore.activeMonthId]?.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trên bản web rồi xuất HTML mới để chỉnh sửa.'); return; }
      pointLogs = [];
      saveState();
      renderLogs();
    }

    // --- 9. SETTINGS MODAL & DATA MANAGEMENT ---
    function openSettingsModal() {
      document.getElementById('modal-settings').classList.remove('hidden');
    }
    function closeSettingsModal() {
      document.getElementById('modal-settings').classList.add('hidden');
    }

    function saveClassSettings() {
      settings.className = document.getElementById('settings-classname').value.trim() || 'LỚP 7C8';
      settings.schoolName = document.getElementById('settings-schoolname').value.trim() || 'THCS VÕ THỊ SÁU';
      settings.teacherName = document.getElementById('settings-teachername').value.trim() || 'Cô Ngô Thị Phương';

      document.getElementById('header-class-name').innerText = settings.className + ' - ' + settings.schoolName;
      document.getElementById('header-teacher-name').innerText = settings.teacherName;

      if (saveState()) alert('Đã lưu thông tin lớp học thành công!');
    }

    function resetWeekPoints() {
      if (monthlyStore?.months[monthlyStore.activeMonthId]?.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trên bản web rồi xuất HTML mới để chỉnh sửa.'); return; }
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ điểm thi đua của cả lớp về 0 để bắt đầu tuần mới?')) {
        students.forEach(s => s.points = 0);
        saveState();
        renderClassroom();
        renderLeaderboard();
        alert('Đã đặt lại toàn bộ điểm thi đua về 0!');
      }
    }

    function resetToDefaultSample() {
      if (confirm('Khôi phục dữ liệu ban đầu khi xuất file HTML này?')) {
        useSnapshot(JSON.parse(initialSnapshot));
        storageBlocked = false;
        if (saveState()) location.reload();
      }
    }

    function backupToJson() {
      const data = snapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Backup_Lop7C8_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    }

    function restoreFromJson(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const parsed = JSON.parse(e.target.result);
          if (validSnapshot(parsed)) {
            useSnapshot(parsed);
            storageBlocked = false;
            if (saveState()) location.reload();
          } else {
            alert('File JSON không hợp lệ!');
          }
        } catch (err) {
          alert('Lỗi đọc file JSON!');
        }
      };
      reader.readAsText(file);
    }

    function bulkImportStudents() {
      if (monthlyStore?.months[monthlyStore.activeMonthId]?.isArchived) { alert('Tháng đã chốt. Hãy mở lại tháng trên bản web rồi xuất HTML mới để chỉnh sửa.'); return; }
      const raw = document.getElementById('bulk-import-text').value.trim();
      if (!raw) return;
      const lines = raw.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      const newStudents = lines.map((name, idx) => {
        const groupNum = ((idx % 4) + 1).toString();
        return {
          id: 'hs-' + Date.now() + '-' + (idx + 1),
          name: name,
          gender: idx % 2 === 0 ? 'male' : 'female',
          group: groupNum,
          role: 'Thành viên',
          points: 10,
          avatarIndex: idx + 1
        };
      });

      if (confirm(\`Bạn có muốn thay thế danh sách hiện tại bằng \${newStudents.length} học sinh vừa nhập?\`)) {
        students = newStudents;
        saveState();
        renderClassroom();
        renderLeaderboard();
        renderAttendance();
        generateTeams(4);
        closeSettingsModal();
        alert(\`Đã nhập thành công \${newStudents.length} học sinh!\`);
      }
    }

    // --- 10. TAB NAVIGATION ---
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = 'tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-transparent text-indigo-100 hover:bg-white/10';
      });

      const activeContent = document.getElementById('tab-' + tabId);
      const activeBtn = document.getElementById('tab-btn-' + tabId);

      if (activeContent) activeContent.classList.remove('hidden');
      if (activeBtn) {
        activeBtn.className = 'tab-btn flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition border-b-4 border-amber-400 bg-white/15 text-white';
      }

      if (tabId === 'leaderboard') renderLeaderboard();
      if (tabId === 'attendance') renderAttendance();
      if (tabId === 'utilities') {
        generateTeams(4);
        renderLogs();
      }
    }

    // --- 11. INITIALIZATION ---
    window.addEventListener('DOMContentLoaded', () => {
      // Live clock
      setInterval(() => {
        const now = new Date();
        const clockElem = document.getElementById('live-clock');
        if (clockElem) clockElem.innerText = now.toLocaleTimeString('vi-VN');
      }, 1000);

      renderClassroom();
      renderLeaderboard();
      renderAttendance();
      generateTeams(4);
      renderLogs();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QuanLyLopHoc_${settings.className.replace(/\s+/g, '_')}_Offline.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
