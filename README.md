# Bournville Pet Services

A modern Next.js web application for a pet care business, featuring a marketing website and booking management system.

## 🐾 Features

### Marketing Website
- **SEO-optimized homepage** with professional design
- **Service sections**: Dog walking, Pet sitting, Home visits
- **Contact modal** with Email, Phone, and WhatsApp integration
- **Testimonials** and service areas
- **Responsive design** optimized for all devices

### Booking System
- **User registration and authentication** with Firebase
- **Service booking** with calendar integration
- **Pet profile management**
- **Real-time booking status updates**
- **Email notifications** for customers and admin

### Admin Dashboard
- **Booking management** (approve, reject, complete)
- **Customer management**
- **Revenue tracking**
- **Activity logging**
- **Calendar view** of all bookings

## 🚀 Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Serverless functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Email**: Nodemailer
- **Icons**: FontAwesome
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pet-services
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config

4. **Environment Setup**
   - Copy `.env.local` and update with your Firebase credentials:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Email Configuration
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ADMIN_EMAIL=isabel.sparkes@hotmail.com
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Email Setup
1. Create a Gmail App Password for SMTP
2. Update `SMTP_USER` and `SMTP_PASS` in `.env.local`
3. Set `ADMIN_EMAIL` to receive booking notifications

### Firebase Collections Structure
The app uses the following Firestore collections:

- **users**: User profiles with pet information
- **bookings**: Booking requests and their status
- **activityLog**: System activity and booking changes

## 🌍 SEO & Domain Recommendations

Based on research, recommended domain names for SEO:
- `bournvillepetservices.co.uk` (primary recommendation)
- `bournvillepetcare.co.uk`
- `bournvilledogwalking.co.uk`

The application is optimized for local SEO with:
- Location-specific metadata
- Structured data for local business
- Mobile-optimized design
- Fast loading times

## 📱 Mobile Optimization

- Fully responsive design
- Touch-friendly interface
- Optimized forms for mobile input
- Fast loading on slow connections

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
Make sure to add all environment variables from `.env.local` to your production environment.

## 🎯 Key Features for Conversion

Based on research of successful pet service websites:

1. **Trust Signals**: DBS checked, fully insured badges
2. **Local Focus**: Bournville and surrounding areas emphasis
3. **Easy Contact**: Multiple contact methods (phone, email, WhatsApp)
4. **Social Proof**: Customer testimonials
5. **Clear Pricing**: Transparent service costs
6. **Professional Design**: Modern, clean interface

## 📊 Analytics & SEO

The application includes:
- Comprehensive meta tags for SEO
- Open Graph tags for social sharing
- Local business structured data
- Geographic metadata for local search

## 🛠️ Development

### Key Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── bookings/       # Booking system
│   └── page.tsx        # Homepage
├── lib/
│   └── firebase.ts     # Firebase configuration
└── types/
    └── booking.ts      # TypeScript interfaces
```

## 📧 Contact & Support

For questions about the application:
- Email: isabel.sparkes@hotmail.com
- Phone: 07590 566769

## 📄 License

This project is proprietary software for Bournville Pet Services.
