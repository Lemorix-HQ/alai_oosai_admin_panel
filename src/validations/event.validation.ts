import { object, array, string } from 'yup';
import validations from '.';

export const eventSchema = object({
  title: validations.required_string,
  description: validations.description,
  place: validations.required_string,
  time: validations.iso_date,
  conductorName: validations.required_string,
  type: validations.event_type,
  ctaText: validations.optional_string,
  tags: array().of(string()).optional(),
});
