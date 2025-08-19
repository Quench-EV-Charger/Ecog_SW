import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("chargingSessions");

// Define the schema with compound primary key `[outlet+user]`
db.version(1).stores({
  sessions: "[outlet+user], outlet, user, outletType, timestamp, sessionStart, sessionStop, energyConsumed, startPercentage, endPercentage"
});

// Function to reset the database
export const resetDb = async () => {
  try {
    await db.delete();
    console.log("Database has been reset.");
  } catch (err) {
    console.error("Error resetting database:", err);
  }
};

// Function to add or update a session in the database
export const addOrUpdateSessionToDb = async (
  outlet,
  user,
  outletType,
  timestamp,
  sessionStart,
  sessionStop,
  energyConsumed,
  startPercentage,
  endPercentage
) => {
  const existingSession = await fetchSessionByOutletAndUser(outlet, user);
  // Create session object
  let session = {
    outlet,
    user,
    outletType,
    timestamp,
    sessionStart,
    sessionStop,
    energyConsumed,
    // Keep startPercentage only if this is a new session; otherwise, use the existing value
    startPercentage: existingSession ? existingSession.startPercentage : startPercentage,
    endPercentage
  };

  try {
    // Use 'put' to insert or update the session based on compound key (outlet+user)
    const id = await db.table("sessions").put(session);
  } catch (err) {
    console.error("Error adding/updating session:", err);
  }
};

// Function to fetch all sessions from the database
export const fetchAllSessionsFromDb = async () => {
  try {
    const sessions = await db.table("sessions").toArray();
    console.log("All sessions fetched:", sessions);
    return sessions;
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return [];
  }
};

// Function to fetch a session by outlet and user
export const fetchSessionByOutletAndUser = async (outlet, user) => {
  try {
    const session = await db.table("sessions").get([outlet, user]);
    return session;
  } catch (err) {
    console.error("Error fetching session by outlet and user:", err);
    return null;
  }
};

// Function to delete a session by outlet and user
export const deleteSession = async (outlet, user) => {
  try {
    // Use the 'delete' method to remove the session by compound key [outlet, user]
    const deletedCount = await db.table("sessions").delete([outlet, user]);
    if (deletedCount > 0) {
      console.log(`Session deleted for outlet: ${outlet}, user: ${user}`);
    } else {
      console.log(`No session found to delete for outlet: ${outlet}, user: ${user}`);
    }
  } catch (err) {
    console.error("Error deleting session:", err);
  }
};