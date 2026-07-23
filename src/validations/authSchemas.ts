// Zod validation schemas for authentication
import { z } from 'zod';

// Login form validation
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register form validation
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password validation
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Profile update validation
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// Support ticket validation
export const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject is too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description is too long'),
  category: z.enum(['billing', 'technical', 'account', 'general']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  attachments: z.array(z.string().url()).max(5, 'Maximum 5 attachments allowed').optional(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;

export const replyTicketSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  attachments: z.array(z.string().url()).max(5, 'Maximum 5 attachments allowed').optional(),
});

export type ReplyTicketFormData = z.infer<typeof replyTicketSchema>;

// Announcement validation (admin)
export const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000, 'Content is too long'),
  type: z.enum(['maintenance', 'outage', 'news', 'promo', 'system']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  publishAt: z.string().datetime('Invalid publish date'),
  expiresAt: z.string().datetime('Invalid expiry date').optional().or(z.literal('')),
  targetAudience: z.enum(['all', 'residential', 'commercial']).optional(),
});

export type CreateAnnouncementFormData = z.infer<typeof createAnnouncementSchema>;

// Bill validation (admin)
export const createBillSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  billingPeriodStart: z.string().date('Invalid start date'),
  billingPeriodEnd: z.string().date('Invalid end date'),
  dueDate: z.string().date('Invalid due date'),
  amountDue: z.number().positive('Amount must be positive').max(999999.99, 'Amount too large'),
  billNumber: z.string().min(1, 'Bill number is required').max(50, 'Bill number too long'),
  consumptionKwh: z.number().min(0, 'Consumption cannot be negative').optional(),
  previousReading: z.number().min(0).optional(),
  currentReading: z.number().min(0).optional(),
  billUrl: z.string().url('Invalid bill URL').optional().or(z.literal('')),
});

export type CreateBillFormData = z.infer<typeof createBillSchema>;

// Payment validation (admin)
export const createPaymentSchema = z.object({
  billId: z.string().uuid('Invalid bill ID').optional().or(z.literal('')),
  accountId: z.string().uuid('Invalid account ID'),
  amountPaid: z.number().positive('Amount must be positive').max(999999.99, 'Amount too large'),
  paymentDate: z.string().datetime('Invalid payment date'),
  referenceNumber: z.string().min(1, 'Reference number is required').max(50, 'Reference number too long'),
  status: z.enum(['completed', 'pending', 'failed', 'refunded']).optional(),
  paymentMethod: z.enum(['cash', 'gcash', 'maya', 'card', 'bank']).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;