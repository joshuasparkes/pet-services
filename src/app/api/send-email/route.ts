import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    let emailOptions;

    switch (type) {
      case 'booking_request':
        emailOptions = {
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: 'New Booking Request - Bournville Pet Services',
          html: `
            <h2>New Booking Request</h2>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Service:</strong> ${data.serviceType}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
            <p><strong>Price:</strong> £${data.price}</p>
            ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
            <p>Please log into the admin dashboard to approve or reject this booking.</p>
          `,
        };
        break;

      case 'booking_confirmed':
        emailOptions = {
          from: process.env.SMTP_USER,
          to: data.customerEmail,
          subject: 'Booking Confirmed - Bournville Pet Services',
          html: `
            <h2>Booking Confirmed!</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your booking has been confirmed!</p>
            <p><strong>Service:</strong> ${data.serviceType}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
            <p><strong>Price:</strong> £${data.price} (payment on completion)</p>
            <p>I look forward to taking care of your pet(s)!</p>
            <p>Best regards,<br>Isabel Sparkes<br>Bournville Pet Services</p>
            <p>Phone: 07590 566769<br>Email: isabel.sparkes@hotmail.com</p>
          `,
        };
        break;

      case 'booking_rejected':
        emailOptions = {
          from: process.env.SMTP_USER,
          to: data.customerEmail,
          subject: 'Booking Update - Bournville Pet Services',
          html: `
            <h2>Booking Update</h2>
            <p>Hi ${data.customerName},</p>
            <p>Unfortunately, I'm unable to confirm your booking for ${data.date} at ${data.startTime}.</p>
            <p>This may be due to scheduling conflicts or other commitments.</p>
            <p>Please feel free to choose an alternative date and time, or contact me directly to discuss other options.</p>
            <p>Best regards,<br>Isabel Sparkes<br>Bournville Pet Services</p>
            <p>Phone: 07590 566769<br>Email: isabel.sparkes@hotmail.com</p>
          `,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    await transporter.sendMail(emailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}