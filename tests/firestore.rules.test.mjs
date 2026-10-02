import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const projectId='demo-classroom-rules';
const env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});
let passed=0;
const record=(uid,revision=1)=>({ownerUid:uid,revision,payload:'{"students":[]}',schemaVersion:1,updatedAt:serverTimestamp()});
async function test(name,fn){await fn();passed++;console.log('PASS',name);}
try{
 await env.clearFirestore();
 const alice=env.authenticatedContext('teacher-a').firestore();
 const bob=env.authenticatedContext('teacher-b').firestore();
 const guest=env.unauthenticatedContext().firestore();
 const ref=doc(alice,'classrooms','teacher-a');
 await test('Owner creates own classroom',()=>assertSucceeds(setDoc(ref,record('teacher-a'))));
 await test('Owner reads own classroom',()=>assertSucceeds(getDoc(ref)));
 await test('Guest cannot read classroom',()=>assertFails(getDoc(doc(guest,'classrooms','teacher-a'))));
 await test('Guest cannot create classroom',()=>assertFails(setDoc(doc(guest,'classrooms','guest'),record('guest'))));
 await test('Other user cannot read classroom',()=>assertFails(getDoc(doc(bob,'classrooms','teacher-a'))));
 await test('Other user cannot write classroom',()=>assertFails(setDoc(doc(bob,'classrooms','teacher-a'),record('teacher-a',2))));
 await test('Cannot spoof owner UID',()=>assertFails(setDoc(doc(bob,'classrooms','teacher-b'),record('teacher-a'))));
 await test('Cannot skip revision',()=>assertFails(setDoc(ref,record('teacher-a',3))));
 await test('Cannot write arbitrary fields',()=>assertFails(setDoc(ref,{...record('teacher-a',2),admin:true})));
 await test('Cannot forge update timestamp',()=>assertFails(setDoc(ref,{...record('teacher-a',2),updatedAt:new Date(0)})));
 await test('Owner updates next revision',()=>assertSucceeds(setDoc(ref,record('teacher-a',2))));
 await test('Stale revision rejected',()=>assertFails(setDoc(ref,record('teacher-a',2))));
 await test('No classroom listing',()=>assertFails(getDocs(collection(alice,'classrooms'))));
 await test('Delete is denied',()=>assertFails(deleteDoc(ref)));
 await test('Unrelated paths are denied',()=>assertFails(setDoc(doc(alice,'users','teacher-a'),{admin:true})));
 await test('Revision 0 rejected',()=>assertFails(setDoc(doc(alice,'classrooms','teacher-a'),{...record('teacher-a',0)})));
 await test('Wrong schema version rejected',()=>assertFails(setDoc(ref,{...record('teacher-a',3),schemaVersion:2})));
 await test('Empty payload rejected',()=>assertFails(setDoc(ref,{...record('teacher-a',3),payload:''})));
 await test('Non-string payload rejected',()=>assertFails(setDoc(ref,{...record('teacher-a',3),payload:{students:[]}})));
 await test('Owner UID cannot change on update',()=>assertFails(setDoc(ref,{...record('teacher-a',3),ownerUid:'teacher-b'})));
 await test('Revision cannot go backwards',()=>assertFails(setDoc(ref,record('teacher-a',1))));
 await test('Classroom subcollection denied',()=>assertFails(setDoc(doc(alice,'classrooms','teacher-a','snapshots','x'),{a:1})));
 await test('Owner still advances to next revision',()=>assertSucceeds(setDoc(ref,record('teacher-a',3))));
 await test('Transactions detect stale client',async()=>{
  await assert.rejects(runTransaction(alice,async t=>{const s=await t.get(ref);if(s.data().revision!==1)throw Error('conflict');t.set(ref,record('teacher-a',2));}),/conflict/);
 });
 console.log(`${passed} Firebase rules checks passed`);
}finally{await env.cleanup();}
