"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaw,
  faHeart,
  faShieldAlt,
  faClock,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faStar,
  faCheckCircle,
  faDog,
  faHome,
  faCamera,
  faUsers,
  faTimes,
  faBars,
} from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const handleEmailContact = () => {
    window.location.href =
      "mailto:isabel.sparkes@hotmail.com?subject=Pet Services Inquiry";
  };

  const handlePhoneCall = () => {
    window.location.href = "tel:07590566769";
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/447590566769", "_blank");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-amber-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src="/doglogo.jpg"
                alt="Bournville Pet Care Logo"
                width={48}
                height={48}
                className="rounded-full object-cover w-12 h-12 sm:w-10 sm:h-10"
              />
              <span className="text-base sm:text-xl font-bold text-gray-900">
                Bournville Pet Care
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection("services")}
                className="text-gray-600 cursor-pointer hover:text-primary transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-600 cursor-pointer hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-600 cursor-pointer hover:text-primary transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("areas")}
                className="text-gray-600 cursor-pointer hover:text-primary transition-colors"
              >
                Areas
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-gray-600 cursor-pointer hover:text-primary transition-colors"
              >
                Reviews
              </button>
              {user ? (
                <a
                  href="/dashboard"
                  className="text-gray-600 cursor-pointer items-center mt-2 hover:text-primary transition-colors"
                >
                  My Dashboard
                </a>
              ) : (
                <a
                  href="/signin"
                  className="text-gray-600 cursor-pointer items-center mt-2 hover:text-primary transition-colors"
                >
                  Sign In
                </a>
              )}
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="bg-primary cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Contact
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 cursor-pointer hover:text-gray-900 p-2"
              >
                <FontAwesomeIcon
                  icon={isMobileMenuOpen ? faTimes : faBars}
                  className="text-xl"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => scrollToSection("services")}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("areas")}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              >
                Areas
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              >
                Reviews
              </button>
              {user ? (
                <a
                  href="/dashboard"
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                >
                  My Dashboard
                </a>
              ) : (
                <a
                  href="/signin"
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                >
                  Sign In
                </a>
              )}
              <button
                onClick={() => {
                  setIsContactModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional Pet Care in
              <span className="text-primary"> Bournville</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Trusted, caring pet services for your beloved companions. Dog
              walking, pet sitting, and home visits with the personal touch your
              pets deserve.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/bookings"
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg"
              >
                Book Pet Care Now
              </a>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="border-2 cursor-pointer border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                Ask a Question
              </button>
            </div>
            <div className="mt-8 flex justify-center items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  className="text-secondary"
                />
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-secondary"
                />
                <span>DBS Checked</span>
              </div>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                <span>Local & Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Pet Care Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive pet care services tailored to your pet&apos;s unique
              needs and your busy lifestyle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-primary-50 hover:bg-primary-100 transition-colors">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon icon={faDog} className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Dog Walking
              </h3>
              <p className="text-gray-600 mb-6">
                Group or solo walks tailored to your dog&apos;s needs.
                Choose between sociable group walks or one-on-one attention.
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Group walks: £13-£17</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Solo walks: £15-£22</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Photo updates</span>
                </li>
              </ul>
            </div>

            <div className="text-center p-8 rounded-2xl bg-secondary-50 hover:bg-secondary-100 transition-colors">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon
                  icon={faHome}
                  className="text-white text-2xl"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Day Care & Overnight
              </h3>
              <p className="text-gray-600 mb-6">
                Full day care or overnight stays in your home. Your pets stay
                comfortable while receiving personalized attention.
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Day care (8am-4pm): £40</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Overnight: £45-£50</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>In-home comfort</span>
                </li>
              </ul>
            </div>

            <div className="text-center p-8 rounded-2xl bg-purple-50 hover:bg-tertiary-100 transition-colors">
              <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon
                  icon={faCamera}
                  className="text-white text-2xl"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Drop-in Visits
              </h3>
              <p className="text-gray-600 mb-6">
                Quick check-ins for feeding, medication, and companionship.
                Perfect for pets who prefer to stay home.
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>15-minute visits: £10</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Feeding & medication</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-secondary text-sm"
                  />
                  <span>Play & attention</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees, no surprises. Just honest pricing for quality pet
              care services in Bournville.
            </p>
          </div>

          

          <div className="mt-12 text-center">
            <div className="bg-primary-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Information
              </h3>
              <div className="grid md:grid-cols-2 gap-8 text-center">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    💳 Payment Methods
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Cash on completion</li>
                    <li>• Bank transfer available</li>
                    <li>• Payment due after service</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    📋 What's Included
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Fully insured service</li>
                    <li>• DBS checked carer</li>
                    <li>• Photo/video updates</li>
                    <li>• Emergency contact available</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="/bookings"
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Book Your Service Today
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Meet Isabel - Your Local Pet Care Expert
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Hi! I&apos;m Isabel Sparkes, a passionate animal lover providing
                personalized pet care services in Bournville and surrounding
                areas. With years of experience caring for pets of all sizes and
                temperaments, I understand that every pet is unique and deserves
                individual attention.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                I believe in building trust with both pets and their owners
                through reliable, caring service. Your pet&apos;s happiness and
                wellbeing are my top priorities, and I treat every pet as if
                they were my own.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-2">
                    5+
                  </div>
                  <div className="text-gray-600">Years Experience</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-2">
                    100+
                  </div>
                  <div className="text-gray-600">Happy Pets</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-64 h-64 rounded-full mx-auto mb-6 overflow-hidden shadow-lg">
                <Image
                  src="https://images.pexels.com/photos/7288/animal-dog-pet-park.jpg"
                  alt="Isabel with a dog in the park - Professional pet care services"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <FontAwesomeIcon
                    icon={faShieldAlt}
                    className="text-secondary"
                  />
                  <span>Fully Insured & DBS Checked</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-primary"
                  />
                  <span>Local to Bournville</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section id="areas" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Service Areas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide pet care services throughout Bournville and the
              surrounding Birmingham areas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-primary-50">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="text-primary text-3xl mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Primary Areas
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>Bournville</li>
                <li>Selly Oak</li>
                <li>Kings Norton</li>
                <li>Cotteridge</li>
              </ul>
            </div>
            <div className="text-center p-6 rounded-lg bg-secondary-50">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="text-secondary text-3xl mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Extended Areas
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>Kings Heath</li>
                <li>Moseley</li>
                <li>Stirchley</li>
                <li>Selly Park</li>
              </ul>
            </div>
            <div className="text-center p-6 rounded-lg bg-purple-50">
              <FontAwesomeIcon
                icon={faClock}
                className="text-gray-900 text-3xl mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Service Hours
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>Monday - Friday: 7am - 7pm</li>
                <li>Saturday: 8am - 6pm</li>
                <li>Sunday: 9am - 5pm</li>
                <li>Emergency visits available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Pet Parents Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don&apos;t just take our word for it - hear from happy pet parents
              in Bournville.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className="text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                &quot;Isabel is absolutely wonderful with our Golden Retriever,
                Max. She sends photos during walks and always goes the extra
                mile. Highly recommend!&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">SJ</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Sarah Johnson
                  </div>
                  <div className="text-gray-700 text-sm">Bournville</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className="text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                &quot;Professional, reliable, and genuinely cares about the
                animals. Our cats love her visits when we&apos;re away. Peace of
                mind guaranteed.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-secondary font-bold">MT</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Mike Thompson
                  </div>
                  <div className="text-gray-700 text-sm">Selly Oak</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className="text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                &quot;Isabel saved us during a family emergency. She stepped in
                immediately and took excellent care of our rescue dog. Forever
                grateful!&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-900 font-bold">LW</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa Wilson</div>
                  <div className="text-gray-700 text-sm">Kings Norton</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Give Your Pet the Best Care?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto text-white">
            Book a meet & greet today and see why pet parents in Bournville
            trust us with their beloved companions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/bookings"
              className="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Book Now
            </a>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="border-2 cursor-pointer border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-primary transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/doglogo.jpg"
                  alt="Bournville Pet Care Logo"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <span className="text-xl font-bold">
                  Bournville Pet Care
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Professional, caring pet services in Bournville and surrounding
                areas. Your pet&apos;s happiness is our mission.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Group & Solo Walks</li>
                <li>Drop-in Visits</li>
                <li>Day Care</li>
                <li>Overnight Stays</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>07590 566769</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>isabel.sparkes@hotmail.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>Bournville, Birmingham</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-600">
            <p>
              &copy; <a href="/admin" className="hover:text-gray-400 transition-colors">2024</a> Bournville Pet Care. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute  cursor-pointer top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="text-white text-2xl"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get in Touch
              </h2>
              <p className="text-gray-600">
                Choose how you&apos;d like to contact us
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleEmailContact}
                className="w-full cursor-pointer flex items-center justify-center space-x-3 bg-primary text-white p-4 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <FontAwesomeIcon icon={faEnvelope} />
                <span>Send Email</span>
              </button>

              <button
                onClick={handlePhoneCall}
                className="w-full cursor-pointer flex items-center justify-center space-x-3 bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPhone} />
                <span>Call Now</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="w-full cursor-pointer flex items-center justify-center space-x-3 bg-blue-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                <FontAwesomeIcon icon={faPhone} />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-700">
              <p>Phone: 07590 566769</p>
              <p>Email: isabel.sparkes@hotmail.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
