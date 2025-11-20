"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaw,
  faCalendarAlt,
  faClock,
  faUser,
  faDog,
  faHome,
  faCamera,
  faArrowLeft,
  faArrowRight,
  faCheck,
  faSpinner,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, query, where, onSnapshot } from "firebase/firestore";
import type {
  User,
  Pet,
  BookingRequest,
  ServicePricing,
} from "@/types/booking";

const servicePricing: ServicePricing = {
  "meet-greet": {
    "30min": 0,
  },
  "group-walk": {
    "30min": 13,
    "60min": 17,
  },
  "solo-walk": {
    "30min": 15,
    "60min": 22,
  },
  "drop-in": {
    "15min": 10,
  },
  "day-care": {
    "8hrs": 40,
  },
  "overnight": {
    "standard": 45,
  },
};

export default function BookingsPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [existingBookings, setExistingBookings] = useState<BookingRequest[]>([]);
  const router = useRouter();

  // Form state
  const [serviceType, setServiceType] = useState<
    "meet-greet" | "group-walk" | "solo-walk" | "drop-in" | "day-care" | "overnight"
  >("meet-greet");
  const [duration, setDuration] = useState("30min");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // User data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  // Pet data
  const [pets, setPets] = useState<Pet[]>([
    {
      id: "1",
      name: "",
      breed: "",
      age: 1,
      weight: 10,
      specialNeeds: "",
      emergencyContact: "",
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // User is already logged in, fetch their data
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setEmail(userData.email);
            setFirstName(userData.firstName);
            setLastName(userData.lastName);
            setPhone(userData.phone);
            setAddress(userData.address);
            setPostcode(userData.postcode);
            if (userData.pets) {
              setPets(userData.pets);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen to all confirmed bookings to check availability
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("status", "in", ["confirmed", "pending"])
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BookingRequest[];

      setExistingBookings(bookingsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Clear selected time when date or duration changes (availability might change)
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate, duration]);

  // Auto-set duration for meet-greet service
  useEffect(() => {
    if (serviceType === "meet-greet") {
      setDuration("30min");
    }
  }, [serviceType]);

  const generateTimeSlots = (selectedDate: string) => {
    const slots = [];
    for (let hour = 7; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        
        // Check if this time slot is available
        if (isTimeSlotAvailable(selectedDate, time)) {
          slots.push(time);
        }
      }
    }
    return slots;
  };

  const isTimeSlotAvailable = (dateString: string, time: string) => {
    if (!dateString) return true;
    
    const selectedDate = new Date(dateString);
    
    // Check if any existing booking conflicts with this time slot
    const conflicts = existingBookings.filter(booking => {
      // Check if booking is on the same date
      const bookingDate = new Date(booking.date);
      const isSameDate = bookingDate.toDateString() === selectedDate.toDateString();
      
      if (!isSameDate) return false;
      
      // Calculate the proposed end time
      const proposedEndTime = calculateEndTime(time, duration);
      
      // Check for time overlap
      const bookingStartTime = booking.startTime;
      const bookingEndTime = booking.endTime;
      
      // Times overlap if: proposed start < booking end AND proposed end > booking start
      return time < bookingEndTime && proposedEndTime > bookingStartTime;
    });
    
    return conflicts.length === 0;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const addPet = () => {
    setPets([
      ...pets,
      {
        id: (pets.length + 1).toString(),
        name: "",
        breed: "",
        age: 1,
        weight: 10,
        specialNeeds: "",
        emergencyContact: "",
      },
    ]);
  };

  const updatePet = (index: number, field: keyof Pet, value: any) => {
    const updatedPets = [...pets];
    updatedPets[index] = { ...updatedPets[index], [field]: value };
    setPets(updatedPets);
  };

  const removePet = (index: number) => {
    if (pets.length > 1) {
      setPets(pets.filter((_, i) => i !== index));
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (isRegistering) {
        // Validate all required fields for registration
        if (!firstName.trim()) {
          alert("Please enter your first name");
          setIsLoading(false);
          return;
        }
        if (!lastName.trim()) {
          alert("Please enter your last name");
          setIsLoading(false);
          return;
        }
        if (!phone.trim()) {
          alert("Please enter your phone number");
          setIsLoading(false);
          return;
        }
        if (!address.trim()) {
          alert("Please enter your address");
          setIsLoading(false);
          return;
        }
        if (!postcode.trim()) {
          alert("Please enter your postcode");
          setIsLoading(false);
          return;
        }
        
        // Validate pet information
        for (let i = 0; i < pets.length; i++) {
          const pet = pets[i];
          if (!pet.name.trim()) {
            alert(`Please enter a name for Pet ${i + 1}`);
            setIsLoading(false);
            return;
          }
          if (!pet.breed.trim()) {
            alert(`Please enter the breed for Pet ${i + 1}`);
            setIsLoading(false);
            return;
          }
          if (!pet.age || pet.age <= 0) {
            alert(`Please enter a valid age for Pet ${i + 1}`);
            setIsLoading(false);
            return;
          }
          if (!pet.weight || pet.weight <= 0) {
            alert(`Please enter a valid weight for Pet ${i + 1}`);
            setIsLoading(false);
            return;
          }
          // For meet & greet bookings, require medical and behavioral information
          if (serviceType === "meet-greet" && !pet.specialNeeds?.trim()) {
            alert(`Please provide medical and behavioral information for Pet ${i + 1}`);
            setIsLoading(false);
            return;
          }
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userData: Omit<User, "id"> = {
          email,
          firstName,
          lastName,
          phone,
          address,
          postcode,
          pets,
          createdAt: new Date(),
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setStep(3);
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitBooking = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const bookingData: Omit<BookingRequest, "id"> = {
        userId: user.uid,
        petIds: pets.map((p) => p.id),
        serviceType,
        date: new Date(selectedDate),
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, duration),
        duration: getDurationMinutes(duration),
        specialInstructions,
        status: "pending",
        price: calculatePrice(),
        paymentMethod: "cash",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "bookings"), bookingData);

      // Send email notification to admin
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'booking_request',
            data: {
              customerName: `${firstName} ${lastName}`,
              customerEmail: email,
              serviceType: serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              date: new Date(selectedDate).toLocaleDateString('en-GB'),
              startTime: selectedTime,
              endTime: calculateEndTime(selectedTime, duration),
              price: calculatePrice(),
              specialInstructions,
            },
          }),
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't block the booking if email fails
      }

      setStep(4);
    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const durationMinutes = getDurationMinutes(duration);
    const endMinutes = minutes + durationMinutes;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${finalMinutes.toString().padStart(2, "0")}`;
  };

  const getDurationMinutes = (duration: string) => {
    const durationMap: { [key: string]: number } = {
      "15min": 15,
      "30min": 30,
      "60min": 60,
      "8hrs": 480,
      "standard": 720,
    };
    return durationMap[duration] || 30;
  };

  const calculatePrice = () => {
    if (serviceType === "meet-greet") {
      return servicePricing["meet-greet"]["30min"];
    } else if (serviceType === "group-walk") {
      return servicePricing["group-walk"][duration as "30min" | "60min"];
    } else if (serviceType === "solo-walk") {
      return servicePricing["solo-walk"][duration as "30min" | "60min"];
    } else if (serviceType === "drop-in") {
      return servicePricing["drop-in"]["15min"];
    } else if (serviceType === "day-care") {
      return servicePricing["day-care"]["8hrs"];
    } else if (serviceType === "overnight") {
      return servicePricing["overnight"]["standard"];
    }
    return 0;
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "meet-greet":
        return faHandshake;
      case "group-walk":
        return faUser;
      case "solo-walk":
        return faDog;
      case "drop-in":
        return faCamera;
      case "day-care":
        return faHome;
      case "overnight":
        return faClock;
      default:
        return faPaw;
    }
  };

  return (
    <div className="min-h-screen text-gray-700 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faPaw} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Book Pet Care
                </h1>
                <p className="text-gray-600">Bournville Pet Care</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 cursor-pointer hover:text-gray-900 cursor-pointer"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-0 py-8">
        <div className="flex items-center justify-center mb-8 mx-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > stepNumber ? (
                  <FontAwesomeIcon icon={faCheck} />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`h-1 w-16 mx-2 ${
                    step > stepNumber ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Choose Your Services
              </h2>

              {/* First Time Booking Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FontAwesomeIcon icon={faHandshake} className="text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">First Time Booking?</h3>
                    <p className="text-sm text-gray-700">
                      If this is your first time booking with us, please select the <span className="font-semibold">Meet & Greet</span> service.
                      This complimentary 30-minute session helps us get to know you and your pet(s) to ensure the best care possible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    type: "meet-greet",
                    title: "Meet & Greet",
                    desc: "Complimentary first meeting (for new customers)",
                  },
                  {
                    type: "group-walk",
                    title: "Group Walk",
                    desc: "Sociable walks with other dogs",
                  },
                  {
                    type: "solo-walk",
                    title: "Solo Walk",
                    desc: "One-on-one attention for your dog",
                  },
                  {
                    type: "drop-in",
                    title: "Drop-in Visit",
                    desc: "Quick 15-minute check-in",
                  },
                  {
                    type: "day-care",
                    title: "Day Care",
                    desc: "8am-4pm full day care",
                  },
                  {
                    type: "overnight",
                    title: "Overnight Stay",
                    desc: "Overnight care in your home",
                  },
                ].map((service) => (
                  <button
                    key={service.type}
                    onClick={() => setServiceType(service.type as any)}
                    className={`p-6 cursor-pointer rounded-xl border-2 text-left transition-all ${
                      serviceType === service.type
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <FontAwesomeIcon
                        icon={getServiceIcon(service.type)}
                        className={`text-2xl ${serviceType === service.type ? "text-primary" : "text-gray-400"}`}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{service.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Duration & Pricing
                </h3>
                <div className="grid cursor-pointer text-black md:grid-cols-2 gap-4">
                  {serviceType === "meet-greet" && (
                    <div className="p-4 rounded-lg border-2 border-primary bg-blue-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">30 minutes</span>
                        <span className="text-primary font-bold">FREE</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Complimentary meet and greet session
                      </p>
                    </div>
                  )}

                  {serviceType === "group-walk" &&
                    Object.entries(servicePricing["group-walk"]).map(
                      ([dur, price]) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`p-4 cursor-pointer rounded-lg border-2 text-left ${
                            duration === dur
                              ? "border-primary bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {dur === "30min" ? "30 minutes" : "1 hour"}
                            </span>
                            <span className="text-primary font-bold">
                              £{price}
                            </span>
                          </div>
                        </button>
                      ),
                    )}

                  {serviceType === "solo-walk" &&
                    Object.entries(servicePricing["solo-walk"]).map(
                      ([dur, price]) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`p-4 cursor-pointer rounded-lg border-2 text-left ${
                            duration === dur
                              ? "border-primary bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {dur === "30min" ? "30 minutes" : "1 hour"}
                            </span>
                            <span className="text-primary font-bold">
                              £{price}
                            </span>
                          </div>
                        </button>
                      ),
                    )}

                  {serviceType === "drop-in" &&
                    Object.entries(servicePricing["drop-in"]).map(
                      ([dur, price]) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`p-4 cursor-pointer rounded-lg border-2 text-left ${
                            duration === dur
                              ? "border-primary bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">15 minutes</span>
                            <span className="text-primary font-bold">
                              £{price}
                            </span>
                          </div>
                        </button>
                      ),
                    )}

                  {serviceType === "day-care" &&
                    Object.entries(servicePricing["day-care"]).map(
                      ([dur, price]) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`p-4 cursor-pointer rounded-lg border-2 text-left ${
                            duration === dur
                              ? "border-primary bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">8am-4pm (8 hours)</span>
                            <span className="text-primary font-bold">
                              £{price}
                            </span>
                          </div>
                        </button>
                      ),
                    )}

                  {serviceType === "overnight" &&
                    Object.entries(servicePricing["overnight"]).map(
                      ([dur, price]) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`p-4 cursor-pointer rounded-lg border-2 text-left ${
                            duration === dur
                              ? "border-primary bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Overnight Stay</span>
                            <span className="text-primary font-bold">
                              £{price}-£50
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Final price depends on dog's needs</p>
                        </button>
                      ),
                    )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(user ? 3 : 2)}
                  className="bg-primary cursor-pointer text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Continue
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Account & Pet Information
              </h2>

              {/* Auth Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsRegistering(false)}
                  className={`flex-1 cursor-pointer py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isRegistering
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  I have an account
                </button>
                <button
                  onClick={() => setIsRegistering(true)}
                  className={`flex-1 cursor-pointer py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isRegistering
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  New customer
                </button>
              </div>

              {/* Auth Form */}
              <div className="grid text-black md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              {isRegistering && (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  {/* Pet Information */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pet Information
                      </h3>
                      <button
                        onClick={addPet}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                      >
                        + Add Another Pet
                      </button>
                    </div>

                    {pets.map((pet, index) => (
                      <div
                        key={pet.id}
                        className="border border-gray-200 rounded-lg p-6 mb-4"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">
                            Pet {index + 1}
                          </h4>
                          {pets.length > 1 && (
                            <button
                              onClick={() => removePet(index)}
                              className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pet Name
                            </label>
                            <input
                              type="text"
                              value={pet.name}
                              onChange={(e) =>
                                updatePet(index, "name", e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Breed
                            </label>
                            <input
                              type="text"
                              value={pet.breed}
                              onChange={(e) =>
                                updatePet(index, "breed", e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Age (years)
                            </label>
                            <input
                              type="number"
                              value={pet.age}
                              onChange={(e) =>
                                updatePet(
                                  index,
                                  "age",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              min="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Weight (kg)
                            </label>
                            <input
                              type="number"
                              value={pet.weight}
                              onChange={(e) =>
                                updatePet(
                                  index,
                                  "weight",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              min="0"
                              step="0.1"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medical & Behavioral Information
                            {serviceType === "meet-greet" && (
                              <span className="text-red-600 ml-1">*</span>
                            )}
                          </label>
                          <textarea
                            value={pet.specialNeeds}
                            onChange={(e) =>
                              updatePet(index, "specialNeeds", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            rows={4}
                            placeholder="Please provide details about any medical conditions, medications, allergies, behavioral traits, anxiety issues, or special instructions..."
                            required={serviceType === "meet-greet"}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Include any medical issues, behavioral concerns, or special needs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back
                </button>
                <button
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="bg-primary cursor-pointer text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin mr-2"
                    />
                  ) : null}
                  {isRegistering
                    ? "Create Account & Continue"
                    : "Sign In & Continue"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Choose Date & Time
              </h2>

              <div className="grid text-black md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Dates
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {generateDateOptions().map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 cursor-pointer rounded-lg border-2 text-sm text-black ${
                          selectedDate === date
                            ? "border-primary bg-blue-50 text-primary"
                            : "border-gray-200  hover:border-gray-300"
                        }`}
                      >
                        {new Date(date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {generateTimeSlots(selectedDate).map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 cursor-pointer rounded text-sm ${
                          selectedTime === time
                            ? "bg-primary text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                    {selectedDate && generateTimeSlots(selectedDate).length === 0 && (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        No available time slots for this date. Please select a different date.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={4}
                  placeholder="Any special instructions for your booking..."
                />
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 text-black rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium capitalize">
                      {serviceType.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">
                      {selectedDate
                        ? new Date(selectedDate).toLocaleDateString("en-GB")
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">
                      {selectedTime || "Not selected"}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">£{calculatePrice()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Payment on completion (cash)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(user ? 1 : 2)}
                  className="text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back
                </button>
                <button
                  onClick={submitBooking}
                  disabled={!selectedDate || !selectedTime || isLoading}
                  className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin mr-2"
                    />
                  ) : null}
                  Submit Booking Request
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-green-600 text-3xl"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Booking Request Submitted!
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Thank you for your booking request. Isabel will review your
                request and get back to you within 24 hours to confirm your
                appointment.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  What happens next?
                </h3>
                <div className="text-left space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <span>Isabel will review your booking request</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <span>
                      You'll receive a confirmation email within 24 hours
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <span>Payment will be collected on completion (cash)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary cursor-pointer text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Go to My Dashboard
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="border border-primary text-primary px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedDate("");
                    setSelectedTime("");
                    setSpecialInstructions("");
                  }}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Book Another Service
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
