import React, { useState, useMemo } from 'react';
import { ClassRule, RuleCategory, ClassSettings, UserRole, DEFAULT_CLASS_RULES, Student } from '../types';
import { 
  BookOpen, 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  UserCheck, 
  Plus, 
  Printer, 
  Tv, 
  Search, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Lock,
  Heart,
  Scale
} from 'lucide-react';
import { playClick, playTingTing } from '../utils/audio';

interface RulesTabProps {
  rules: ClassRule[];
  onUpdateRules: (newRules: ClassRule[]) => void;
  settings: ClassSettings;
  currentRole: UserRole;
  onOpenLogin: () => void;
  soundEnabled: boolean;
  students: Student[];
  onSelectRuleToGrade?: (rule: ClassRule) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  onUpdateRules,
  settings,
  currentRole,
  onOpenLogin,
  soundEnabled,
  onSelectRuleToGrade
}) => {
  const [activeCategory, setActiveCategory] = useState<RuleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTvMode, setIsTvMode] = useState(false);
  const [editingRule, setEditingRule] = useState<ClassRule | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for add/edit modal
  const [formCategory, setFormCategory] = useState<RuleCategory>('reward');
  const [formTitle, setFormTitle] = useState('');
  const [formPoints, setFormPoints] = useState<number>(2);
  const [formDescription, setFormDescription] = useState('');
  const [formRoleScope, setFormRoleScope] = useState('Ban cán sự & GVCN chấm');
  const [formIcon, setFormIcon] = useState('fa-star');

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchCategory = activeCategory === 'all' || r.category === activeCategory;
      const matchSearch = searchQuery === '' || 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.roleScope && r.roleScope.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [rules, activeCategory, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: rules.length,
      conduct: rules.filter(r => r.category === 'conduct').length,
      reward: rules.filter(r => r.category === 'reward').length,
      penalty: rules.filter(r => r.category === 'penalty').length,
      duty: rules.filter(r => r.category === 'duty').length
    };
  }, [rules]);

  // Handle open add modal
  const handleOpenAdd = () => {
    if (currentRole !== 'gvcn') {
      alert('Chỉ Giáo Viên Chủ Nhiệm (GVCN) mới có quyền tạo mới hoặc chỉnh sửa bảng nội quy.');
      onOpenLogin();
      return;
    }
    setEditingRule(null);
    setFormCategory('reward');
    setFormTitle('');
    setFormPoints(2);
    setFormDescription('');
    setFormRoleScope('Ban cán sự & GVCN chấm');
    setFormIcon('fa-award');
    setIsAddModalOpen(true);
    playClick(soundEnabled);
  };

  // Handle open edit modal
  const handleOpenEdit = (rule: ClassRule) => {
    if (currentRole !== 'gvcn') {
      alert('Chỉ Giáo Viên Chủ Nhiệm (GVCN) mới có quyền chỉnh sửa bảng nội quy.');
      onOpenLogin();
      return;
    }
    setEditingRule(rule);
    setFormCategory(rule.category);
    setFormTitle(rule.title);
    setFormPoints(rule.points || 0);
    setFormDescription(rule.description);
    setFormRoleScope(rule.roleScope || 'Toàn thể học sinh');
    setFormIcon(rule.icon || 'fa-star');
    setIsAddModalOpen(true);
    playClick(soundEnabled);
  };

  // Handle delete rule
  const handleDeleteRule = (id: string, title: string) => {
    if (currentRole !== 'gvcn') {
      alert('Chỉ Giáo Viên Chủ Nhiệm (GVCN) mới có quyền xóa điều khoản nội quy.');
      onOpenLogin();
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa điều khoản: "${title}" khỏi bảng nội quy?`)) {
      playClick(soundEnabled);
      const updated = rules.filter(r => r.id !== id);
      onUpdateRules(updated);
    }
  };

  // Handle save rule
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên quy định / tiêu chí!');
      return;
    }

    playTingTing(soundEnabled);

    if (editingRule) {
      // Edit existing
      const updated = rules.map(r => {
        if (r.id === editingRule.id) {
          return {
            ...r,
            category: formCategory,
            title: formTitle.trim(),
            points: (formCategory === 'reward' || formCategory === 'penalty') ? formPoints : undefined,
            description: formDescription.trim(),
            roleScope: formRoleScope.trim(),
            icon: formIcon.trim() || 'fa-star'
          };
        }
        return r;
      });
      onUpdateRules(updated);
    } else {
      // Add new
      const newRule: ClassRule = {
        id: `rule-${Date.now()}`,
        category: formCategory,
        title: formTitle.trim(),
        points: (formCategory === 'reward' || formCategory === 'penalty') ? formPoints : undefined,
        description: formDescription.trim(),
        roleScope: formRoleScope.trim() || 'Toàn thể học sinh',
        icon: formIcon.trim() || (formCategory === 'reward' ? 'fa-award' : formCategory === 'penalty' ? 'fa-triangle-exclamation' : 'fa-book')
      };
      onUpdateRules([...rules, newRule]);
    }

    setIsAddModalOpen(false);
  };

  // Reset to default rules
  const handleResetToDefault = () => {
    if (currentRole !== 'gvcn') {
      alert('Chỉ Giáo Viên Chủ Nhiệm (GVCN) mới có quyền khôi phục nội quy mặc định.');
      onOpenLogin();
      return;
    }
    if (confirm('Khôi phục toàn bộ bảng nội quy & barem thi đua chuẩn của lớp 7C8? Mọi thay đổi sẽ được đưa về mẫu ban đầu.')) {
      playClick(soundEnabled);
      onUpdateRules(DEFAULT_CLASS_RULES);
      alert('Đã khôi phục nội quy chuẩn thành công!');
    }
  };

  // Print rules
  const handlePrint = () => {
    playClick(soundEnabled);
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-black">
              <Scale className="w-3.5 h-3.5" /> BẢNG NỘI QUY CHUẨN MỰC VÀ BAREM ĐIỂM
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Nunito',sans-serif] tracking-wide">
              QUY CHẾ THI ĐUA & NỘI QUY LỚP 7C8
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
              Kim chỉ nam rèn luyện đạo đức, tác phong và thi đua học tập cho toàn thể đội viên học sinh lớp 7C8 trường THCS Võ Thị Sáu.
            </p>
          </div>

          {/* QUICK TOOLBAR BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                playClick(soundEnabled);
                setIsTvMode(true);
              }}
              title="Phóng to bảng nội quy trên máy chiếu hoặc màn hình tương tác lớp học"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <Tv className="w-4 h-4 text-amber-300" />
              <span>Chiếu Tivi / TV Mode</span>
            </button>

            <button
              onClick={handlePrint}
              title="In bảng nội quy chuẩn khổ giấy A4 để dán bảng tin lớp"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>In Bảng Nội Quy</span>
            </button>

            {currentRole === 'gvcn' ? (
              <button
                onClick={handleOpenAdd}
                title="Giáo viên chủ nhiệm thêm điều khoản nội quy mới"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ Thêm Quy Định</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                title="Đăng nhập tài khoản GVCN để chỉnh sửa nội quy"
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-indigo-100 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>GVCN sửa quy định</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 BÁC HỒ MINI BANNER */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-100">
          <div className="flex items-center gap-2 font-semibold">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Thực hiện nghiêm túc <b>5 Điều Bác Hồ Dạy</b>: Yêu nước, chăm học, kỷ luật, vệ sinh và trung thực.</span>
          </div>
          <div className="flex items-center gap-2">
            <span>GVCN: <b className="text-white">{settings.teacherName}</b></span>
            <span className="opacity-40">•</span>
            <span>Năm học: <b className="text-amber-300">{settings.academicYear}</b></span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER BUTTONS & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveCategory('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tất cả</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeCategory === 'all' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveCategory('conduct');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeCategory === 'conduct'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100 text-blue-800 border border-blue-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nề nếp & Tác phong</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-200/80 text-blue-900 font-bold">
              {counts.conduct}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveCategory('reward');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeCategory === 'reward'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Điểm cộng thi đua (+)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200/80 text-emerald-900 font-bold">
              {counts.reward}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveCategory('penalty');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeCategory === 'penalty'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50/70 hover:bg-rose-100 text-rose-800 border border-rose-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Điểm trừ kỷ luật (-)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-200/80 text-rose-900 font-bold">
              {counts.penalty}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveCategory('duty');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeCategory === 'duty'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Nhiệm vụ Ban Cán Sự</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-950 font-bold">
              {counts.duty}
            </span>
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội quy, barem..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. RULES GRID DISPLAY */}
      {filteredRules.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy điều khoản nội quy phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để khôi phục lại danh sách nội quy chuẩn.
          </p>
          {currentRole === 'gvcn' && (
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              Khôi phục nội quy chuẩn
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => {
            const isReward = rule.category === 'reward';
            const isPenalty = rule.category === 'penalty';
            const isConduct = rule.category === 'conduct';
            const isDuty = rule.category === 'duty';

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between hover:shadow-md relative overflow-hidden group ${
                  isReward
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : isPenalty
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : isConduct
                    ? 'border-blue-200/80 hover:border-blue-300'
                    : 'border-amber-200/80 hover:border-amber-300'
                }`}
              >
                {/* TOP ACCENT LINE */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isReward
                    ? 'bg-emerald-500'
                    : isPenalty
                    ? 'bg-rose-500'
                    : isConduct
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`} />

                <div className="space-y-3">
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs ${
                        isReward
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : isPenalty
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isConduct
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        <i className={`fa-solid ${rule.icon || 'fa-star'}`} />
                      </div>

                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isReward
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPenalty
                            ? 'bg-rose-100 text-rose-800'
                            : isConduct
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isReward ? 'Khen Thưởng' : isPenalty ? 'Nhắc Nhở' : isConduct ? 'Nề Nếp' : 'Nhiệm Vụ'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 line-clamp-2 leading-snug">
                          {rule.title}
                        </h4>
                      </div>
                    </div>

                    {/* POINTS BADGE */}
                    {rule.points !== undefined && (
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-2xs ${
                        rule.points > 0
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        <span>{rule.points > 0 ? `+${rule.points}` : rule.points}</span>
                        <span className="text-[10px] font-medium opacity-85">điểm</span>
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {rule.description}
                  </p>
                </div>

                {/* CARD FOOTER */}
                <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] font-medium text-slate-600">{rule.roleScope || 'Toàn thể học sinh'}</span>
                  </div>

                  {/* ACTIONS FOR GVCN */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onSelectRuleToGrade && (isReward || isPenalty) && (
                      <button
                        onClick={() => {
                          playClick(soundEnabled);
                          onSelectRuleToGrade(rule);
                        }}
                        title="Chấm điểm thi đua ngay theo tiêu chí này"
                        className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isReward
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[11px]">Chấm</span>
                      </button>
                    )}

                    {currentRole === 'gvcn' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          title="Chỉnh sửa điều khoản này"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.title)}
                          title="Xóa điều khoản này"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. FOOTER INFO & RESTORE BUTTON */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-bold text-slate-800 flex items-center gap-1.5 justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Nội quy được phê chuẩn bởi GVCN {settings.teacherName} • Áp dụng xuyên suốt năm học {settings.academicYear}
          </p>
          <p className="text-slate-500">
            Ban cán sự lớp (Lớp trưởng, Lớp phó, Tổ trưởng) căn cứ theo đúng bảng điểm quy định để đánh giá thi đua công bằng, minh bạch.
          </p>
        </div>

        {currentRole === 'gvcn' && (
          <button
            onClick={handleResetToDefault}
            title="Khôi phục lại nội quy mặc định ban đầu"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục mẫu gốc</span>
          </button>
        )}
      </div>

      {/* 5. ADD / EDIT RULE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {editingRule ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingRule ? 'Chỉnh sửa quy định nội quy' : 'Thêm điều khoản nội quy mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân loại danh mục (*)</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as RuleCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="reward">Điểm cộng thi đua (+ Khen thưởng)</option>
                  <option value="penalty">Điểm trừ kỷ luật (- Nhắc nhở)</option>
                  <option value="conduct">Nề nếp & Tác phong học đường</option>
                  <option value="duty">Quy định trách nhiệm & Ban cán sự</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên quy định / Tiêu chí (*)</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Đạt giải thi đua cấp trường..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(formCategory === 'reward' || formCategory === 'penalty') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Điểm số thi đua ({formCategory === 'reward' ? 'Số dương +' : 'Số âm -'})
                  </label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chi tiết & Hướng dẫn thực hiện</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Diễn giải rõ ràng tiêu chí để học sinh và ban cán sự chấm điểm công bằng..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đối tượng / Quyền hạn chấm</label>
                  <input
                    type="text"
                    value={formRoleScope}
                    onChange={(e) => setFormRoleScope(e.target.value)}
                    placeholder="VD: Ban cán sự chấm / GVCN"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Icon FontAwesome</label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="VD: fa-award, fa-star..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRule ? 'Lưu cập nhật' : 'Thêm quy định'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TV / FULLSCREEN PROJECTION OVERLAY */}
      {isTvMode && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto custom-scroll">
          
          {/* TV HEADER */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
                7C8
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black font-['Nunito',sans-serif] tracking-wide text-amber-300">
                  NỘI QUY & BAREM THI ĐUA LỚP 7C8 - THCS VÕ THỊ SÁU
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200">
                  GVCN: {settings.teacherName} • Năm học {settings.academicYear} • Tự giác rèn luyện & Tương trợ bạn bè
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTvMode(false)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-rose-600 text-white font-bold text-sm transition flex items-center gap-2 cursor-pointer shadow"
            >
              <X className="w-5 h-5" />
              <span>Đóng TV Mode (ESC)</span>
            </button>
          </div>

          {/* TV CONTENT 3 COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 flex-1">
            
            {/* COL 1: 5 ĐIỀU BÁC HỒ & NỀ NẾP */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/15 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-black text-lg border-b border-white/10 pb-2">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                <span>5 ĐIỀU BÁC HỒ DẠY & NỀ NẾP</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</span>
                  <span><b>Yêu Tổ quốc, yêu đồng bào:</b> Nghiêm túc chào cờ, giữ gìn danh dự tập thể lớp 7C8.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</span>
                  <span><b>Học tập tốt, lao động tốt:</b> Đi học đúng giờ, chuẩn bị bài đầy đủ, trực nhật sạch đẹp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</span>
                  <span><b>Đoàn kết tốt, kỷ luật tốt:</b> Kính thầy mến bạn, không gây ồn ào trong giờ học.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">4</span>
                  <span><b>Giữ gìn vệ sinh thật tốt:</b> Lớp học sáng - xanh - sạch, bảo vệ của công và Tivi tương tác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">5</span>
                  <span><b>Khiêm tốn, thật thà, dũng cảm:</b> Trung thực trong kiểm tra, dũng cảm nhận lỗi.</span>
                </li>
              </ul>
            </div>

            {/* COL 2: KHEN THƯỞNG (+) */}
            <div className="bg-emerald-950/40 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-emerald-300 font-black text-lg border-b border-emerald-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>TIÊU CHÍ KHEN THƯỞNG (+)</span>
                </div>
                <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">Tích điểm</span>
              </div>
              <div className="space-y-2.5 text-xs sm:text-sm">
                {rules.filter(r => r.category === 'reward').slice(0, 6).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-200">{r.title}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black shrink-0">
                      +{r.points}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* COL 3: NHẮC NHỞ (-) */}
            <div className="bg-rose-950/40 rounded-2xl p-6 border border-rose-500/30 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-rose-300 font-black text-lg border-b border-rose-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>TIÊU CHÍ NHẮC NHỞ (-)</span>
                </div>
                <span className="text-xs bg-rose-500 text-white font-black px-2 py-0.5 rounded-full">Trừ điểm</span>
              </div>
              <div className="space-y-2.5 text-xs sm:text-sm">
                {rules.filter(r => r.category === 'penalty').slice(0, 6).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-200">{r.title}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white font-black shrink-0">
                      {r.points}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TV FOOTER */}
          <div className="text-center text-xs sm:text-sm text-indigo-300 border-t border-white/15 pt-4">
            Thi đua là yêu nước, yêu nước thì phải thi đua • Tập thể Lớp 7C8 quyết tâm đạt danh hiệu Chi đội Xuất sắc!
          </div>

        </div>
      )}

    </div>
  );
};
