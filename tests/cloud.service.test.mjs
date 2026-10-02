import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { build } from 'esbuild';
import { getDoc, doc } from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const env=await initializeTestEnvironment({projectId:'demo-classroom-service',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
try {
 const db=env.authenticatedContext('owner').firestore();
 const output=await build({stdin:{contents:"export * from './src/cloud/service'; export * from './src/cloud/data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',packages:'external',write:false,plugins:[{name:'test-firebase',setup(b){b.onResolve({filter:/^\.\/firebase$/},()=>({path:'firebase',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const db = globalThis.__testDb;'}));}}]});
 globalThis.__testDb=db;
 const module={exports:{}};
 new Function('module','require',output.outputFiles[0].text)(module,name=>name==='firebase/firestore'?firestoreSdk:require(name));
 const api=module.exports;
 const data=api.emptyData();
 const v1=await api.saveCloud('owner',data,0);assert.equal(v1,1);console.log('PASS actual service creates empty classroom');
 const raw=(await getDoc(doc(db,'classrooms','owner'))).data();
 const decoded=api.decodeRecord(raw,'owner');assert.equal(api.stableJson(decoded.data),api.stableJson(data));console.log('PASS actual service round trip preserves payload');
 const changed=JSON.parse(JSON.stringify(data));changed.settings.className='LỚP 6D8';
 assert.equal(await api.saveCloud('owner',changed,1),2);console.log('PASS actual service updates expected revision');
 await assert.rejects(api.saveCloud('owner',data,1),e=>e.code==='conflict');console.log('PASS actual service rejects stale save');
 const latest=api.decodeRecord((await getDoc(doc(db,'classrooms','owner'))).data(),'owner');assert.equal(latest.data.settings.className,'LỚP 6D8');console.log('PASS conflicting client cannot overwrite newer data');
 await assert.rejects(api.saveCloud('owner',{...changed,settings:{...changed.settings,className:'x'.repeat(900000)}},2),/quá lớn/);console.log('PASS oversize payload blocked before writing');
 assert.throws(()=>api.decodeRecord({...raw,ownerUid:'other'},'owner'));console.log('PASS wrong owner payload rejected');
 // --- Đưa dữ liệu hiện có lên Firebase (ghi đè chủ động) ---
 const sample=api.sampleData();
 assert.equal(sample.students.length,54);
 const v3=await api.uploadCloud('owner',sample);assert.equal(v3,3);console.log('PASS upload ghi đè bản cũ và tăng revision');
 const afterUpload=api.decodeRecord((await getDoc(doc(db,'classrooms','owner'))).data(),'owner');
 assert.equal(afterUpload.data.students.length,54);
 assert.equal(api.stableJson(afterUpload.data),api.stableJson(sample));console.log('PASS upload giữ nguyên toàn bộ 54 học sinh mẫu');
 const v4=await api.uploadCloud('owner',api.emptyData());assert.equal(v4,4);console.log('PASS upload không cần biết revision của client');
 assert.equal(api.decodeRecord((await getDoc(doc(db,'classrooms','owner'))).data(),'owner').data.students.length,0);
 await assert.rejects(api.uploadCloud('owner',{...sample,settings:{...sample.settings,className:'x'.repeat(900000)}}),/quá lớn/);console.log('PASS upload quá lớn bị chặn trước khi ghi');
 // Tài khoản mới: upload là đường khởi tạo hợp lệ, bắt đầu từ revision 1.
 const fresh=env.authenticatedContext('owner-2').firestore();
 globalThis.__testDb=fresh;
 const module2={exports:{}};
 new Function('module','require',output.outputFiles[0].text)(module2,name=>name==='firebase/firestore'?firestoreSdk:require(name));
 assert.equal(await module2.exports.uploadCloud('owner-2',module2.exports.sampleData()),1);console.log('PASS upload khởi tạo lớp mới ở revision 1');
 assert.equal(module2.exports.decodeRecord((await getDoc(doc(fresh,'classrooms','owner-2'))).data(),'owner-2').data.students.length,54);
 console.log('13 cloud service checks passed');
}finally{await env.cleanup();}
