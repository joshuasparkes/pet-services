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

      // Send confirmation email (in a real app, this would trigger a cloud function)
      if (status === 'confirmed') {
        console.log('Send confirmation email to user');
      }
      
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
            <p className="text-gray-600">Bournville Pet Services</p>
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faDashboard} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Bournville Pet Services</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back, Isabel</p>
                <p className="text-xs text-gray-700">{new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors cursor-pointer"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex cursor-pointer space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: faDashboard },
            { id: 'calendar', label: 'Calendar', icon: faCalendarAlt },
            { id: 'bookings', label: 'Bookings', icon: faClipboardList },
            { id: 'customers', label: 'Customers', icon: faUsers },
            { id: 'activity', label: 'Activity Log', icon: faBell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faBell} className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
                  </div>
                  <div className="w-12 cursor-pointer h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">£{stats.totalRevenue}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faPoundSign} className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Pending Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Requests */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
                </div>
                <div className="p-6">
                  {bookings.filter(b => b.status === 'pending').slice(0, 5).map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow mb-3 last:mb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Customer Name */}
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                            </div>
                            <p className="font-semibold text-gray-900 text-base">{getUserName(booking.userId)}</p>
                          </div>

                          {/* Service Type Badge */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FontAwesomeIcon icon={faPaw} className="mr-1.5" />
                              {booking.serviceType.replace('-', ' ')}
                            </span>
                          </div>

                          {/* Date and Time Info */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center text-gray-700">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                              <span className="font-medium">{formatDate(booking.date)}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400" />
                              <span className="font-medium">{booking.startTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faCheck} className="text-base" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-base" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setSelectedChatBooking(booking)}
                            className="relative flex items-center space-x-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faComment} className="text-base" />
                            <span>Chat</span>
                            {unreadCounts[booking.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {unreadCounts[booking.id]}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'rejected')}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faTimes} className="text-base" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'pending').length === 0 && (
                    <p className="text-gray-700 text-center py-8">No pending requests</p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6">
                  {activityLog.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faClipboardList} className="text-primary text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-700">{activity.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {activityLog.length === 0 && (
                    <p className="text-gray-700 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
            </div>
            <div className="overflow-x-auto">
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
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
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
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
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
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
            </div>
            <div className="overflow-x-auto">
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
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="p-6">
              {activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 py-4 border-b border-gray-100 last:border-b-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faClipboardList} className="text-primary text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-700">{activity.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <p className="text-gray-700 text-center py-8">No activity recorded</p>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Booking Calendar</h2>
            </div>
            <div className="p-6">
              {/* Upcoming Bookings */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h3>
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.date >= new Date() && booking.status === 'confirmed')
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(booking.date)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {booking.startTime} - {booking.endTime}
                              </div>
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {booking.serviceType.replace('-', ' ')}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Customer: {getUserName(booking.userId)} | Price: £{booking.price}
                            </div>
                            {booking.specialInstructions && (
                              <div className="mt-2 text-sm text-gray-500">
                                Instructions: {booking.specialInstructions}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors cursor-pointer text-sm"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-sm" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setSelectedChatBooking(booking)}
                              className="relative flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors cursor-pointer text-sm"
                            >
                              <FontAwesomeIcon icon={faComment} className="text-sm" />
                              <span>Chat</span>
                              {unreadCounts[booking.id] > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {unreadCounts[booking.id]}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors cursor-pointer text-sm"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                              <span>Complete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {bookings.filter(booking => booking.date >= new Date() && booking.status === 'confirmed').length === 0 && (
                    <p className="text-gray-700 text-center py-8">No upcoming bookings</p>
                  )}
                </div>
              </div>

              {/* Past Bookings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Bookings</h3>
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.date < new Date() || booking.status === 'completed')
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 10)
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(booking.date)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {booking.startTime} - {booking.endTime}
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Customer: {getUserName(booking.userId)} | {booking.serviceType.replace('-', ' ')} | £{booking.price}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors cursor-pointer text-sm"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-sm" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setSelectedChatBooking(booking)}
                              className="relative flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors cursor-pointer text-sm"
                            >
                              <FontAwesomeIcon icon={faComment} className="text-sm" />
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
                    <p className="text-gray-700 text-center py-8">No past bookings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{selectedCustomer.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Postcode</label>
                    <p className="text-gray-900">{selectedCustomer.postcode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer Since</label>
                    <p className="text-gray-900">{selectedCustomer.createdAt.toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              {/* Pet Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pet Information</h3>
                <div className="space-y-4">
                  {selectedCustomer.pets?.map((pet, index) => (
                    <div key={pet.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{pet.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking History</h3>
                <div className="space-y-3">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                  <p className="text-gray-700">{getUserName(selectedBooking.userId)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Service</h3>
                  <p className="text-gray-700 capitalize">{selectedBooking.serviceType.replace('-', ' ')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date & Time</h3>
                  <p className="text-gray-700">
                    {formatDate(selectedBooking.date)} at {selectedBooking.startTime} - {selectedBooking.endTime}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Price</h3>
                  <p className="text-gray-700">£{selectedBooking.price}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                  <p className="text-gray-700 capitalize">{selectedBooking.paymentMethod}</p>
                </div>
              </div>

              {selectedBooking.specialInstructions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedBooking.specialInstructions}</p>
                </div>
              )}

              {selectedBooking.adminNotes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedBooking.adminNotes}</p>
                </div>
              )}

              {/* Chat Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedChatBooking(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
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
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : null}
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'rejected')}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Reject Booking
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                    disabled={isLoading}
                    className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
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