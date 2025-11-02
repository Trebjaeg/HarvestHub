/**
 * Socket client utility for server-side real-time event emitting
 * Uses HTTP POST to socket service to emit events to rooms
 */

const SOCKET_SERVICE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

/**
 * Emit an event to a specific room via HTTP POST to socket service
 */
export async function emitToRoom(room: string, event: string, data: any): Promise<boolean> {
  try {
    const response = await fetch(`${SOCKET_SERVICE_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event, data })
    });

    return response.ok;
  } catch (error) {
    console.error('Error emitting to socket room:', error);
    return false;
  }
}

/**
 * Emit a new message event to a user's room
 */
export async function emitNewMessage(userId: string, message: any): Promise<boolean> {
  return emitToRoom(`user:${userId}`, 'new_message', message);
}

/**
 * Emit a notification event to a user's room
 */
export async function emitNotification(userId: string, notification: any): Promise<boolean> {
  return emitToRoom(`user:${userId}`, 'notifications:new', notification);
}

/**
 * Emit to multiple rooms (e.g., both buyer and seller)
 */
export async function emitToMultipleUsers(userIds: string[], event: string, data: any): Promise<void> {
  await Promise.all(
    userIds.map(userId => emitToRoom(`user:${userId}`, event, data))
  );
}
