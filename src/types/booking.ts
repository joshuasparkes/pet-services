export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  specialNeeds?: string;
  emergencyContact?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  postcode: string;
  pets: Pet[];
  createdAt: Date;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  content: string;
  timestamp: Date;
  readBy: string[]; // Array of user IDs who have read this message
}

export interface BookingRequest {
  id: string;
  userId: string;
  petIds: string[];
  serviceType: 'meet-greet' | 'group-walk' | 'solo-walk' | 'drop-in' | 'day-care' | 'overnight';
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  price?: number;
  paymentMethod: 'cash' | 'bank-transfer';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
  unreadMessages?: number; // Count of unread messages for this user
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface ServicePricing {
  'meet-greet': {
    '30min': number;
  };
  'group-walk': {
    '30min': number;
    '60min': number;
  };
  'solo-walk': {
    '30min': number;
    '60min': number;
  };
  'drop-in': {
    '15min': number;
  };
  'day-care': {
    '8hrs': number;
  };
  'overnight': {
    'standard': number;
  };
}