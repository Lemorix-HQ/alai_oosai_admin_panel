import { object, ref, string } from 'yup';
import validations from '.';

export const emailLoginSchema = object({
  email: validations.email,
  password: validations.password_required,
});

export const forgotPasswordSchema = object({ email: validations.email });

export const setPasswordSchema = object({
  password: validations.password_new,
  confirm_password: string()
    .required('Please type the password again')
    .oneOf([ref('password')], 'The two passwords do not match'),
});

// The phone screens under app/(auth)/_phone-login/ used these. Kept so putting
// them back is a move, not a rewrite.
export const loginSchema = object({ phone_number: validations.phone_number });
export const otpSchema = object({ otp: validations.otp });
