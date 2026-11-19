import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// Allow Node's TypeScript loader to resolve the app's bundler-style imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { workoutSnapshot, askData, COACH_CONTEXT_VERSION } = await import('../src/lib/coach.ts');
const {
  readStoredValue, parseStoredValue, writeStoredValue, subscribeStoredValue,
} = await import('../src/lib/localStorageStore.ts');
const t = (key, values = {}) => `${key} ${JSON.stringify(values)}`;
const workout = {
  id: 'a', date: '2026-11-17T00:00:00.000Z', name: 'Leg day', notes: 'Tired today',
  exercises: [
    { id: 's', exerciseId: 's', name: 'Squat', notes: 'Knee discomfort', supersetId: 'pair',
      sets: [{ reps: 5, weight: 80, completed: true }, { reps: 8, weight: 60, completed: false }] },
    { id: 'c', exerciseId: 'c', name: 'Bike', supersetId: 'pair',
      sets: { duration: 24, distance: 6, pace: 999 } },
  ],
};

test('snapshot includes recorded sets, notes, groups and derived cardio pace without progress labels', () => {
  const snapshot = workoutSnapshot(workout, t);
  for (const value of ['Leg Day', 'Squat', 'Knee discomfort', 'Tired today', '"reps":5', '"weight":80',
    '"reps":8', '"weight":60', '"pace":4',
    'coach.snapshotDate', 'coach.weightUnitUnknown']) {
    assert.ok(snapshot.includes(value), value);
  }
  assert.equal(snapshot.match(/coach.snapshotSuperset \{"number":1\}/g).length, 2);
  assert.ok(!snapshot.includes('999'));
  assert.doesNotMatch(snapshot, /completed|planned|status/i);
  const changedFlags = structuredClone(workout);
  changedFlags.exercises[0].sets.forEach(set => { set.completed = !set.completed; });
  assert.equal(workoutSnapshot(changedFlags, t), snapshot);
  assert.match(workoutSnapshot(null, t), /coach.noActiveWorkout/);
});

test('follow-up sends previous dialogue and historical context plus the newest workout', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({ choices: [{ message: { content: JSON.stringify({answer:'Continue gently.',recommendations:[]}) } }] });
  };
  try {
    const oldSnapshot = workoutSnapshot(workout, t);
    const latest = structuredClone(workout);
    latest.exercises[0].sets[1].reps = 10;
    latest.notes = 'Feeling better now';
    const result = await askData({ apiKey:'test', model:'gpt-6-astra', question:'What about now?',
      snapshot:workoutSnapshot(latest,t), language:'en', t,
      turns:[{id:'turn1',question:'How much should I do?',snapshot:oldSnapshot,contextVersion:COACH_CONTEXT_VERSION,response:{answer:'Take it easy.',recommendations:[]}}] });
    assert.equal(result.answer,'Continue gently.');
    assert.deepEqual(requests[0].messages.map(m=>m.role), ['system','user','assistant','user']);
    assert.match(requests[0].messages[1].content,/Tired today/);
    assert.match(requests[0].messages[2].content,/Take it easy/);
    assert.match(requests[0].messages[3].content,/Feeling better now/);
    assert.match(requests[0].messages[3].content,/"reps":10/);
    assert.equal(requests[0].reasoning_effort,'xhigh');
    assert.ok(!('temperature' in requests[0]));
    assert.equal(requests[0].response_format.type,'json_schema');
    await askData({apiKey:'test',model:'gpt-4o',question:'Hello',snapshot:'None',turns:[],language:'ja',t});
    assert.equal(requests[1].temperature,0.3);
    assert.ok(!('reasoning_effort' in requests[1]));
    assert.match(requests[1].messages[0].content,/Japanese/);
    await askData({apiKey:'test',model:'gpt-6-astra',question:'Follow up',snapshot:workoutSnapshot(latest,t),language:'en',t,
      turns:[{id:'legacy',question:'Earlier question',snapshot:'3 sets (0 completed)',response:{answer:'Earlier answer',recommendations:[]}}]});
    assert.equal(requests[2].messages[1].content,'Question: Earlier question');
    assert.match(requests[2].messages[2].content,/Earlier answer/);
    assert.doesNotMatch(JSON.stringify(requests[2].messages),/0 completed/);
  } finally { globalThis.fetch = originalFetch; }
});

test('failed or malformed responses do not become invented coaching replies', async () => {
  const originalFetch = globalThis.fetch;
  const options = {apiKey:'test',model:'gpt-6-astra',question:'Hello',snapshot:'None',turns:[],language:'en',t};
  try {
    globalThis.fetch = async () => new Response('Internal details', {status:500});
    await assert.rejects(askData(options),/coach.requestFailed/);
    globalThis.fetch = async () => Response.json({choices:[{message:{content:'null'}}]});
    await assert.rejects(askData(options),/coach.noStructuredResponse/);
  } finally { globalThis.fetch = originalFetch; }
});

