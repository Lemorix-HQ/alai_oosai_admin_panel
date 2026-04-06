import { object } from 'yup';
import validations from '.';

export const loginSchema = object({ phone_number: validations.phone_number });
export const otpSchema = object({ otp: validations.otp });
