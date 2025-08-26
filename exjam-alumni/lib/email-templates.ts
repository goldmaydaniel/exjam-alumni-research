// Professional Email Templates for ExJAM Alumni Events
// All templates use modern, responsive design with dynamic branding

import { SiteConfigManager } from "@/lib/supabase/storage";

export interface EventDetails {
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  description?: string;
  imageUrl?: string;
}

export interface RegistrationDetails {
  name: string;
  email: string;
  ticketNumber: string;
  ticketType: string;
  qrCodeUrl?: string;
  eventDetails: EventDetails;
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  reference: string;
  paymentMethod: string;
  date: string;
}

// Default brand colors and styling (fallbacks)
const defaultBrandStyles = {
  primaryColor: "#6366f1", // Indigo
  secondaryColor: "#8b5cf6", // Purple
  successColor: "#10b981", // Green
  warningColor: "#f59e0b", // Amber
  backgroundColor: "#f9fafb",
  textColor: "#111827",
  mutedColor: "#6b7280",
};

// Get dynamic brand styles from site configuration
const getBrandStyles = async () => {
  try {
    const siteConfig = await SiteConfigManager.getSiteConfig();
    return {
      primaryColor: siteConfig.primaryColor || defaultBrandStyles.primaryColor,
      secondaryColor: siteConfig.secondaryColor || defaultBrandStyles.secondaryColor,
      successColor: defaultBrandStyles.successColor,
      warningColor: defaultBrandStyles.warningColor,
      backgroundColor: defaultBrandStyles.backgroundColor,
      textColor: defaultBrandStyles.textColor,
      mutedColor: defaultBrandStyles.mutedColor,
      siteName: siteConfig.siteName || "ExJAM Alumni",
      mainLogo: siteConfig.mainLogoUrl || "/exjam-logo.svg",
      contactEmail: siteConfig.contactEmail || "contact@exjamalumni.org",
      socialLinks: siteConfig.socialLinks || {},
    };
  } catch (error) {
    console.error("Failed to load site config for emails:", error);
    return {
      ...defaultBrandStyles,
      siteName: "ExJAM Alumni",
      mainLogo: "/exjam-logo.svg",
      contactEmail: "contact@exjamalumni.org",
      socialLinks: {},
    };
  }
};

