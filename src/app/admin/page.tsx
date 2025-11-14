'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDashboard,
  faCalendarAlt,
  faEnvelope,
  faPoundSign,
  faCheck,
  faTimes,
  faEye,
  faSpinner,
  faBell,
  faUsers,
  faPaw,
  faClipboardList,
  faChartLine,
  faComment,
  faCheckCircle,
  faUser,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy, 
  where,
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import type { BookingRequest, User } from '@/types/booking';
import BookingChat from '@/components/BookingChat';
import { getUnreadMessageCount } from '@/utils/messageUtils';

interface AdminStats {
  totalBookings: number;
  pendingRequests: number;
  completedBookings: number;
  totalRevenue: number;
}

interface ActivityLogEntry {
  id: string;
  type: 'booking_submitted' | 'booking_confirmed' | 'booking_completed' | 'booking_cancelled';
  message: string;
  timestamp: Date;
  bookingId?: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalBookings: 0, pendingRequests: 0, completedBookings: 0, totalRevenue: 0 });
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedChatBooking, setSelectedChatBooking] = useState<BookingRequest | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{[bookingId: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen to bookings
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BookingRequest[];
      
      setBookings(bookingsData);
      
      // Calculate stats
      const stats = bookingsData.reduce((acc, booking) => ({
        totalBookings: acc.totalBookings + 1,
        pendingRequests: acc.pendingRequests + (booking.status === 'pending' ? 1 : 0),
        completedBookings: acc.completedBookings + (booking.status === 'completed' ? 1 : 0),
        totalRevenue: acc.totalRevenue + (booking.status === 'completed' && booking.price ? booking.price : 0),
      }), { totalBookings: 0, pendingRequests: 0, completedBookings: 0, totalRevenue: 0 });
      
      setStats(stats);
    });

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as User[];
      setUsers(usersData);
    });

    // Listen to activity log
    const activityQuery = query(
      collection(db, 'activityLog'), 
      orderBy('timestamp', 'desc')
    );
    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const activityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as ActivityLogEntry[];
      setActivityLog(activityData);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeUsers();
      unsubscribeActivity();
    };
  }, []);

  // Monitor unread message counts for all bookings (admin view)
  useEffect(() => {
    if (bookings.length === 0) return;

    const unsubscribeCallbacks: (() => void)[] = [];

    bookings.forEach(booking => {
      const unsubscribe = getUnreadMessageCount(
        booking.id, 
        'admin', // Admin uses 'admin' as their ID for read tracking
        (count) => {
          setUnreadCounts(prev => ({
            ...prev,
            [booking.id]: count
          }));
        }
      );
      unsubscribeCallbacks.push(unsubscribe);
    });

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [bookings]);

  const handleApproveBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to APPROVE this booking? This means you are accepting the booking request and committing to provide the service.')) {
      updateBookingStatus(bookingId, 'confirmed');
    }
  };

  const handleCompleteBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to mark this booking as COMPLETE? Only click this if the appointment has already happened and the service was successfully completed.')) {
      updateBookingStatus(bookingId, 'completed');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingRequest['status'], adminNotes?: string) => {
    setIsLoading(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: new Date(),
        ...(adminNotes && { adminNotes })
      });

      // Add to activity log
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await addDoc(collection(db, 'activityLog'), {
          type: `booking_${status}`,
          message: `Booking for ${booking.serviceType} on ${booking.date.toLocaleDateString()} ${status}`,
          timestamp: Timestamp.now(),
          bookingId
        });
      }

      // TEMPORARILY DISABLED: Send email notification to customer and CC admin
      // const user = users.find(u => u.id === booking.userId);
      // if (user) {
      //   try {
      //     const emailType = status === 'confirmed' ? 'booking_confirmed' : 'booking_rejected';
      //     await fetch('/api/send-email', {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         type: emailType,
      //         data: {
      //           customerName: `${user.firstName} ${user.lastName}`,
      //           customerEmail: user.email,
      //           serviceType: booking.serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      //           date: booking.date.toLocaleDateString('en-GB'),
      //           startTime: booking.startTime,
      //           endTime: booking.endTime,
      //           price: booking.price,
      //         },
      //       }),
      //     });
      //   } catch (emailError) {
      //     console.error('Failed to send email notification:', emailError);
      //     // Don't block the status update if email fails
      //   }
      // }
      
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  // Check for stored authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'harvey') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faDashboard} className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600">Bournville Pet Care</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                placeholder="Enter admin password"
                autoFocus
                required
              />
              {authError && (
                <p className="mt-2 text-sm text-red-600">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium cursor-pointer"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-primary cursor-pointer">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faDashboard} className="text-white text-sm sm:text-base" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Admin</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Bournville Pet Care</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-red-600 transition-colors cursor-pointer whitespace-nowrap"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Tabs - Horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 mb-6 sm:mb-8">
          <div className="flex cursor-pointer space-x-1 bg-gray-100 rounded-lg p-1 min-w-max sm:min-w-0 mx-3 sm:mx-0">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: faDashboard, shortLabel: 'Home' },
              { id: 'calendar', label: 'Calendar', icon: faCalendarAlt, shortLabel: 'Calendar' },
              { id: 'bookings', label: 'Bookings', icon: faClipboardList, shortLabel: 'Bookings' },
              { id: 'customers', label: 'Customers', icon: faUsers, shortLabel: 'Customers' },
              { id: 'activity', label: 'Activity Log', icon: faBell, shortLabel: 'Activity' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-sm sm:text-base" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary text-lg sm:text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.pendingRequests}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faBell} className="text-orange-600 text-lg sm:text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedBookings}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} className="text-green-600 text-lg sm:text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">£{stats.totalRevenue}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faPoundSign} className="text-green-600 text-lg sm:text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Pending Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Pending Requests */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pending Requests</h2>
                </div>
                <div className="p-3 sm:p-6">
                  {bookings.filter(b => b.status === 'pending').slice(0, 5).map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow mb-3 last:mb-0">
                      {/* Customer Name */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faUser} className="text-white text-xs sm:text-sm" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{getUserName(booking.userId)}</p>
                      </div>

                      {/* Service Type Badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FontAwesomeIcon icon={faPaw} className="mr-1.5" />
                          {booking.serviceType.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Date and Time Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-4">
                        <div className="flex items-center text-gray-700">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400 flex-shrink-0" />
                          <span className="font-medium truncate">{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{booking.startTime}</span>
                        </div>
                      </div>

                      {/* Action Buttons - Touch-friendly on mobile */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2.5 sm:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-sm sm:text-base" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2.5 sm:py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2.5 sm:py-2 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-sm sm:text-base" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setSelectedChatBooking(booking)}
                          className="relative flex items-center justify-center space-x-1.5 px-3 py-2.5 sm:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faComment} className="text-sm sm:text-base" />
                          <span>Chat</span>
                          {unreadCounts[booking.id] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {unreadCounts[booking.id]}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'pending').length === 0 && (
                    <p className="text-gray-700 text-center py-8 text-sm">No pending requests</p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-3 sm:p-6">
                  {activityLog.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faClipboardList} className="text-primary text-xs sm:text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-700">{activity.timestamp.toLocaleString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    </div>
                  ))}
                  {activityLog.length === 0 && (
                    <p className="text-gray-700 text-center py-8 text-sm">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Bookings</h2>
            </div>
            {/* Mobile Card Layout */}
            <div className="lg:hidden p-3 space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm truncate">{getUserName(booking.userId)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.serviceType.replace('-', ' ')}
                        </span>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 ml-2">£{booking.price}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-gray-400" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-400" />
                      <span>{booking.startTime}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer text-xs font-medium"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-sm" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setSelectedChatBooking(booking)}
                      className="relative flex items-center justify-center space-x-1 px-3 py-2.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 transition-colors cursor-pointer text-xs font-medium"
                    >
                      <FontAwesomeIcon icon={faComment} className="text-sm" />
                      <span>Chat</span>
                      {unreadCounts[booking.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCounts[booking.id]}
                        </span>
                      )}
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer text-xs font-medium"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-sm" />
                          <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors cursor-pointer text-xs font-medium"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-sm" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        className="col-span-2 flex items-center justify-center space-x-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer text-xs font-medium"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getUserName(booking.userId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{booking.serviceType.replace('-', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                        <div className="text-sm text-gray-700">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{booking.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-sm" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setSelectedChatBooking(booking)}
                            className="relative flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faComment} className="text-sm" />
                            <span>Chat</span>
                            {unreadCounts[booking.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                {unreadCounts[booking.id]}
                              </span>
                            )}
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveBooking(booking.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faCheck} className="text-sm" />
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                              <span>Complete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Customers</h2>
            </div>
            {/* Mobile Card Layout */}
            <div className="lg:hidden p-3 space-y-3">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="truncate">{user.email}</p>
                        <p>{user.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700">
                        <FontAwesomeIcon icon={faPaw} className="mr-1.5 text-gray-400" />
                        {user.pets?.length || 0} pets
                      </span>
                      <span className="text-gray-700">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-gray-400" />
                        {bookings.filter(b => b.userId === user.id).length} bookings
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(user)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer text-xs font-medium"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-sm" />
                    <span>View Details</span>
                  </button>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Pets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.pets?.length || 0} pets</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bookings.filter(b => b.userId === user.id).length} bookings
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCustomer(user)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors cursor-pointer text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-sm" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="p-3 sm:p-6">
              {activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 py-3 sm:py-4 border-b border-gray-100 last:border-b-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faClipboardList} className="text-primary text-xs sm:text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-700">{activity.timestamp.toLocaleString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <p className="text-gray-700 text-center py-8 text-sm">No activity recorded</p>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Booking Calendar</h2>
            </div>
            <div className="p-3 sm:p-6">
              {/* Upcoming Bookings */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Upcoming Bookings</h3>
                <div className="space-y-3 sm:space-y-4">
                  {bookings
                    .filter(booking => booking.date >= new Date() && booking.status === 'confirmed')
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="space-y-3">
                          {/* Date and Service Info */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatDate(booking.date)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {booking.serviceType.replace('-', ' ')}
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">{getUserName(booking.userId)}</span> • £{booking.price}
                          </div>

                          {/* Special Instructions */}
                          {booking.specialInstructions && (
                            <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded">
                              <span className="font-medium">Note:</span> {booking.specialInstructions}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs sm:text-sm" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => setSelectedChatBooking(booking)}
                              className="relative flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              <FontAwesomeIcon icon={faComment} className="text-xs sm:text-sm" />
                              <span className="hidden sm:inline">Chat</span>
                              {unreadCounts[booking.id] > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {unreadCounts[booking.id]}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="text-xs sm:text-sm" />
                              <span className="hidden sm:inline">Complete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {bookings.filter(booking => booking.date >= new Date() && booking.status === 'confirmed').length === 0 && (
                    <p className="text-gray-700 text-center py-8 text-sm">No upcoming bookings</p>
                  )}
                </div>
              </div>

              {/* Past Bookings */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Past Bookings</h3>
                <div className="space-y-3 sm:space-y-4">
                  {bookings
                    .filter(booking => booking.date < new Date() || booking.status === 'completed')
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 10)
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                        <div className="space-y-3">
                          {/* Date and Status */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatDate(booking.date)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </div>
                          </div>

                          {/* Customer and Service Info */}
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">{getUserName(booking.userId)}</span> • {booking.serviceType.replace('-', ' ')} • £{booking.price}
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs sm:text-sm" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setSelectedChatBooking(booking)}
                              className="relative flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 transition-colors cursor-pointer text-xs sm:text-sm"
                            >
                              <FontAwesomeIcon icon={faComment} className="text-xs sm:text-sm" />
                              <span>Chat</span>
                              {unreadCounts[booking.id] > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {unreadCounts[booking.id]}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {bookings.filter(booking => booking.date < new Date() || booking.status === 'completed').length === 0 && (
                    <p className="text-gray-700 text-center py-8 text-sm">No past bookings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate pr-2">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 w-8 h-8 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Contact Information */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm sm:text-base text-gray-900 break-words">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedCustomer.address}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Postcode</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedCustomer.postcode}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Customer Since</label>
                    <p className="text-sm sm:text-base text-gray-900">{selectedCustomer.createdAt.toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              {/* Pet Information */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pet Information</h3>
                <div className="space-y-3 sm:space-y-4">
                  {selectedCustomer.pets?.map((pet) => (
                    <div key={pet.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{pet.name}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Breed:</span>
                          <p className="text-gray-900">{pet.breed}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Age:</span>
                          <p className="text-gray-900">{pet.age} years</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Weight:</span>
                          <p className="text-gray-900">{pet.weight}kg</p>
                        </div>
                      </div>
                      {pet.specialNeeds && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded">
                          <span className="font-medium text-gray-700">Special Needs:</span>
                          <p className="text-gray-600 text-sm mt-1">{pet.specialNeeds}</p>
                        </div>
                      )}
                    </div>
                  )) || (
                    <p className="text-gray-600">No pets registered.</p>
                  )}
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Booking History</h3>
                <div className="space-y-2 sm:space-y-3">
                  {bookings
                    .filter(booking => booking.userId === selectedCustomer.id)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {booking.serviceType.replace('-', ' ')}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(booking.date)} at {booking.startTime} | £{booking.price}
                            </div>
                            {booking.specialInstructions && (
                              <div className="text-sm text-gray-500 mt-1">
                                {booking.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {bookings.filter(booking => booking.userId === selectedCustomer.id).length === 0 && (
                    <p className="text-gray-600">No bookings found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-600 hover:text-gray-800 flex-shrink-0 w-8 h-8 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Customer</h3>
                  <p className="text-sm sm:text-base text-gray-700">{getUserName(selectedBooking.userId)}</p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Service</h3>
                  <p className="text-sm sm:text-base text-gray-700 capitalize">{selectedBooking.serviceType.replace('-', ' ')}</p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Date & Time</h3>
                  <p className="text-sm sm:text-base text-gray-700">
                    {formatDate(selectedBooking.date)} at {selectedBooking.startTime} - {selectedBooking.endTime}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Price</h3>
                  <p className="text-sm sm:text-base text-gray-700">£{selectedBooking.price}</p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Payment</h3>
                  <p className="text-sm sm:text-base text-gray-700 capitalize">{selectedBooking.paymentMethod}</p>
                </div>
              </div>

              {selectedBooking.specialInstructions && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Special Instructions</h3>
                  <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg">{selectedBooking.specialInstructions}</p>
                </div>
              )}

              {selectedBooking.adminNotes && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Admin Notes</h3>
                  <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg">{selectedBooking.adminNotes}</p>
                </div>
              )}

              {/* Chat Button */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedChatBooking(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="w-full bg-purple-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <FontAwesomeIcon icon={faComment} />
                  <span>Chat with Customer</span>
                  {unreadCounts[selectedBooking.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[selectedBooking.id]}
                    </span>
                  )}
                </button>
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApproveBooking(selectedBooking.id)}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : null}
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'rejected')}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    Reject Booking
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCompleteBooking(selectedBooking.id)}
                    disabled={isLoading}
                    className="w-full bg-primary text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-dark active:bg-primary transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : null}
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedChatBooking && (
        <BookingChat
          booking={selectedChatBooking}
          currentUserId="admin"
          currentUserName="Isabel Sparkes"
          isAdmin={true}
          onClose={() => setSelectedChatBooking(null)}
        />
      )}
    </div>
  );
}