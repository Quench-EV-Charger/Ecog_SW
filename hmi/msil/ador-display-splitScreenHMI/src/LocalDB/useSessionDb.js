import { useCallback } from "react";
import db from "./db";

// Hook to handle all session DB operations
const useSessionDb = () => {
  const resetDb = useCallback(async () => {
    try {
      await db.delete();
      console.log("Database has been reset.");
    } catch (err) {
      console.error("Error resetting database:", err);
    }
  }, []);

  const fetchAllSessionsFromDb = useCallback(async () => {
    try {
      const sessions = await db.table("sessions").toArray();
      return sessions;
    } catch (err) {
      console.error("Error fetching sessions:", err);
      return [];
    }
  }, []);

  const fetchSessionByOutletAndUser = useCallback(async (outlet, user) => {
    try {
      const session = await db.table("sessions").get([outlet, user]);
      return session;
    } catch (err) {
      console.error("Error fetching session by outlet and user:", err);
      return null;
    }
  }, []);

  const addOrUpdateSessionToDb = useCallback(async (
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

    const session = {
      outlet,
      user,
      outletType,
      timestamp,
      sessionStart,
      sessionStop,
      energyConsumed,
      startPercentage: existingSession ? existingSession.startPercentage : startPercentage,
      endPercentage,
    };

    try {
      await db.table("sessions").put(session);
    } catch (err) {
      console.error("Error adding/updating session:", err);
    }
  }, [fetchSessionByOutletAndUser]);

  const deleteSession = useCallback(async (outlet, user) => {
    try {
      const deletedCount = await db.table("sessions").delete([outlet, user]);
      if (deletedCount > 0) {
        console.log(`Session deleted for outlet: ${outlet}, user: ${user}`);
      } else {
        console.log(`No session found to delete for outlet: ${outlet}, user: ${user}`);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  }, []);

  return {
    resetDb,
    fetchAllSessionsFromDb,
    fetchSessionByOutletAndUser,
    addOrUpdateSessionToDb,
    deleteSession,
  };
};

export default useSessionDb;
