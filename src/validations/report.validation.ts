import { object } from 'yup';
import validations from '.';

export const reportSchema = object({
  title: validations.required_string,
  description: validations.description,
});
