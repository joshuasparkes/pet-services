import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
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
          subject: '🐾 New Booking Request - Bournville Pet Services',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .info-row { margin: 10px 0; }
                .label { font-weight: bold; color: #667eea; display: inline-block; min-width: 120px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🐾 New Booking Request!</h1>
                </div>
                <div class="content">
                  <p>Hi Isabel,</p>
                  <p>You've received a new booking request. Here are the details:</p>

                  <div class="info-box">
                    <div class="info-row"><span class="label">Customer:</span> ${data.customerName}</div>
                    <div class="info-row"><span class="label">Email:</span> ${data.customerEmail}</div>
                    <div class="info-row"><span class="label">Service:</span> ${data.serviceType}</div>
                    <div class="info-row"><span class="label">Date:</span> ${data.date}</div>
                    <div class="info-row"><span class="label">Time:</span> ${data.startTime} - ${data.endTime}</div>
                    <div class="info-row"><span class="label">Price:</span> £${data.price}</div>
                    ${data.specialInstructions ? `<div class="info-row" style="margin-top: 15px;"><span class="label">Special Instructions:</span><br/><div style="margin-top: 5px; padding: 10px; background: white; border-radius: 5px;">${data.specialInstructions}</div></div>` : ''}
                  </div>

                  <p style="text-align: center; margin-top: 30px;">
                    <a href="https://bournvillepetcare.co.uk/admin" class="button">View in Admin Dashboard</a>
                  </p>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Please review this booking request and confirm or decline it through your admin dashboard.
                  </p>
                </div>
                <div class="footer">
                  <p>Bournville Pet Services<br/>
                  <a href="https://bournvillepetservices.co.uk" style="color: #667eea;">bournvillepetservices.co.uk</a></p>
                </div>
              </div>
            </body>
            </html>
          `,
        };
        console.log('📧 [EMAIL] Sending booking request notification to admin:', process.env.ADMIN_EMAIL);
        break;

      case 'booking_confirmed':
        emailOptions = {
          from: process.env.SMTP_USER,
          to: data.customerEmail,
          cc: process.env.ADMIN_EMAIL,
          subject: '✅ Booking Confirmed - Bournville Pet Services',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                .info-row { margin: 10px 0; }
                .label { font-weight: bold; color: #059669; display: inline-block; min-width: 100px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f9fafb; border-radius: 0 0 10px 10px; }
                .contact-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">✅ Your Booking is Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.customerName},</p>
                  <p>Great news! Your booking has been confirmed. I'm looking forward to taking care of your furry friend(s)! 🐾</p>

                  <div class="info-box">
                    <h3 style="margin-top: 0; color: #059669;">Booking Details</h3>
                    <div class="info-row"><span class="label">Service:</span> ${data.serviceType}</div>
                    <div class="info-row"><span class="label">Date:</span> ${data.date}</div>
                    <div class="info-row"><span class="label">Time:</span> ${data.startTime} - ${data.endTime}</div>
                    <div class="info-row"><span class="label">Price:</span> £${data.price}</div>
                    <div class="info-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1fae5;">
                      <span class="label">Payment:</span> Cash on completion
                    </div>
                  </div>

                  <div class="contact-box">
                    <h3 style="margin-top: 0; color: #1e40af;">Need to Make Changes?</h3>
                    <p style="margin: 10px 0;">If you need to reschedule or have any questions, feel free to reach out:</p>
                    <p style="margin: 5px 0;">📞 <strong>Phone:</strong> 07590 566769</p>
                    <p style="margin: 5px 0;">📧 <strong>Email:</strong> isabel.sparkes@hotmail.com</p>
                  </div>

                  <p style="margin-top: 25px;">I can't wait to meet your pet(s) and provide them with the best care possible!</p>

                  <p style="margin-top: 20px;">Warm regards,<br>
                  <strong>Isabel Sparkes</strong><br>
                  Bournville Pet Services</p>
                </div>
                <div class="footer">
                  <p>Bournville Pet Services<br/>
                  07590 566769 | isabel.sparkes@hotmail.com<br/>
                  <a href="https://bournvillepetservices.co.uk" style="color: #667eea;">bournvillepetservices.co.uk</a></p>
                </div>
              </div>
            </body>
            </html>
          `,
        };
        console.log('📧 [EMAIL] Sending booking confirmation to customer:', data.customerEmail, '(CC: admin)');
        break;

      case 'booking_rejected':
        emailOptions = {
          from: process.env.SMTP_USER,
          to: data.customerEmail,
          cc: process.env.ADMIN_EMAIL,
          subject: 'Booking Update - Bournville Pet Services',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .info-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .contact-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f9fafb; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Booking Update</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.customerName},</p>
                  <p>Thank you for your booking request. Unfortunately, I'm unable to accommodate your booking for <strong>${data.date}</strong> at <strong>${data.startTime}</strong>.</p>

                  <div class="info-box">
                    <p style="margin: 0;"><strong>Don't worry!</strong> This usually happens due to scheduling conflicts or prior commitments. I'd love to help you find an alternative time that works for both of us.</p>
                  </div>

                  <h3 style="color: #1e40af;">What's Next?</h3>
                  <p>You have a few options:</p>
                  <ul style="line-height: 2;">
                    <li>Choose a different date and time on our website</li>
                    <li>Contact me directly to discuss availability</li>
                    <li>I'll do my best to work around your schedule!</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://bournvillepetservices.co.uk/bookings" class="button">Book Another Time</a>
                  </div>

                  <div class="contact-box">
                    <h3 style="margin-top: 0; color: #1e40af;">Get in Touch</h3>
                    <p style="margin: 10px 0;">Feel free to reach out and we can find a time that works:</p>
                    <p style="margin: 5px 0;">📞 <strong>Phone:</strong> 07590 566769</p>
                    <p style="margin: 5px 0;">📧 <strong>Email:</strong> isabel.sparkes@hotmail.com</p>
                  </div>

                  <p style="margin-top: 25px;">I really appreciate your interest in Bournville Pet Services, and I hope we can arrange something soon!</p>

                  <p style="margin-top: 20px;">Best regards,<br>
                  <strong>Isabel Sparkes</strong><br>
                  Bournville Pet Services</p>
                </div>
                <div class="footer">
                  <p>Bournville Pet Services<br/>
                  07590 566769 | isabel.sparkes@hotmail.com<br/>
                  <a href="https://bournvillepetservices.co.uk" style="color: #667eea;">bournvillepetservices.co.uk</a></p>
                </div>
              </div>
            </body>
            </html>
          `,
        };
        console.log('📧 [EMAIL] Sending booking rejection to customer:', data.customerEmail, '(CC: admin)');
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    await transporter.sendMail(emailOptions);
    console.log('✅ [EMAIL] Email sent successfully!');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [EMAIL] Email sending failed:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}