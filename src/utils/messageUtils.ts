import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/types/booking';

export const getUnreadMessageCount = (
  bookingId: string, 
  userId: string, 
  callback: (count: number) => void
) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('bookingId', '==', bookingId)
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as Message[];

    // Count messages not read by this user
    const unreadCount = messages.filter(
      msg => !msg.readBy.includes(userId)
    ).length;

    callback(unreadCount);
  });
};

export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  
  return date.toLocaleDateString('en-GB');
};