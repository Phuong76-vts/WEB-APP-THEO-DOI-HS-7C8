import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { CloudData, stableJson, normalizeData } from './data';

export const classroomRef = (uid: string) => doc(db, 'classrooms', uid);
export const SCHEMA_VERSION = 1;
/** Chừa chỗ an toàn dưới giới hạn 1 MiB mỗi document của Firestore. */
export const MAX_PAYLOAD_BYTES = 850000;

export interface CloudRecord { ownerUid: string; revision: number; payload: string; }

export function decodeRecord(raw: any, uid: string): {data: CloudData; revision:number} {
  if (!raw || raw.ownerUid !== uid || !Number.isInteger(raw.revision) || raw.revision < 1 || typeof raw.payload !== 'string') throw new Error('Dữ liệu Firebase không đúng cấu trúc. Không tự ghi đè.');
  return {data:normalizeData(JSON.parse(raw.payload)),revision:raw.revision};
}

function encode(data: CloudData): string {
  const payload = stableJson(data);
  if (new TextEncoder().encode(payload).length > MAX_PAYLOAD_BYTES) throw new Error('Dữ liệu lớp quá lớn cho một bản lưu. Hãy sao lưu JSON, xóa bớt nhật ký không cần thiết rồi lưu lại. Dữ liệu trên Firebase chưa bị thay đổi.');
  return payload;
}

/**
 * Lưu theo kiểu so-sánh-rồi-ghi: chỉ ghi khi revision trên Firebase đúng bằng bản client đang giữ.
 * Hai thiết bị sửa cùng lúc sẽ nhận lỗi `conflict` thay vì âm thầm ghi đè nhau.
 */
export async function saveCloud(uid: string, data: CloudData, expectedRevision: number) {
  const payload = encode(data);
  return runTransaction(db, async transaction => {
    const ref=classroomRef(uid);const snap=await transaction.get(ref);
    const revision=snap.exists()?snap.data().revision:0;
    if (revision!==expectedRevision) throw Object.assign(new Error('Revision conflict'),{code:'conflict'});
    const next=revision+1;
    transaction.set(ref,{ownerUid:uid,revision:next,payload,updatedAt:serverTimestamp(),schemaVersion:SCHEMA_VERSION});
    return next;
  });
}

/**
 * Đưa một bộ dữ liệu lên Firebase, thay thế toàn bộ bản đang có của chính tài khoản này.
 * Dùng cho thao tác người dùng chủ động chọn nguồn (mẫu sẵn có / localStorage / file JSON),
 * nên không cần biết revision trước; revision vẫn tăng đúng 1 để rules chấp nhận.
 */
export async function uploadCloud(uid: string, data: CloudData) {
  const payload = encode(data);
  return runTransaction(db, async transaction => {
    const ref=classroomRef(uid);const snap=await transaction.get(ref);
    const current=snap.exists() && Number.isInteger(snap.data().revision) ? snap.data().revision as number : 0;
    const next=current+1;
    transaction.set(ref,{ownerUid:uid,revision:next,payload,updatedAt:serverTimestamp(),schemaVersion:SCHEMA_VERSION});
    return next;
  });
}
