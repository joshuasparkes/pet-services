'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, 
  faCalendarAlt, 
  faUser, 
  faSignOutAlt,
  faEdit,
  faTrash,
  faEye,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc 
} from 'firebase/firestore';
import type { BookingRequest, User } from '@/types/booking';

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Get user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ id: user.uid, ...userDoc.data() } as User);
        }

        // Listen to user's bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        
        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const bookingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          })) as BookingRequest[];
          
          // Sort by date (newest first)
          bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setBookings(bookingsData);
          setLoading(false);
        });

        return () => unsubscribeBookings();
      } else {
        router.push('/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'cancelled',
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return faClock;
      case 'confirmed': return faCheckCircle;
      case 'completed': return faCheckCircle;
      case 'cancelled': return faTimesCircle;
      case 'rejected': return faTimesCircle;
      default: return faClock;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faPaw} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.firstName}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Home</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bookings' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>My Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Profile & Pets</span>
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
              <a 
                href="/bookings"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Booking
              </a>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-4xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Ready to book your first pet care service?</p>
                <a 
                  href="/bookings"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Make Your First Booking
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            <FontAwesomeIcon icon={getStatusIcon(booking.status)} className="mr-2" />
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-600">
                            Booked {booking.createdAt.toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                              {booking.serviceType.replace('-', ' ')}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div><span className="font-medium">Date:</span> {formatDate(booking.date)}</div>
                              <div><span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}</div>
                              <div><span className="font-medium">Duration:</span> {booking.duration} minutes</div>
                            </div>
                          </div>
                          <div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div><span className="font-medium">Price:</span> £{booking.price}</div>
                              <div><span className="font-medium">Payment:</span> {booking.paymentMethod}</div>
                              <div><span className="font-medium">Payment Status:</span> {booking.paymentStatus}</div>
                            </div>
                          </div>
                        </div>

                        {booking.specialInstructions && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">Special Instructions:</span>
                            <p className="text-gray-600 mt-1">{booking.specialInstructions}</p>
                          </div>
                        )}

                        {booking.adminNotes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-gray-900">Notes from Isabel:</span>
                            <p className="text-gray-600 mt-1">{booking.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col space-y-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && userProfile && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile & Pets</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{userProfile.firstName} {userProfile.lastName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{userProfile.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{userProfile.phone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="ml-2 text-gray-900">{userProfile.address}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Postcode:</span>
                    <span className="ml-2 text-gray-900">{userProfile.postcode}</span>
                  </div>
                </div>
              </div>

              {/* Pets Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Pets</h3>
                <div className="space-y-4">
                  {userProfile.pets?.map((pet, index) => (
                    <div key={pet.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{pet.name}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Breed:</span>
                          <span className="ml-1 text-gray-900">{pet.breed}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Age:</span>
                          <span className="ml-1 text-gray-900">{pet.age} years</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Weight:</span>
                          <span className="ml-1 text-gray-900">{pet.weight}kg</span>
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
                    <p className="text-gray-600">No pets added yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need to update your information?</h3>
              <p className="text-gray-600 mb-4">
                To update your profile or pet information, please contact us directly. We'll help you make any necessary changes.
              </p>
              <button
                onClick={() => window.location.href = 'mailto:isabel.sparkes@hotmail.com?subject=Profile Update Request'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}