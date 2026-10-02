// Kiểm tra lớp dữ liệu Firebase mà KHÔNG cần emulator: nguồn upload, chuẩn hoá, mô tả.
const {buildSync} = require('esbuild');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const code = buildSync({
  entryPoints: [path.join(root, 'src/cloud/data.ts')],
  bundle: true, platform: 'node', format: 'cjs', write: false
}).outputFiles[0].text;

function setup(seed = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k)};
  const ctx = {module: {exports: {}}, console: {error() {}}, localStorage: storage, sessionStorage: storage};
  vm.runInNewContext(code, ctx);
  return {api: ctx.module.exports, map};
}

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS', name); }

const KEYS = {
  students: 'classroom_students_v7c8_54',
  settings: 'classroom_settings_v1',
  logs: 'classroom_logs_v7c8',
  monthly: 'classroom_monthly_data_v1'
};

test('Dữ liệu mẫu dựng sẵn đủ 54 học sinh và hợp lệ để đưa lên Firebase', () => {
  const {api} = setup();
  const sample = api.sampleData();
  assert.equal(sample.students.length, 54);
  assert.equal(new Set(sample.students.map(s => s.id)).size, 54);
  assert.ok(sample.rules.length > 0);
  assert.ok(Object.keys(sample.monthlyStore.months).length >= 10);
  assert.ok(sample.monthlyStore.months[sample.monthlyStore.activeMonthId]);
  // Điểm hiển thị phải khớp bảng điểm của tháng đang mở.
  const active = sample.monthlyStore.months[sample.monthlyStore.activeMonthId];
  sample.students.forEach(s => assert.equal(s.points, active.studentScores[s.id]));
});

test('Dữ liệu mẫu giữ nguyên qua một vòng chuẩn hoá (không trôi dữ liệu mỗi lần lưu)', () => {
  const {api} = setup();
  const once = api.sampleData();
  assert.equal(api.stableJson(api.normalizeData(once)), api.stableJson(once));
});

test('Lớp trống hợp lệ và không có học sinh', () => {
  const {api} = setup();
  const empty = api.emptyData();
  assert.equal(empty.students.length, 0);
  assert.ok(empty.monthlyStore.months[empty.monthlyStore.activeMonthId]);
});

test('Đọc được dữ liệu bản cũ trong localStorage để đưa lên Firebase', () => {
  const {api} = setup();
  const sample = api.sampleData();
  const seeded = setup({
    [KEYS.students]: JSON.stringify(sample.students),
    [KEYS.settings]: JSON.stringify({...sample.settings, className: 'LỚP 6D8'}),
    [KEYS.logs]: JSON.stringify(sample.pointLogs),
    [KEYS.monthly]: JSON.stringify(sample.monthlyStore)
  });
  const legacy = seeded.api.legacyLocalData();
  assert.ok(legacy);
  assert.equal(legacy.students.length, 54);
  assert.equal(legacy.settings.className, 'LỚP 6D8');
});

test('Đọc được bản lưu riêng của từng tài khoản Firebase trên máy', () => {
  const {api} = setup();
  const sample = api.sampleData();
  const seeded = setup({
    ['firebase:teacher-a:' + KEYS.students]: JSON.stringify(sample.students.slice(0, 3)),
    ['firebase:teacher-b:' + KEYS.students]: JSON.stringify(sample.students.slice(0, 7))
  });
  assert.equal(seeded.api.deviceLocalData('teacher-a').students.length, 3);
  assert.equal(seeded.api.deviceLocalData('teacher-b').students.length, 7);
  assert.equal(seeded.api.deviceLocalData('teacher-c'), null);
});

test('Không có dữ liệu cũ thì trả về null, không bịa dữ liệu mẫu', () => {
  const {api} = setup();
  assert.equal(api.legacyLocalData(), null);
  assert.equal(api.deviceLocalData('teacher-a'), null);
});

test('Dữ liệu cũ hỏng không được âm thầm đưa lên Firebase', () => {
  const broken = setup({[KEYS.students]: '{"khong-phai-mang":true}'});
  assert.equal(broken.api.legacyLocalData(), null);
  const dupes = setup({[KEYS.students]: JSON.stringify([
    {id: 'hs-1', name: 'A', gender: 'male', group: '1', role: 'Thành viên', points: 1, avatarIndex: 1},
    {id: 'hs-1', name: 'B', gender: 'female', group: '2', role: 'Thành viên', points: 2, avatarIndex: 2}
  ])});
  assert.equal(dupes.api.legacyLocalData(), null);
});

test('Mô tả nguồn dữ liệu nêu đúng sĩ số và tên lớp', () => {
  const {api} = setup();
  const text = api.describeData(api.sampleData());
  assert.ok(text.includes('54 học sinh'));
  assert.ok(text.includes('LỚP 7C8'));
});

test('Thông báo lỗi Firebase bằng tiếng Việt cho các mã thường gặp', () => {
  const {api} = setup();
  ['permission-denied', 'unavailable', 'unauthenticated', 'not-found', 'conflict', 'auth/unauthorized-domain']
    .forEach(code => {
      const message = api.firebaseMessage({code});
      assert.ok(message.length > 10 && !message.includes(code), 'Thiếu thông báo cho ' + code);
    });
});

console.log(`${passed} cloud data checks passed`);
