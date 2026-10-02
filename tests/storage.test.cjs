const {buildSync} = require('esbuild');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const code = buildSync({entryPoints:[path.join(root,'src/utils/storage.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
function setup(seed = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {getItem:k=>map.get(k)??null, setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const ctx = {module:{exports:{}}, console:{error(){}},localStorage:storage,sessionStorage:storage};
  vm.runInNewContext(code, ctx);
  return {api:ctx.module.exports,map,storage};
}
let passed=0;
function test(name, fn) { fn(); passed++; console.log('PASS',name); }
const key = 'classroom_students_v7c8_54';
test('Firebase local cache isolated by account UID',()=>{
 const {api}=setup();api.setStorageNamespace('teacher-a');api.saveStoredStudents([]);
 api.setStorageNamespace('teacher-b');api.saveStoredStudents(api.INITIAL_STUDENTS.slice(0,2));
 api.setStorageNamespace('teacher-a');assert.equal(api.loadStoredStudents().length,0);
 api.setStorageNamespace('teacher-b');assert.equal(api.loadStoredStudents().length,2);
});
test('Firebase scoped writes preserve legacy migration data',()=>{
 const {api,map}=setup({[key]:'legacy-original'});api.setStorageNamespace('teacher-a');api.saveStoredStudents([]);
 assert.equal(map.get(key),'legacy-original');assert.equal(map.get('firebase:teacher-a:'+key),'[]');
});
for(const size of [0,40,53,54,55]) test('Preserve custom student list: '+size,()=>{
 const {api}=setup();
 const students=Array.from({length:size},(_,i)=>({...api.INITIAL_STUDENTS[i%54],id:'new-'+i,name:'Học sinh '+i,points:0}));
 api.saveStoredStudents(students);
 assert.equal(JSON.stringify(api.loadStoredStudents()),JSON.stringify(students));
});
test('Preserve edited officer name/group/role',()=>{
 const {api}=setup(); const students=api.INITIAL_STUDENTS.map(s=>({...s}));
 Object.assign(students.find(s=>s.id==='hs-20'),{group:'4',role:'Thành viên',name:'Tên mới'});
 api.saveStoredStudents(students); assert.equal(JSON.stringify(api.loadStoredStudents()),JSON.stringify(students));
 api.saveStoredOfficer({name:'Tên mới',roleTitle:'Lớp trưởng',group:'4'});
 assert.equal(api.loadStoredOfficer().name,'Tên mới');
});
test('Preserve class name and academic year',()=>{
 const {api}=setup(); api.saveStoredSettings({...api.DEFAULT_SETTINGS,className:'LỚP 6D8',academicYear:'2025 - 2026'});
 assert.equal(api.loadStoredSettings().className,'LỚP 6D8');
 assert.equal(api.loadStoredSettings().academicYear,'2025 - 2026');
});
test('Preserve empty rules',()=>{const {api}=setup();api.saveStoredRules([]);assert.equal(api.loadStoredRules().length,0);});
test('Keep malformed original storage until explicit restore',()=>{
 const {api,map}=setup({[key]:'{bad JSON'});
 api.loadStoredStudents();api.saveStoredStudents(api.INITIAL_STUDENTS);
 assert.equal(map.get(key),'{bad JSON');assert.ok(api.getStorageError());
 api.prepareRestore({students:[]});api.saveStoredStudents([]);assert.equal(map.get(key),'[]');
});
test('Report quota failure and successful retry',()=>{
 const {api,storage,map}=setup();const save=storage.setItem;
 storage.setItem=()=>{throw new Error('QuotaExceededError')};api.saveStoredStudents([]);assert.ok(api.getStorageError());
 storage.setItem=save;api.saveStoredStudents([]);assert.equal(api.getStorageError(),'');assert.equal(map.get(key),'[]');
});
test('Full monthly backup round trip',()=>{
 const {api}=setup();const students=api.INITIAL_STUDENTS.map(s=>({...s}));
 const store=api.createDefaultMonthlyStore(students,[]);store.activeMonthId='2026-10';store.months['2026-10'].studentScores['hs-01']=0;
 const backup={students,settings:api.DEFAULT_SETTINGS,monthlyStore:store,rules:[],pointLogs:[],attendance:{}};
 api.validateBackup(JSON.parse(JSON.stringify(backup)));api.saveStoredMonthlyData(store);
 assert.equal(JSON.stringify(api.loadStoredMonthlyData()),JSON.stringify(store));
});
test('Reject invalid backup before restore',()=>{
 const {api}=setup();assert.throws(()=>api.validateBackup({students:[{name:'missing id'}]}));
 assert.throws(()=>api.validateBackup({students:[],monthlyStore:{activeMonthId:'missing',months:{}}}));
});
test('Standalone HTML includes complete snapshot and parses',()=>{
 const bundled=buildSync({entryPoints:[path.join(root,'src/utils/htmlExporter.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 let html;const c={module:{exports:{}},Blob:class{constructor(parts){html=parts.join('')}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},document:{createElement:()=>({click(){}}),body:{appendChild(){},removeChild(){}}}};
 vm.runInNewContext(bundled,c);const {api}=setup();
 c.module.exports.downloadStandaloneHtml([{...api.INITIAL_STUDENTS[0],name:'</script><script>invalid!</script>'}],api.DEFAULT_SETTINGS,{pointLogs:[{id:'test-log'}],attendance:{test:{status:'late'}},rules:[],monthlyStore:api.createDefaultMonthlyStore([],[])});
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);
 new vm.Script(scripts[0][1]);
 const map=new Map([['unrelated','keep']]);
 const localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const doc={getElementById:()=>null,createElement:()=>({style:{}}),body:{prepend(){}}};
 const makeContext=()=>vm.createContext({localStorage,document:doc,window:{addEventListener(){}},console});
 const first=makeContext();vm.runInContext(scripts[0][1],first);
 assert.equal(vm.runInContext("students[0].points=7; saveState()",first),true);
 const second=makeContext();vm.runInContext(scripts[0][1],second);
 assert.equal(vm.runInContext('students[0].points',second),7);
 assert.equal(vm.runInContext('pointLogs[0].id',second),'test-log');
 assert.equal(map.get('unrelated'),'keep');
 localStorage.setItem=()=>{throw Error('quota')};assert.equal(vm.runInContext('saveState()',second),false);
 assert.ok(html.includes('test-log'));assert.ok(html.includes('monthlyStore'));assert.ok(!html.includes('localStorage.clear()'));
});
console.log(`${passed} checks passed`);