// Base email template wrapper
const emailWrapper = (content: string, preheader: string = "", brandStyles: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ExJAM Alumni</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${brandStyles.backgroundColor}; color: ${brandStyles.textColor};">
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${brandStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Email header with dynamic logo and branding
const emailHeader = (title: string, brandStyles: any) => `
<tr>
  <td style="background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); padding: 48px 40px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="margin-bottom: 16px;">
      <img src="${brandStyles.mainLogo}" alt="${brandStyles.siteName} Logo" style="height: 48px; width: auto; max-width: 200px; object-fit: contain;">
    </div>
    <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${brandStyles.siteName}</h1>
    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">${title}</p>
  </td>
</tr>
`;

// Email footer with dynamic social links and contact info
const emailFooter = (brandStyles: any) => `
<tr>
  <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              ${brandStyles.socialLinks?.facebook ? `<td style="padding: 0 8px;"><a href="${brandStyles.socialLinks.facebook}" style="color: ${brandStyles.mutedColor}; text-decoration: none;">Facebook</a></td>` : ""}
              ${brandStyles.socialLinks?.twitter ? `<td style="padding: 0 8px;"><a href="${brandStyles.socialLinks.twitter}" style="color: ${brandStyles.mutedColor}; text-decoration: none;">Twitter</a></td>` : ""}
              ${brandStyles.socialLinks?.linkedin ? `<td style="padding: 0 8px;"><a href="${brandStyles.socialLinks.linkedin}" style="color: ${brandStyles.mutedColor}; text-decoration: none;">LinkedIn</a></td>` : ""}
              ${brandStyles.socialLinks?.instagram ? `<td style="padding: 0 8px;"><a href="${brandStyles.socialLinks.instagram}" style="color: ${brandStyles.mutedColor}; text-decoration: none;">Instagram</a></td>` : ""}
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin: 0; color: ${brandStyles.mutedColor}; font-size: 14px; line-height: 20px;">
            © 2025 ${brandStyles.siteName}. All rights reserved.<br>
            Jos, Plateau State | ${brandStyles.contactEmail}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

// 1. Welcome Email Template
export const getWelcomeEmailTemplate = async (name: string): Promise<string> => {
  const brandStyles = await getBrandStyles();
  const content = `
    ${emailHeader(`Welcome to the ${brandStyles.siteName} Family!`, brandStyles)}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600;">Dear ${name},</h2>
        
        <p style="margin: 0 0 20px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px;">
          Welcome to ${brandStyles.siteName}! We're thrilled to have you join our vibrant community of accomplished professionals and changemakers.
        </p>

        <div style="background: linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%); padding: 24px; border-radius: 8px; margin: 32px 0;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.primaryColor}; font-size: 18px; font-weight: 600;">Your Alumni Benefits:</h3>
          <ul style="margin: 0; padding-left: 20px; color: ${brandStyles.textColor};">
            <li style="margin-bottom: 12px;">Exclusive access to alumni events and reunions</li>
            <li style="margin-bottom: 12px;">Professional networking opportunities</li>
            <li style="margin-bottom: 12px;">Career development resources</li>
            <li style="margin-bottom: 12px;">Mentorship programs</li>
            <li style="margin-bottom: 12px;">Special discounts and privileges</li>
          </ul>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid ${brandStyles.successColor}; padding: 20px; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 500;">
            🎉 Special Announcement: Annual Alumni Conference 2025
          </p>
          <p style="margin: 8px 0 0; color: #047857; font-size: 14px;">
            Join us for our flagship event on March 15, 2025. Early bird registration is now open!
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/events" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore Upcoming Events</a>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; line-height: 20px;">
          Stay connected with us through our social media channels and newsletter for the latest updates, opportunities, and alumni success stories.
        </p>
      </td>
    </tr>
    ${emailFooter(brandStyles)}
  `;

  return emailWrapper(
    content,
    `Welcome to ${brandStyles.siteName} - Your journey continues with us!`,
    brandStyles
  );
};

// 2. Registration Confirmation Email Template
export const getRegistrationConfirmationTemplate = (details: RegistrationDetails): string => {
  const content = `
    ${emailHeader("Registration Confirmed!")}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #f0fdf4; border-radius: 50%; padding: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4" stroke="${brandStyles.successColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="${brandStyles.successColor}" stroke-width="2"/>
            </svg>
          </div>
        </div>

        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600; text-align: center;">You're All Set, ${details.name}!</h2>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px; text-align: center;">
          Your registration for the event has been confirmed. We can't wait to see you there!
        </p>

        <!-- Event Details Card -->
        <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 32px 0;">
          ${
            details.eventDetails.imageUrl
              ? `
          <div style="height: 200px; background: url('${details.eventDetails.imageUrl}') center/cover; background-color: #f3f4f6;"></div>
          `
              : ""
          }
          <div style="padding: 24px;">
            <h3 style="margin: 0 0 16px; color: ${brandStyles.primaryColor}; font-size: 20px; font-weight: 600;">${details.eventDetails.title}</h3>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
              <tr>
                <td style="padding: 8px 0;">
                  <strong style="color: ${brandStyles.textColor};">📅 Date:</strong>
                  <span style="color: ${brandStyles.mutedColor}; margin-left: 8px;">${details.eventDetails.date}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <strong style="color: ${brandStyles.textColor};">🕐 Time:</strong>
                  <span style="color: ${brandStyles.mutedColor}; margin-left: 8px;">${details.eventDetails.time}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <strong style="color: ${brandStyles.textColor};">📍 Venue:</strong>
                  <span style="color: ${brandStyles.mutedColor}; margin-left: 8px;">${details.eventDetails.venue}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <strong style="color: ${brandStyles.textColor};">🎫 Ticket Type:</strong>
                  <span style="color: ${brandStyles.mutedColor}; margin-left: 8px;">${details.ticketType}</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Ticket QR Code -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
          <h4 style="margin: 0 0 16px; color: #92400e; font-size: 18px; font-weight: 600;">Your Ticket</h4>
          <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
            ${
              details.qrCodeUrl
                ? `<img src="${details.qrCodeUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;">`
                : `<div style="width: 200px; height: 200px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; border: 2px dashed #d1d5db; border-radius: 8px;">
                <span style="color: #9ca3af; font-size: 14px;">QR Code</span>
              </div>`
            }
            <p style="margin: 16px 0 0; color: #92400e; font-size: 20px; font-weight: 700; font-family: monospace;">${details.ticketNumber}</p>
          </div>
          <p style="margin: 16px 0 0; color: #92400e; font-size: 14px;">Present this QR code at the venue for quick check-in</p>
        </div>

        <!-- Important Information -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h4 style="margin: 0 0 12px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">Important Information:</h4>
          <ul style="margin: 0; padding-left: 20px; color: ${brandStyles.mutedColor}; font-size: 14px; line-height: 20px;">
            <li style="margin-bottom: 8px;">Please arrive 30 minutes before the event starts</li>
            <li style="margin-bottom: 8px;">Bring a valid ID for verification</li>
            <li style="margin-bottom: 8px;">Dress code: Business Casual</li>
            <li style="margin-bottom: 8px;">Parking is available at the venue</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View My Registrations</a>
        </div>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(
    content,
    `Registration confirmed for ${details.eventDetails.title} - Ticket #${details.ticketNumber}`
  );
};

// 3. Payment Confirmation Email Template
export const getPaymentConfirmationTemplate = (
  details: RegistrationDetails & { payment: PaymentDetails }
): string => {
  const content = `
    ${emailHeader("Payment Received")}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #f0fdf4; border-radius: 50%; padding: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="${brandStyles.successColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600; text-align: center;">Payment Successful!</h2>
        
        <!-- Receipt Details -->
        <div style="background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
            <h3 style="margin: 0; color: ${brandStyles.textColor}; font-size: 18px; font-weight: 600;">Payment Receipt</h3>
            <p style="margin: 4px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px;">Reference: ${details.payment.reference}</p>
          </div>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Event:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.mutedColor};">${details.eventDetails.title}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Ticket Type:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.mutedColor};">${details.ticketType}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Payment Method:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.mutedColor};">${details.payment.paymentMethod}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Date:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.mutedColor};">${details.payment.date}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 0 0;">
                <strong style="color: ${brandStyles.textColor}; font-size: 18px;">Total Amount:</strong>
              </td>
              <td style="padding: 16px 0 0; text-align: right;">
                <span style="color: ${brandStyles.primaryColor}; font-size: 24px; font-weight: 700;">${details.payment.currency}${details.payment.amount.toLocaleString()}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Status Badge -->
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background-color: #f0fdf4; color: ${brandStyles.successColor}; padding: 8px 16px; border-radius: 100px; font-size: 14px; font-weight: 600;">
            ✓ Payment Verified
          </span>
        </div>

        <!-- Next Steps -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h4 style="margin: 0 0 12px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">What's Next?</h4>
          <ol style="margin: 0; padding-left: 20px; color: ${brandStyles.mutedColor}; font-size: 14px; line-height: 20px;">
            <li style="margin-bottom: 8px;">Your ticket has been generated and sent to your email</li>
            <li style="margin-bottom: 8px;">Save your ticket QR code for quick check-in</li>
            <li style="margin-bottom: 8px;">You'll receive a reminder 24 hours before the event</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 12px;">Download Receipt</a>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 12px; text-align: center;">
          This receipt is for your records. For any queries, contact us at payments@exjamalumni.org
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(
    content,
    `Payment confirmed - ${details.payment.currency}${details.payment.amount} for ${details.eventDetails.title}`
  );
};

// 4. Event Reminder Email Template
export const getEventReminderTemplate = (
  details: RegistrationDetails,
  hoursUntil: number
): string => {
  const reminderType = hoursUntil <= 24 ? "Tomorrow!" : `in ${Math.floor(hoursUntil / 24)} days`;

  const content = `
    ${emailHeader(`Event Reminder: ${reminderType}`)}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #fef3c7; border-radius: 50%; padding: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6v6l4 2" stroke="${brandStyles.warningColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="${brandStyles.warningColor}" stroke-width="2"/>
            </svg>
          </div>
        </div>

        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600; text-align: center;">
          Hi ${details.name}, Don't Forget!
        </h2>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
          <h3 style="margin: 0 0 8px; color: #92400e; font-size: 20px; font-weight: 600;">
            ${details.eventDetails.title}
          </h3>
          <p style="margin: 0; color: #92400e; font-size: 18px;">
            is ${reminderType}
          </p>
        </div>

        <!-- Event Quick Info -->
        <div style="background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 12px 0;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 24px; margin-right: 12px;">📅</span>
                  <div>
                    <strong style="color: ${brandStyles.textColor}; display: block;">${details.eventDetails.date}</strong>
                    <span style="color: ${brandStyles.mutedColor}; font-size: 14px;">${details.eventDetails.time}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 24px; margin-right: 12px;">📍</span>
                  <div>
                    <strong style="color: ${brandStyles.textColor}; display: block;">${details.eventDetails.venue}</strong>
                    <span style="color: ${brandStyles.mutedColor}; font-size: 14px;">${details.eventDetails.address}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 24px; margin-right: 12px;">🎫</span>
                  <div>
                    <strong style="color: ${brandStyles.textColor}; display: block;">Ticket #${details.ticketNumber}</strong>
                    <span style="color: ${brandStyles.mutedColor}; font-size: 14px;">${details.ticketType}</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Checklist -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h4 style="margin: 0 0 12px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">Pre-Event Checklist:</h4>
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            <li style="margin-bottom: 8px; color: ${brandStyles.mutedColor}; font-size: 14px;">
              ☐ Save your ticket QR code to your phone
            </li>
            <li style="margin-bottom: 8px; color: ${brandStyles.mutedColor}; font-size: 14px;">
              ☐ Plan your route to the venue
            </li>
            <li style="margin-bottom: 8px; color: ${brandStyles.mutedColor}; font-size: 14px;">
              ☐ Check the weather forecast
            </li>
            <li style="margin-bottom: 8px; color: ${brandStyles.mutedColor}; font-size: 14px;">
              ☐ Prepare business cards for networking
            </li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View My Ticket</a>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
          We're looking forward to seeing you at the event!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(content, `Reminder: ${details.eventDetails.title} is ${reminderType}`);
};

// 5. Check-in Confirmation Email Template
export const getCheckinConfirmationTemplate = (details: RegistrationDetails): string => {
  const content = `
    ${emailHeader("Successfully Checked In!")}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #f0fdf4; border-radius: 50%; padding: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L9 18l-5-5" stroke="${brandStyles.successColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600; text-align: center;">
          Welcome, ${details.name}!
        </h2>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px; text-align: center;">
          You've been successfully checked in to ${details.eventDetails.title}
        </p>

        <div style="background: linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%); padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
          <p style="margin: 0; color: ${brandStyles.primaryColor}; font-size: 18px; font-weight: 600;">
            Check-in Time: ${new Date().toLocaleTimeString()}
          </p>
        </div>

        <!-- Event Schedule Highlights -->
        <div style="background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.textColor}; font-size: 18px; font-weight: 600;">Today's Highlights</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.mutedColor};">9:00 AM</strong>
              </td>
              <td style="padding: 8px 0 8px 16px; border-bottom: 1px solid #f3f4f6;">
                Registration & Breakfast
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.mutedColor};">10:00 AM</strong>
              </td>
              <td style="padding: 8px 0 8px 16px; border-bottom: 1px solid #f3f4f6;">
                Opening Keynote
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.mutedColor};">12:00 PM</strong>
              </td>
              <td style="padding: 8px 0 8px 16px; border-bottom: 1px solid #f3f4f6;">
                Networking Lunch
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: ${brandStyles.mutedColor};">2:00 PM</strong>
              </td>
              <td style="padding: 8px 0 8px 16px;">
                Panel Discussions
              </td>
            </tr>
          </table>
        </div>

        <!-- WiFi and Venue Info -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h4 style="margin: 0 0 12px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">Venue Information:</h4>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">WiFi Network:</strong>
                <span style="color: ${brandStyles.textColor}; margin-left: 8px; font-family: monospace;">ExJAM_Guest</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">WiFi Password:</strong>
                <span style="color: ${brandStyles.textColor}; margin-left: 8px; font-family: monospace;">Alumni2025</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">Event Hashtag:</strong>
                <span style="color: ${brandStyles.primaryColor}; margin-left: 8px;">#ExJAMAlumni2025</span>
              </td>
            </tr>
          </table>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
          Enjoy the event! Our team is here to help if you need anything.
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(content, `Checked in to ${details.eventDetails.title}`);
};

// 6. Bank Transfer Instructions Email Template
export const getBankTransferInstructionsTemplate = (
  details: RegistrationDetails & { payment: PaymentDetails }
): string => {
  const content = `
    ${emailHeader("Complete Your Payment")}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600;">
          Hi ${details.name}, Almost There!
        </h2>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px;">
          To complete your registration for ${details.eventDetails.title}, please make a bank transfer using the details below:
        </p>

        <!-- Amount Due -->
        <div style="background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
          <p style="margin: 0; color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount to Pay</p>
          <p style="margin: 8px 0 0; color: white; font-size: 36px; font-weight: 700;">
            ${details.payment.currency}${details.payment.amount.toLocaleString()}
          </p>
        </div>

        <!-- Bank Details -->
        <div style="background-color: white; border: 2px solid ${brandStyles.primaryColor}; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.primaryColor}; font-size: 18px; font-weight: 600;">Bank Transfer Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Bank Name:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.textColor}; font-weight: 600;">First Bank of Nigeria</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Account Name:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.textColor}; font-weight: 600;">ExJAM Alumni Association</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: ${brandStyles.textColor};">Account Number:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                <span style="color: ${brandStyles.textColor}; font-weight: 600; font-size: 18px; font-family: monospace;">3123456789</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <strong style="color: ${brandStyles.textColor};">Reference:</strong>
              </td>
              <td style="padding: 12px 0; text-align: right;">
                <span style="color: ${brandStyles.primaryColor}; font-weight: 600; font-family: monospace;">${details.payment.reference}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Important Notice -->
        <div style="background-color: #fef3c7; border-left: 4px solid ${brandStyles.warningColor}; padding: 20px; border-radius: 4px; margin: 24px 0;">
          <h4 style="margin: 0 0 8px; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Important</h4>
          <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 20px;">
            <li style="margin-bottom: 4px;">Use the exact reference number: <strong>${details.payment.reference}</strong></li>
            <li style="margin-bottom: 4px;">Your registration will be confirmed within 24 hours of payment</li>
            <li style="margin-bottom: 4px;">Send payment confirmation to: payments@exjamalumni.org</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/payment/confirm" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">I've Made the Payment</a>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
          Questions? Contact us at payments@exjamalumni.org or call +234 801 234 5678
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(
    content,
    `Payment instructions for ${details.eventDetails.title} - ${details.payment.currency}${details.payment.amount}`
  );
};

