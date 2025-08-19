import Dexie from 'dexie';

const db = new Dexie('LocalSessionsDb');
db.version(1).stores({ sessions: '&user , outlet' });

export default db;