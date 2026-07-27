import { z } from 'zod'

export const emailSchema = z.string().email('Enter a valid email address')

export const signupPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/, 'Include a number or symbol')

export const signInSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: signupPasswordSchema,
})

export const processRequestSchema = z.object({
  contract_id: z.string().uuid(),
  custom_terms: z.array(z.string().min(1).max(100)).max(5).optional(),
})

export const chatRequestSchema = z.object({
  contract_id: z.string().uuid(),
  message: z.string().min(1).max(1000),
})

export const uploadContractTypeSchema = z.enum(['nda', 'msa'])

export const termEditSchema = z.object({
  value: z.string().trim().min(1, 'Value cannot be empty.').max(1000, 'Value must be 1000 characters or fewer.'),
})

export const feedbackRequestSchema = z.object({
  contract_id: z.string().uuid(),
  rating: z.enum(['up', 'down']),
  comment: z.string().max(500, 'Comment must be 500 characters or fewer.').optional(),
})

// Supabase returns free-text error messages, not stable codes — map the substrings
// we know it sends today to the copy specified in spec-auth.md.
export function mapAuthError(message: string): string {
  if (/user already registered/i.test(message)) {
    return 'An account with this email already exists'
  }
  if (/password should be at least/i.test(message)) {
    return 'Password must be at least 8 characters'
  }
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect email or password'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Verify your email before signing in.'
  }
  return message
}
