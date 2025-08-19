import Dexie from 'dexie';

const db = new Dexie("chargingSessions");

db.version(1).stores({
  sessions: "[outlet+user], outlet, user, outletType, timestamp, sessionStart, sessionStop, energyConsumed, startPercentage, endPercentage"
});

export default db;
