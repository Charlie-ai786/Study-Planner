import db from './src/db';
try {
  console.log('--- USERS ---');
  console.log(db.prepare('PRAGMA table_info(users)').all());
  console.log('--- PLANS ---');
  console.log(db.prepare('PRAGMA table_info(plans)').all());
  console.log('--- TASKS ---');
  console.log(db.prepare('PRAGMA table_info(tasks)').all());
  console.log('--- SESSIONS ---');
  console.log(db.prepare('PRAGMA table_info(sessions)').all());
  console.log('--- PROGRESS ---');
  console.log(db.prepare('PRAGMA table_info(progress)').all());
} catch (e) {
  console.error('Inspection failed:', e);
}
process.exit(0);
