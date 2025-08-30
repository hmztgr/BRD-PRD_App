/**
 * Email Service
 * Handles email verification, password reset, and other transactional emails
 */

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Email transporter configuration
const createTransporter = () => {
  // Priority 1: Use Mailjet SMTP if configured (works in both dev and prod)
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    return nodemailer.createTransport({
      host: 'in.mailjet.com',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.MAILJET_API_KEY,
        pass: process.env.MAILJET_SECRET_KEY
      }
    });
  }

  // Priority 2: For development without Mailjet - use Ethereal test account
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Priority 3: Fallback Gmail SMTP (for testing)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'test@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'test-password'
    }
  });
};

// Generate verification token
export async function generateVerificationToken(userId: string, email: string): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  // Store token in database
  await prisma.emailToken.create({
    data: {
      token,
      type: 'email_verification',
      userId,
      email,
      expires: expiresAt,
      used: false
    }
  });

  return token;
}

// Generate password reset token
export async function generatePasswordResetToken(userId: string, email: string): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

  // Store token in database
  await prisma.emailToken.create({
    data: {
      token,
      type: 'password_reset',
      userId,
      email,
      expires: expiresAt,
      used: false
    }
  });

  return token;
}

// Send verification email
export async function sendVerificationEmail(
  email: string, 
  name: string, 
  token: string,
  locale: 'en' | 'ar' = 'en'
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const verificationUrl = `${appUrl}/${locale}/auth/verify-email?token=${token}`;

    const translations = {
      en: {
        subject: 'Verify your BRD/PRD App account',
        heading: 'Welcome to BRD/PRD App!',
        message: `Hi ${name},\n\nThank you for signing up! Please verify your email address to complete your registration.`,
        buttonText: 'Verify Email Address',
        footer: 'If you didn\'t create this account, please ignore this email.',
        validFor: 'This link is valid for 24 hours.'
      },
      ar: {
        subject: 'تأكيد حساب تطبيق BRD/PRD',
        heading: 'مرحباً بك في تطبيق BRD/PRD!',
        message: `مرحباً ${name}،\n\nشكراً لك على التسجيل! يرجى تأكيد عنوان بريدك الإلكتروني لإكمال التسجيل.`,
        buttonText: 'تأكيد البريد الإلكتروني',
        footer: 'إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.',
        validFor: 'هذا الرابط صالح لمدة 24 ساعة.'
      }
    };

    const t = translations[locale];
    const isRTL = locale === 'ar';

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@brdprdapp.com',
      to: email,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${t.heading}</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">
              ${t.message.replace('\n\n', '</p><p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">')}
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                ${t.buttonText}
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              ${t.validFor}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              ${t.footer}
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    // For development, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Verification email sent!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
      console.log('Verification URL:', verificationUrl);
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  token: string,
  locale: 'en' | 'ar' = 'en'
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const resetUrl = `${appUrl}/${locale}/auth/reset-password/${token}`;

    const translations = {
      en: {
        subject: 'Reset your BRD/PRD App password',
        heading: 'Password Reset Request',
        message: `Hi ${name},\n\nWe received a request to reset your password. Click the button below to create a new password.`,
        buttonText: 'Reset Password',
        footer: 'If you didn\'t request this, please ignore this email. Your password won\'t be changed.',
        validFor: 'This link is valid for 1 hour.'
      },
      ar: {
        subject: 'إعادة تعيين كلمة مرور تطبيق BRD/PRD',
        heading: 'طلب إعادة تعيين كلمة المرور',
        message: `مرحباً ${name}،\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.`,
        buttonText: 'إعادة تعيين كلمة المرور',
        footer: 'إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني. لن يتم تغيير كلمة المرور الخاصة بك.',
        validFor: 'هذا الرابط صالح لمدة ساعة واحدة.'
      }
    };

    const t = translations[locale];
    const isRTL = locale === 'ar';

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@brdprdapp.com',
      to: email,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${t.heading}</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">
              ${t.message.replace('\n\n', '</p><p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">')}
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                ${t.buttonText}
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              ${t.validFor}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              ${t.footer}
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    // For development, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password reset email sent!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
      console.log('Reset URL:', resetUrl);
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Verify email token
export async function verifyEmailToken(token: string, type: 'email_verification' | 'password_reset' = 'email_verification'): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
  try {
    // Find the token in database
    const emailToken = await prisma.emailToken.findUnique({
      where: { 
        token: token
      },
      include: {
        user: true
      }
    });

    if (!emailToken) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }

    if (emailToken.type !== type) {
      return {
        success: false,
        error: 'Token type mismatch'
      };
    }

    if (emailToken.used) {
      return {
        success: false,
        error: 'Token has already been used'
      };
    }

    if (emailToken.expires < new Date()) {
      return {
        success: false,
        error: 'Token has expired'
      };
    }

    // Mark token as used
    await prisma.emailToken.update({
      where: { id: emailToken.id },
      data: { used: true }
    });

    // For email verification, update user's emailVerified field
    if (type === 'email_verification') {
      await prisma.user.update({
        where: { id: emailToken.userId },
        data: { emailVerified: new Date() }
      });
    }

    return {
      success: true,
      userId: emailToken.userId,
      email: emailToken.email
    };

  } catch (error) {
    console.error('Error verifying email token:', error);
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
}