import React, { useState } from 'react';
import { X, Users, ClipboardPaste, Check, FileSpreadsheet, Sparkles } from 'lucide-react';
import { playClick, playFanfare } from '../utils/audio';

interface QuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (names: string[]) => void;
  soundEnabled: boolean;
  currentCount: number;
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  soundEnabled,
  currentCount
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const lines = text
    .split('\n')
    .map(line => line.trim().replace(/^\d+[\.\-\s]+/, '')) // Remove leading index numbers like "1. ", "01 - "
    .filter(line => line.length > 0);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText(clipText);
          playClick(soundEnabled);
        }
      } else {
        alert('Trình duyệt chưa cấp quyền đọc clipboard. Vui lòng bấm Ctrl + V (hoặc chạm giữ để Dán) trực tiếp vào khung.');
      }
    } catch {
      alert('Vui lòng bấm phím Ctrl + V (hoặc chạm giữ vào ô để Dán).');
    }
  };

  const handleConfirm = () => {
    if (lines.length === 0) {
      alert('Vui lòng dán danh sách tên học sinh vào khung!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn nạp danh sách gồm ${lines.length} học sinh này vào lớp không? Hệ thống sẽ tự động phân đều vào 4 Tổ.`)) {
      playFanfare(soundEnabled);
      onImport(lines);
      setText('');
      onClose();
      alert(`Đã nạp thành công ${lines.length} học sinh vào 4 Tổ lớp học!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">DÁN DANH SÁCH LỚP HỌC</h3>
              <p className="text-xs text-emerald-100">Nhập danh sách học sinh thật nhanh chóng từ Excel / Word</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
          <div className="bg-emerald-50 border border-emerald-200/70 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Hướng dẫn cách dán danh sách thật:</span>
            </div>
            <p className="text-emerald-800">
              1. Mở file Excel danh sách lớp của bạn, chọn cột <b>Họ và Tên</b> rồi bấm <b>Copy (Sao chép)</b>.
            </p>
            <p className="text-emerald-800">
              2. Dán vào khung bên dưới. Hệ thống tự động xóa số thứ tự thừa và chia đều vào 4 Tổ.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Danh sách học sinh (Mỗi bạn 1 dòng):
              </label>
              
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 transition cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Dán từ bộ nhớ tạm</span>
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Hoàng Cúc&#10;Phạm Thuỳ Dương..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />

            <div className="flex items-center justify-between text-xs font-medium px-1">
              <span className="text-slate-500">
                Hiện tại lớp đang có: <b>{currentCount}</b> học sinh
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${
                lines.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                Đã nhận diện: <b>{lines.length}</b> bạn
              </span>
            </div>
          </div>

          {lines.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 text-xs space-y-1.5">
              <div className="font-bold text-slate-700">
                Dự kiến chia vào 4 Tổ (mỗi tổ khoảng {Math.ceil(lines.length / 4)} bạn):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-indigo-600">Tổ 1:</span> {lines.filter((_, i) => i % 4 === 0).length} bạn
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-emerald-600">Tổ 2:</span> {lines.filter((_, i) => i % 4 === 1).length} bạn
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-amber-600">Tổ 3:</span> {lines.filter((_, i) => i % 4 === 2).length} bạn
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-rose-600">Tổ 4:</span> {lines.filter((_, i) => i % 4 === 3).length} bạn
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={lines.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 active:scale-95 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Nạp {lines.length > 0 ? `${lines.length} Học Sinh` : 'Danh Sách'} Vào Lớp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