// 7. Event Cancellation Email Template
export const getEventCancellationTemplate = (details: RegistrationDetails): string => {
  const content = `
    ${emailHeader("Event Update")}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600;">
          Important Update: Event Cancellation
        </h2>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px;">
          Dear ${details.name},
        </p>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px;">
          We regret to inform you that <strong>${details.eventDetails.title}</strong> scheduled for ${details.eventDetails.date} has been cancelled.
        </p>

        <!-- Refund Information -->
        <div style="background-color: #f0fdf4; border: 2px solid ${brandStyles.successColor}; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="margin: 0 0 12px; color: #065f46; font-size: 18px; font-weight: 600;">Full Refund Guaranteed</h3>
          <p style="margin: 0; color: #047857; font-size: 14px; line-height: 20px;">
            Your payment will be fully refunded within 5-7 business days to your original payment method.
          </p>
        </div>

        <!-- Cancelled Event Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h4 style="margin: 0 0 12px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">Cancelled Event Details:</h4>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">Event:</strong>
                <span style="color: ${brandStyles.textColor}; margin-left: 8px;">${details.eventDetails.title}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">Ticket Number:</strong>
                <span style="color: ${brandStyles.textColor}; margin-left: 8px; font-family: monospace;">${details.ticketNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <strong style="color: ${brandStyles.mutedColor}; font-size: 14px;">Original Date:</strong>
                <span style="color: ${brandStyles.textColor}; margin-left: 8px;">${details.eventDetails.date}</span>
              </td>
            </tr>
          </table>
        </div>

        <p style="margin: 24px 0; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px;">
          We sincerely apologize for any inconvenience this may cause. We're working on rescheduling this event and will notify you as soon as new dates are confirmed.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/events" style="display: inline-block; background: linear-gradient(135deg, ${brandStyles.primaryColor} 0%, ${brandStyles.secondaryColor} 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Browse Other Events</a>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
          For questions about your refund, contact us at payments@exjamalumni.org
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(
    content,
    `Event Cancelled: ${details.eventDetails.title} - Full refund processing`
  );
};

// 8. Post-Event Thank You Email Template
export const getPostEventThankYouTemplate = (details: RegistrationDetails): string => {
  const content = `
    ${emailHeader("Thank You for Attending!")}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 24px; color: ${brandStyles.textColor}; font-size: 24px; font-weight: 600; text-align: center;">
          Thank You, ${details.name}!
        </h2>
        
        <p style="margin: 0 0 24px; color: ${brandStyles.mutedColor}; font-size: 16px; line-height: 24px; text-align: center;">
          We hope you enjoyed ${details.eventDetails.title}. Your participation made it a huge success!
        </p>

        <!-- Event Stats -->
        <div style="background: linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%); padding: 24px; border-radius: 12px; margin: 32px 0;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.primaryColor}; font-size: 18px; font-weight: 600; text-align: center;">Event Highlights</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="33%" style="text-align: center; padding: 8px;">
                <div style="color: ${brandStyles.primaryColor}; font-size: 32px; font-weight: 700;">250+</div>
                <div style="color: ${brandStyles.mutedColor}; font-size: 14px;">Attendees</div>
              </td>
              <td width="33%" style="text-align: center; padding: 8px;">
                <div style="color: ${brandStyles.primaryColor}; font-size: 32px; font-weight: 700;">15</div>
                <div style="color: ${brandStyles.mutedColor}; font-size: 14px;">Speakers</div>
              </td>
              <td width="33%" style="text-align: center; padding: 8px;">
                <div style="color: ${brandStyles.primaryColor}; font-size: 32px; font-weight: 700;">8</div>
                <div style="color: ${brandStyles.mutedColor}; font-size: 14px;">Sessions</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Resources -->
        <div style="background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.textColor}; font-size: 18px; font-weight: 600;">Event Resources</h3>
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            <li style="margin-bottom: 12px;">
              <a href="#" style="color: ${brandStyles.primaryColor}; text-decoration: none; font-weight: 500;">
                📸 View Event Photos
              </a>
            </li>
            <li style="margin-bottom: 12px;">
              <a href="#" style="color: ${brandStyles.primaryColor}; text-decoration: none; font-weight: 500;">
                🎥 Watch Session Recordings
              </a>
            </li>
            <li style="margin-bottom: 12px;">
              <a href="#" style="color: ${brandStyles.primaryColor}; text-decoration: none; font-weight: 500;">
                📄 Download Presentation Slides
              </a>
            </li>
            <li style="margin-bottom: 0;">
              <a href="#" style="color: ${brandStyles.primaryColor}; text-decoration: none; font-weight: 500;">
                📊 View Your Certificate of Attendance
              </a>
            </li>
          </ul>
        </div>

        <!-- Feedback Request -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h4 style="margin: 0 0 8px; color: ${brandStyles.textColor}; font-size: 16px; font-weight: 600;">We'd Love Your Feedback!</h4>
          <p style="margin: 0 0 16px; color: ${brandStyles.mutedColor}; font-size: 14px;">
            Help us make future events even better
          </p>
          <a href="http://localhost:3002/feedback" style="display: inline-block; background-color: white; color: ${brandStyles.primaryColor}; text-decoration: none; padding: 10px 24px; border: 2px solid ${brandStyles.primaryColor}; border-radius: 8px; font-weight: 600; font-size: 14px;">Take 2-Minute Survey</a>
        </div>

        <!-- Next Event Preview -->
        <div style="border-top: 2px solid #e5e7eb; margin-top: 32px; padding-top: 32px;">
          <h3 style="margin: 0 0 16px; color: ${brandStyles.textColor}; font-size: 18px; font-weight: 600; text-align: center;">Save the Date!</h3>
          <p style="margin: 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
            Our next event: <strong>Summer Networking Mixer</strong> - June 20, 2025
          </p>
        </div>

        <p style="margin: 24px 0 0; color: ${brandStyles.mutedColor}; font-size: 14px; text-align: center;">
          Thank you for being part of the ExJAM Alumni community!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(content, `Thank you for attending ${details.eventDetails.title}`);
};

