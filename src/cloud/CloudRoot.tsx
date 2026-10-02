import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  browserLocalPersistence, browserSessionPersistence, getRedirectResult, onAuthStateChanged,
  setPersistence, signInWithPopup, signInWithRedirect, signOut, User
} from 'firebase/auth';
import { getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider } from './firebase';
import { classroomRef, decodeRecord, saveCloud, uploadCloud } from './service';
import { CloudData, downloadBackup, firebaseMessage, normalizeData, stableJson } from './data';
import { setStorageNamespace } from '../utils/storage';
import UploadPanel from './UploadPanel';
import App from '../App';

const button = 'rounded-lg bg-blue-700 px-3 py-1.5 text-white font-semibold disabled:opacity-50 hover:bg-blue-800 transition';

function readDraft(uid: string): { data: CloudData; revision: number } | null {
  try {
    const raw = localStorage.getItem(`cloud-draft:${uid}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { data: normalizeData(d.data), revision: d.revision };
  } catch { return null; }
}

export default function CloudRoot() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser, e => { setError(firebaseMessage(e)); setUser(null); }), []);
  // Thu kết quả khi trình duyệt phải đăng nhập bằng cách chuyển trang thay vì mở popup.
  useEffect(() => { getRedirectResult(auth).catch(e => setError(firebaseMessage(e))); }, []);

  async function login() {
    setBusy(true); setError('');
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      const code = String(e?.code ?? '');
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try { await signInWithRedirect(auth, googleProvider); return; } catch (err) { setError(firebaseMessage(err)); }
      } else setError(firebaseMessage(e));
    } finally { setBusy(false); }
  }

  if (user === undefined) return <div className="p-10">Đang kiểm tra đăng nhập…</div>;
  if (user) return <CloudSession key={user.uid} user={user} />;
  return <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6"><div className="max-w-lg rounded-2xl bg-white p-8 shadow-lg space-y-5">
    <h1 className="text-2xl font-bold text-blue-900">Quản lý lớp học &amp; Thi đua số</h1>
    <p>Đăng nhập Google để lưu dữ liệu lớp trên Firebase và sử dụng trên nhiều thiết bị.</p>
    <p className="text-sm text-slate-600">Mỗi tài khoản có dữ liệu riêng. Dùng cùng tài khoản Google trên các thiết bị của thầy cô.</p>
    <label className="flex gap-2"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Ghi nhớ đăng nhập trên máy cá nhân</label>
    <button className={button} disabled={busy} onClick={login}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập bằng Google'}</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div></div>;
}

function CloudSession({ user }: { user: User }) {
  // Tách bộ nhớ cục bộ theo UID trước khi App đọc/ghi localStorage.
  useMemo(() => setStorageNamespace(user.uid), [user.uid]);

  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [initial, setInitial] = useState<CloudData | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [status, setStatus] = useState('Đang đọc dữ liệu từ Firebase…');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [revisionShown, setRevisionShown] = useState(0);

  const revision = useRef(0), clean = useRef(''), draft = useRef<CloudData | null>(null);
  const dirtyRef = useRef(false), conflictRef = useRef(false), savingRef = useRef(false);
  const initialized = useRef(false), alive = useRef(true);
  const remote = useRef<{ data: CloudData; revision: number } | null>(null);
  const [pending] = useState(() => readDraft(user.uid));

  const keepDraft = useCallback((data: CloudData, rev: number) => {
    try { localStorage.setItem(`cloud-draft:${user.uid}`, JSON.stringify({ data, revision: rev })); setLocalError(''); }
    catch { setLocalError('Không lưu được bản nháp trên máy. Hãy tải sao lưu JSON trước khi đóng trang.'); }
  }, [user.uid]);

  const adopt = useCallback((record: { data: CloudData; revision: number }) => {
    revision.current = record.revision; clean.current = stableJson(record.data); draft.current = record.data;
    dirtyRef.current = false; conflictRef.current = false;
    setDirty(false); setConflict(false); setError(''); setMissing(false); setUploadOpen(false);
    setInitial(record.data); setEpoch(n => n + 1); setReady(true); setRevisionShown(record.revision);
    setStatus('Đã đồng bộ Firebase');
    keepDraft(record.data, record.revision);
  }, [keepDraft]);

  useEffect(() => {
    alive.current = true;
    const stop = onSnapshot(classroomRef(user.uid), { includeMetadataChanges: true }, snap => {
      if (snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
      try {
        if (!snap.exists()) {
          if (initialized.current && draft.current) { conflictRef.current = true; setConflict(true); setError('Dữ liệu trên Firebase đã bị xóa. Tải bản nháp trước khi tải lại trang.'); return; }
          initialized.current = true; setMissing(true); setReady(true); setStatus('Tài khoản chưa có dữ liệu lớp'); return;
        }
        const record = decodeRecord(snap.data(), user.uid); remote.current = record;
        const fingerprint = stableJson(record.data);
        if (!initialized.current) {
          initialized.current = true;
          if (pending && stableJson(pending.data) !== fingerprint) {
            revision.current = record.revision; clean.current = fingerprint; draft.current = pending.data;
            dirtyRef.current = true; conflictRef.current = true;
            setInitial(pending.data); setDirty(true); setConflict(true); setReady(true); setRevisionShown(record.revision);
            setStatus('Có bản nháp chưa đồng bộ trên máy này'); return;
          }
          adopt(record); return;
        }
        if (fingerprint === clean.current && record.revision === revision.current) return;
        if (draft.current && fingerprint === stableJson(draft.current)) {
          revision.current = record.revision; clean.current = fingerprint; dirtyRef.current = false;
          setDirty(false); setRevisionShown(record.revision); setStatus('Đã đồng bộ Firebase');
          keepDraft(draft.current, record.revision); return;
        }
        // A save in flight may be acknowledged while the user has newer edits.
        if (savingRef.current) return;
        if (dirtyRef.current) { conflictRef.current = true; setConflict(true); setStatus('Có thay đổi từ thiết bị khác'); return; }
        adopt(record);
      } catch (e) { setError(firebaseMessage(e)); setStatus('Không thể đọc dữ liệu'); }
    }, e => { setError(firebaseMessage(e)); setStatus('Lỗi kết nối Firebase'); });
    return () => { alive.current = false; stop(); };
  }, [user.uid, adopt, keepDraft, pending]);

  const change = useCallback((data: CloudData) => {
    const normalized = normalizeData(data); draft.current = normalized;
    const changed = stableJson(normalized) !== clean.current; dirtyRef.current = changed; setDirty(changed);
    keepDraft(normalized, revision.current);
    if (changed && !conflictRef.current) setStatus('Có thay đổi chưa lưu lên Firebase');
  }, [keepDraft]);

  const save = useCallback(async () => {
    if (!draft.current || savingRef.current || conflictRef.current || !dirtyRef.current) return;
    const data = draft.current, expected = revision.current;
    savingRef.current = true; setSaving(true); setError(''); setStatus('Đang lưu lên Firebase…');
    try {
      const rev = await saveCloud(user.uid, data, expected);
      if (!alive.current) return;
      revision.current = rev; clean.current = stableJson(data); setRevisionShown(rev);
      const changed = stableJson(draft.current) !== clean.current; dirtyRef.current = changed; setDirty(changed);
      keepDraft(draft.current, rev); setStatus(changed ? 'Có thay đổi mới đang chờ lưu' : 'Đã lưu lên Firebase');
      if (remote.current && remote.current.revision > rev && stableJson(remote.current.data) !== clean.current) { conflictRef.current = true; setConflict(true); }
    } catch (e: any) {
      if (!alive.current) return;
      setError(firebaseMessage(e)); setStatus('Chưa lưu lên Firebase');
      if (e?.code === 'conflict') { conflictRef.current = true; setConflict(true); }
    } finally { savingRef.current = false; if (alive.current) setSaving(false); }
  }, [user.uid, keepDraft]);

  // Saving is debounced; network/rules errors require a deliberate retry.
  useEffect(() => { if (!dirty || conflict || saving || error || missing) return; const t = setTimeout(() => void save(), 1500); return () => clearTimeout(t); }, [dirty, conflict, saving, error, missing, save]);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirtyRef.current || savingRef.current) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, []);

  /** Đưa một bộ dữ liệu bất kỳ lên Firebase rồi nhận lại đúng bản máy chủ vừa ghi. */
  async function upload(data: CloudData, label: string) {
    if (savingRef.current) return;
    setError(''); setSaving(true); savingRef.current = true; setStatus('Đang đưa dữ liệu lên Firebase…');
    try {
      await uploadCloud(user.uid, data);
      const snap = await getDocFromServer(classroomRef(user.uid));
      adopt(decodeRecord(snap.data(), user.uid));
      setStatus(`Đã đưa lên Firebase: ${label}`);
    } catch (e) { setError(firebaseMessage(e)); setStatus('Chưa đưa được dữ liệu lên Firebase'); }
    finally { savingRef.current = false; setSaving(false); }
  }

  async function takeRemote() {
    if (!confirm('Nhận bản Firebase sẽ thay thế bản đang mở trên máy. Thầy cô đã tải bản nháp cần giữ chưa?')) return;
    try { const snap = await getDocFromServer(classroomRef(user.uid)); adopt(decodeRecord(snap.data(), user.uid)); } catch (e) { setError(firebaseMessage(e)); }
  }

  async function useDraft() {
    // Explicit resolution only; still use compare-and-set to detect another edit.
    try {
      const snap = await getDocFromServer(classroomRef(user.uid)); const current = decodeRecord(snap.data(), user.uid);
      if (!confirm('Dùng toàn bộ bản nháp trên máy thay cho bản Firebase hiện tại?')) return;
      revision.current = current.revision; clean.current = stableJson(current.data); conflictRef.current = false;
      setConflict(false); dirtyRef.current = true; setDirty(true); setError(''); await save();
    } catch (e) { setError(firebaseMessage(e)); }
  }

  async function logout() {
    if (savingRef.current) return;
    if (dirtyRef.current && !confirm('Còn thay đổi chưa lưu lên Firebase. Bản nháp được giữ trên máy; thầy cô có muốn đăng xuất?')) return;
    try { await signOut(auth); } catch (e) { setError(firebaseMessage(e)); }
  }

  return <>
    <div className="bg-blue-950 text-white p-3 flex flex-wrap items-center gap-3 text-sm">
      <b>{user.email}</b>
      <span aria-live="polite">{status}{revisionShown ? ` · bản #${revisionShown}` : ''}</span>
      <button className={button} disabled={!dirty || saving || conflict} onClick={() => void save()}>Lưu lại</button>
      <button className={button} disabled={saving || !ready || missing} onClick={() => setUploadOpen(true)}>Đưa dữ liệu lên Firebase</button>
      <button className={button} disabled={!draft.current} onClick={() => draft.current && downloadBackup(draft.current, 'BanNhap_LopHoc')}>Tải bản nháp JSON</button>
      <button className={button} disabled={saving} onClick={logout}>Đăng xuất Google</button>
    </div>

    {(error || localError) && <div role="alert" className="bg-red-100 text-red-900 p-4">{error} {localError}<button className="underline ml-3" onClick={() => location.reload()}>Kết nối lại</button></div>}

    {conflict && <div role="alert" className="bg-amber-100 text-amber-950 p-4 space-y-3"><p>Có hai bản dữ liệu khác nhau. Tự động lưu đã tạm dừng. Hãy tải bản nháp JSON trước khi chọn bản cần giữ.</p>
      <button className={button} disabled={saving} onClick={takeRemote}>Nhận bản Firebase</button>{' '}
      <button className={button} disabled={saving} onClick={useDraft}>Giữ bản nháp và lưu lên Firebase</button>
    </div>}

    {!ready && <p className="p-8">Đang chờ dữ liệu xác nhận từ máy chủ…</p>}

    {ready && missing && <div className="max-w-2xl mx-auto p-8">
      <UploadPanel uid={user.uid} mode="init" busy={saving} draft={pending?.data ?? null} onUpload={upload} />
    </div>}

    {ready && !missing && uploadOpen && <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-2xl mx-auto rounded-2xl bg-white p-6 shadow-2xl">
        <UploadPanel uid={user.uid} mode="replace" busy={saving} draft={draft.current} remote={remote.current?.data ?? null}
          onUpload={upload} onCancel={() => setUploadOpen(false)} />
      </div>
    </div>}

    {ready && !missing && initial && <App key={epoch} cloudInitial={initial} onCloudChange={change} onCloudLogout={logout} />}
  </>;
}
