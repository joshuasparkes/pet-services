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

export interface BookingRequest {
  id: string;
  userId: string;
  petIds: string[];
  serviceType: 'dog-walking' | 'pet-sitting' | 'home-visit';
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
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface ServicePricing {
  'dog-walking': {
    '30min': number;
    '60min': number;
  };
  'pet-sitting': {
    'half-day': number;
    'full-day': number;
    'overnight': number;
  };
  'home-visit': {
    '30min': number;
    '60min': number;
  };
}