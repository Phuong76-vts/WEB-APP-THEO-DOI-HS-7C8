import React, { useMemo, useState } from 'react';
import {
  CloudData, deviceLocalData, describeData, downloadBackup, emptyData,
  firebaseMessage, legacyLocalData, normalizeData, sampleData
} from './data';
import { validateBackup } from '../utils/storage';

interface Source {
  key: string;
  label: string;
  hint: string;
  data: CloudData;
}

interface Props {
  uid: string;
  /** 'init' = tài khoản chưa có dữ liệu; 'replace' = đã có dữ liệu trên Firebase, upload sẽ ghi đè. */
  mode: 'init' | 'replace';
  busy: boolean;
  /** Bản nháp đang mở trên máy (nếu có). */
  draft?: CloudData | null;
  /** Bản đang nằm trên Firebase, để tải sao lưu trước khi ghi đè. */
  remote?: CloudData | null;
  onUpload: (data: CloudData, label: string) => void | Promise<void>;
  onCancel?: () => void;
}

const btn = 'rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold disabled:opacity-50 hover:bg-blue-800 transition';
const btnGhost = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 font-semibold disabled:opacity-50 hover:bg-slate-50 transition';

export default function UploadPanel({ uid, mode, busy, draft, remote, onUpload, onCancel }: Props) {
  const [fileData, setFileData] = useState<CloudData | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const sources = useMemo<Source[]>(() => {
    const list: Source[] = [];
    const device = deviceLocalData(uid);
    const legacy = legacyLocalData();
    if (device) list.push({ key: 'device', label: 'Bản lưu trên máy của chính tài khoản này', hint: describeData(device), data: device });
    if (draft) list.push({ key: 'draft', label: 'Bản nháp đang mở trên màn hình', hint: describeData(draft), data: draft });
    if (legacy) list.push({ key: 'legacy', label: 'Dữ liệu bản cũ trong trình duyệt (trước khi dùng Firebase)', hint: describeData(legacy), data: legacy });
    const sample = sampleData();
    list.push({ key: 'sample', label: 'Dữ liệu mẫu dựng sẵn trong ứng dụng', hint: describeData(sample), data: sample });
    const empty = emptyData();
    list.push({ key: 'empty', label: 'Lớp trống (tự nhập danh sách sau)', hint: 'Không học sinh · giữ nguyên bộ nội quy mặc định', data: empty });
    return list;
  }, [uid, draft]);

  const [choice, setChoice] = useState(() => sources[0]?.key ?? 'sample');
  const selected = choice === 'file' ? null : sources.find(s => s.key === choice) ?? null;
  const payload = choice === 'file' ? fileData : selected?.data ?? null;
  const payloadLabel = choice === 'file' ? `file ${fileName}` : selected?.label ?? '';

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const parsed = JSON.parse(await file.text());
      validateBackup(parsed);
      setFileData(normalizeData(parsed));
      setFileName(file.name);
      setChoice('file');
    } catch (err) {
      setFileData(null); setFileName('');
      setError(firebaseMessage(err));
    }
  }

  function submit() {
    if (!payload) return;
    setError('');
    if (mode === 'replace') {
      const ok = confirm(
        `Đưa "${payloadLabel}" lên Firebase sẽ THAY THẾ TOÀN BỘ dữ liệu lớp đang có trên Firebase của tài khoản này.\n\n` +
        `Bản sắp đưa lên: ${describeData(payload)}\n\n` +
        'Thầy cô đã tải sao lưu JSON của bản hiện tại chưa? Bấm OK để ghi đè.'
      );
      if (!ok) return;
    }
    void onUpload(payload, payloadLabel);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-blue-900">
          {mode === 'init' ? 'Khởi tạo dữ liệu lớp trên Firebase' : 'Đưa dữ liệu hiện có lên Firebase'}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {mode === 'init'
            ? 'Firebase xác nhận tài khoản này chưa có dữ liệu. Chọn nguồn dữ liệu để đưa lên.'
            : 'Chọn nguồn dữ liệu để thay thế toàn bộ lớp đang lưu trên Firebase của tài khoản này.'}
        </p>
      </div>

      {mode === 'replace' && remote && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-950 space-y-2">
          <p><b>Bản đang có trên Firebase:</b> {describeData(remote)}</p>
          <button type="button" className={btnGhost} onClick={() => downloadBackup(remote, 'SaoLuu_TruocKhiGhiDe')}>
            Tải sao lưu JSON bản trên Firebase
          </button>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="font-semibold text-slate-800 mb-1">Nguồn dữ liệu</legend>
        {sources.map(s => (
          <label key={s.key} className={`flex gap-3 items-start rounded-lg border p-3 cursor-pointer ${choice === s.key ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <input type="radio" name="upload-source" className="mt-1" checked={choice === s.key} disabled={busy} onChange={() => setChoice(s.key)} />
            <span>
              <span className="block font-semibold text-slate-900">{s.label}</span>
              <span className="block text-sm text-slate-600">{s.hint}</span>
            </span>
          </label>
        ))}
        <label className={`flex gap-3 items-start rounded-lg border p-3 ${choice === 'file' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>
          <input type="radio" name="upload-source" className="mt-1" checked={choice === 'file'} disabled={busy || !fileData} onChange={() => fileData && setChoice('file')} />
          <span className="flex-1">
            <span className="block font-semibold text-slate-900">File JSON sao lưu</span>
            <span className="block text-sm text-slate-600">{fileData ? `${fileName} — ${describeData(fileData)}` : 'Chọn file .json đã xuất từ ứng dụng.'}</span>
            <input className="mt-2 block text-sm" type="file" accept=".json,application/json" disabled={busy} onChange={pickFile} />
          </span>
        </label>
      </fieldset>

      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <button type="button" className={btn} disabled={busy || !payload} onClick={submit}>
          {busy ? 'Đang đưa lên Firebase…' : mode === 'init' ? 'Đưa lên Firebase' : 'Ghi đè lên Firebase'}
        </button>
        {payload && (
          <button type="button" className={btnGhost} disabled={busy} onClick={() => downloadBackup(payload, 'SaoLuu_NguonSapTaiLen')}>
            Tải JSON nguồn đã chọn
          </button>
        )}
        {onCancel && <button type="button" className={btnGhost} disabled={busy} onClick={onCancel}>Đóng</button>}
      </div>
    </div>
  );
}