test('storage updates publish immediately and functional updates preserve the latest workout', () => {
  const originalWindow = globalThis.window;
  const values = new Map();
  const target = new EventTarget();
  target.localStorage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  globalThis.window = target;
  let updates = 0;
  const unsubscribe = subscribeStoredValue('currentWorkout',()=>updates++);
  try {
    writeStoredValue('currentWorkout',workout,null);
    writeStoredValue('currentWorkout',previous=>({...previous,notes:'Edited elsewhere'}),null);
    writeStoredValue('currentWorkout',previous=>({...previous,exercises:[...previous.exercises,{id:'new'}]}),null);
    assert.equal(updates,3);
    const latest = parseStoredValue(readStoredValue('currentWorkout'),null);
    assert.equal(latest.notes,'Edited elsewhere');
    assert.equal(latest.exercises.length,3);
    const event = new Event('storage');
    Object.assign(event,{key:'currentWorkout',storageArea:target.localStorage});
    target.dispatchEvent(event);
    assert.equal(updates,4);
    unsubscribe();
    target.dispatchEvent(event);
    assert.equal(updates,4);
    assert.deepEqual(parseStoredValue('broken',[]),[]);
  } finally { unsubscribe(); globalThis.window = originalWindow; }
});

test('full history includes oldest and newest records without mutating or leaking completion flags', async () => {
  const { historySnapshot, coachContext } = await import('../src/lib/coach.ts');
  const history = Array.from({length: 150}, (_, i) => ({...structuredClone(workout),
    id: String(i), date: `2025-01-01T00:00:00.000Z`, notes: `Record ${i}`}));
  const before = JSON.stringify(history);
  const snapshot = historySnapshot(history, t);
  assert.match(snapshot, /Record 0\b/);
  assert.match(snapshot, /Record 149\b/);
  assert.equal(snapshot.match(/coach.snapshotDate/g).length, 150);
  assert.doesNotMatch(snapshot, /completed/);
  assert.equal(JSON.stringify(history), before);
  assert.match(coachContext('No active workout', snapshot, 'I train twice a week'), /I train twice a week/);
  assert.match(coachContext('None', '', ''), /No saved workouts/);
});

test('latest full history and personal context are sent once with ongoing dialogue', async () => {
  const originalFetch = globalThis.fetch;
  let body;
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return Response.json({choices:[{message:{content:JSON.stringify({answer:'Your squat increased.', recommendations:[]})}}]});
  };
  try {
    await askData({apiKey:'test', model:'gpt-4o', question:'How has my squat changed?',
      snapshot:'No active workout', history:'Historical squat 50, latest squat 80', profile:'Goal: strength; two days weekly',
      turns:[{id:'old',question:'I prefer mornings',snapshot:'Old workout',contextVersion:COACH_CONTEXT_VERSION,response:{answer:'Understood',recommendations:[]}}],language:'en',t});
    const request = JSON.stringify(body.messages);
    assert.equal(request.match(/Historical squat/g).length,1);
    assert.match(request,/Goal: strength/);
    assert.match(request,/I prefer mornings/);
    assert.match(request,/No active workout/);
    assert.doesNotMatch(request,/not past workout history/);
    globalThis.fetch = async () => Response.json({error:{code:'context_length_exceeded'}},{status:400});
    await assert.rejects(askData({apiKey:'test',model:'gpt-4o',question:'Q',snapshot:'S',turns:[],language:'en',t}),/coach.contextTooLarge/);
  } finally { globalThis.fetch = originalFetch; }
});

test('migration preserves prior chats and ignores duplicate or damaged entries', async () => {
  const { readLegacyCoachTurns } = await import('../src/lib/coach.ts');
  const turn = {id:'one',question:'My goals',snapshot:'Workout',response:{answer:'Hello',recommendations:[]}};
  const entries = new Map([
    ['coachChat:general',JSON.stringify([turn])],
    ['coachChat:a',JSON.stringify([turn,{...turn,id:'two'}])],
    ['coachChat:a:draft',JSON.stringify('Draft')],
    ['coachChat:broken','invalid'],
    ['coachApiKey','not-a-chat'],
  ]);
  const storage = {length:entries.size,key:i=>[...entries.keys()][i],getItem:key=>entries.get(key)};
  assert.deepEqual(readLegacyCoachTurns(storage).map(turn=>turn.id),['one','two']);
  assert.equal(entries.size,5);
});
