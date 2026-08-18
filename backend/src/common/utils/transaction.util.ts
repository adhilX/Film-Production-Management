import { Connection, ClientSession } from 'mongoose';

/**
 * Safely starts a transaction session if running in a replica set environment.
 * Otherwise returns null to bypass transactions.
 */
export async function getTransactionSession(
  connection: Connection,
): Promise<ClientSession | null> {
  try {
    const connAny = connection as any;
    const isReplica =
      connAny.client?.topology?.description?.type?.includes('ReplicaSet') ||
      Array.from(
        connAny.client?.topology?.description?.servers?.values() || [],
      ).some((server: any) => server.type?.includes('ReplicaSet'));
    if (isReplica) {
      const session = await connection.startSession();
      session.startTransaction();
      return session;
    }
  } catch (e) {
    // Fallback to standalone MongoDB
  }
  return null;
}
