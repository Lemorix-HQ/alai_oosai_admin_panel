import { object } from 'yup';
import validations from '.';

export const announcementSchema = object({
  title: validations.required_string,
  description: validations.description,
  time: validations.optional_string,
});
