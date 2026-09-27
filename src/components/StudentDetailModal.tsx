import React, { useState, useEffect } from 'react';
import { Student, GroupId, Gender } from '../types';
import { X, User, Trash2, Check } from 'lucide-react';
import { playClick } from '../utils/audio';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // null means adding a new student
  onSave: (studentData: Partial<Student>) => void;
  onDelete?: (studentId: string) => void;
  soundEnabled: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
  onDelete,
  soundEnabled
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [group, setGroup] = useState<GroupId>('1');
  const [role, setRole] = useState('Thành viên');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setGender(student.gender);
      setGroup(student.group);
      setRole(student.role);
      setPoints(student.points);
    } else {
      setName('');
      setGender('male');
      setGroup('1');
      setRole('Thành viên');
      setPoints(10);
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    playClick(soundEnabled);
    onSave({
      ...(student ? { id: student.id } : {}),
      name: name.trim(),
      gender,
      group,
      role: role.trim() || 'Thành viên',
      points: Number(points) || 0
    });
    onClose();
  };

  const handleDelete = () => {
    if (!student || !onDelete) return;
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.name}" khỏi danh sách lớp?`)) {
      playClick(soundEnabled);
      onDelete(student.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              {gender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {student ? 'CHỈNH SỬA HỌC SINH' : 'THÊM HỌC SINH MỚI'}
              </h3>
              <p className="text-xs text-indigo-100">
                {student ? student.name : 'Nhập thông tin học sinh vào lớp'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          <div>
            <label className="block font-bold text-slate-700 mb-1">Họ và Tên học sinh *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vd: Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="male">👦 Nam</option>
                <option value="female">👧 Nữ</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thuộc Tổ</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as GroupId)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">Tổ 1</option>
                <option value="2">Tổ 2</option>
                <option value="3">Tổ 3</option>
                <option value="4">Tổ 4</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Chức vụ trong lớp</label>
              <span className="text-[11px] text-slate-400">Chọn nhanh hoặc tự nhập</span>
            </div>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Vd: Lớp trưởng, Tổ trưởng..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
            />
            {/* Quick role selection chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Thành viên',
                'Lớp trưởng',
                'Lớp phó',
                'Lớp phó học tập',
                'Lớp phó lao động',
                'Lớp phó văn thể',
                `Tổ trưởng Tổ ${group}`,
                `Tổ phó Tổ ${group}`,
                'Thủ quỹ'
              ].map((suggestedRole) => (
                <button
                  key={suggestedRole}
                  type="button"
                  onClick={() => setRole(suggestedRole)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    role === suggestedRole
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {suggestedRole}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Điểm thi đua hiện tại</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-center bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
            {student && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa HS</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{student ? 'Lưu thay đổi' : 'Thêm vào lớp'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