// Waitlist notification template
export const getWaitlistNotificationTemplate = (details: {
  name: string;
  eventTitle: string;
  position: number;
  eventDate: string;
  eventVenue: string;
}) => {
  const content = `
    <tr>
      <td style="padding: 32px 24px; background-color: white;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background-color: ${defaultBrandStyles.warningColor}; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
            📝 You're on the Waitlist!
          </div>
        </div>

        <h2 style="margin: 0 0 16px; color: ${defaultBrandStyles.textColor}; font-size: 24px; font-weight: 700; text-align: center;">
          Hi ${details.name}!
        </h2>

        <p style="margin: 0 0 24px; color: ${defaultBrandStyles.textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
          Thank you for your interest in <strong>${details.eventTitle}</strong>. The event is currently full, but we've added you to our waitlist.
        </p>

        <!-- Waitlist Position -->
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; border-left: 4px solid ${defaultBrandStyles.warningColor};">
          <h3 style="margin: 0 0 8px; color: ${defaultBrandStyles.textColor}; font-size: 18px; font-weight: 600;">Your Position</h3>
          <div style="font-size: 32px; font-weight: 700; color: ${defaultBrandStyles.warningColor}; margin: 8px 0;">#${details.position}</div>
          <p style="margin: 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px;">
            in the waitlist queue
          </p>
        </div>

        <!-- Event Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: ${defaultBrandStyles.textColor}; font-size: 18px; font-weight: 600; text-align: center;">Event Details</h3>
          <table style="width: 100%; margin: 0;">
            <tr>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; font-weight: 500;">📅 Date:</td>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.textColor}; font-size: 14px; font-weight: 600;">${details.eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; font-weight: 500;">📍 Venue:</td>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.textColor}; font-size: 14px; font-weight: 600;">${details.eventVenue}</td>
            </tr>
          </table>
        </div>

        <!-- What Happens Next -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${defaultBrandStyles.primaryColor};">
          <h4 style="margin: 0 0 12px; color: ${defaultBrandStyles.textColor}; font-size: 16px; font-weight: 600;">What happens next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: ${defaultBrandStyles.textColor}; font-size: 14px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">We'll notify you immediately if a spot becomes available</li>
            <li style="margin-bottom: 8px;">You'll have 24 hours to confirm your registration</li>
            <li style="margin-bottom: 0;">Your position in the queue is secured until then</li>
          </ul>
        </div>

        <p style="margin: 24px 0 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; text-align: center;">
          We'll keep you updated on your waitlist status. Thank you for your patience!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(content, `You're on the waitlist for ${details.eventTitle}`);
};

