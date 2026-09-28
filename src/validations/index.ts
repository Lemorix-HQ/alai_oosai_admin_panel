import { string, number } from 'yup';

const validations = {
  required_string: string()
    .required('This field is required')
    .typeError('Please enter a valid value'),
  phone_number: string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be 10 digits'),
  otp: number()
    .required('OTP is required')
    .typeError('OTP must be a number')
    .integer('OTP must be a 6-digit number')
    .min(100000, 'OTP must be 6 digits')
    .max(999999, 'OTP must be 6 digits'),
  description: string()
    .required('Description is required')
    .typeError('Please enter a valid description'),
  optional_string: string().typeError('Please enter a valid value').nullable(),
  iso_date: string().required('Date and time is required'),
  email: string()
    .required('Email is required')
    .email('Enter a valid email address'),
  password_required: string().required('Password is required'),
  password_new: string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain at least one letter')
    .matches(/\d/, 'Password must contain at least one number'),
  event_type: string()
    .oneOf(['event', 'poster', 'promotion'], 'Please select a valid type')
    .required('Type is required'),
};

export default validations;