// Waitlist converted template
export const getWaitlistConvertedTemplate = (details: {
  name: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationId: string;
}) => {
  const content = `
    <tr>
      <td style="padding: 32px 24px; background-color: white;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background-color: ${defaultBrandStyles.successColor}; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
            🎉 Great News!
          </div>
        </div>

        <h2 style="margin: 0 0 16px; color: ${defaultBrandStyles.textColor}; font-size: 24px; font-weight: 700; text-align: center;">
          You're Now Registered!
        </h2>

        <p style="margin: 0 0 24px; color: ${defaultBrandStyles.textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
          Hi ${details.name}! A spot has opened up for <strong>${details.eventTitle}</strong>, and you're now officially registered!
        </p>

        <!-- Success Badge -->
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; border-left: 4px solid ${defaultBrandStyles.successColor};">
          <h3 style="margin: 0 0 8px; color: ${defaultBrandStyles.textColor}; font-size: 18px; font-weight: 600;">✅ Registration Confirmed</h3>
          <p style="margin: 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px;">
            Registration ID: <span style="font-family: monospace; background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${details.registrationId}</span>
          </p>
        </div>

        <!-- Event Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: ${defaultBrandStyles.textColor}; font-size: 18px; font-weight: 600; text-align: center;">Event Details</h3>
          <table style="width: 100%; margin: 0;">
            <tr>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; font-weight: 500;">📅 Date:</td>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.textColor}; font-size: 14px; font-weight: 600;">${details.eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; font-weight: 500;">📍 Venue:</td>
              <td style="padding: 8px 0; color: ${defaultBrandStyles.textColor}; font-size: 14px; font-weight: 600;">${details.eventVenue}</td>
            </tr>
          </table>
        </div>

        <!-- Next Steps -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${defaultBrandStyles.primaryColor};">
          <h4 style="margin: 0 0 12px; color: ${defaultBrandStyles.textColor}; font-size: 16px; font-weight: 600;">Next Steps:</h4>
          <ol style="margin: 0; padding-left: 20px; color: ${defaultBrandStyles.textColor}; font-size: 14px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Complete payment if required</li>
            <li style="margin-bottom: 8px;">Save this confirmation email</li>
            <li style="margin-bottom: 0;">Watch for your ticket with QR code</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="http://localhost:3002/dashboard" style="display: inline-block; background-color: ${defaultBrandStyles.primaryColor}; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Your Registration
          </a>
        </div>

        <p style="margin: 24px 0 0; color: ${defaultBrandStyles.mutedColor}; font-size: 14px; text-align: center;">
          We're excited to see you at the event!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `;

  return emailWrapper(content, `You're now registered for ${details.eventTitle}!`);
};

// Export all templates
export default {
  getWelcomeEmailTemplate,
  getRegistrationConfirmationTemplate,
  getPaymentConfirmationTemplate,
  getEventReminderTemplate,
  getCheckinConfirmationTemplate,
  getBankTransferInstructionsTemplate,
  getEventCancellationTemplate,
  getPostEventThankYouTemplate,
  getWaitlistNotificationTemplate,
  getWaitlistConvertedTemplate,
};
