export const USERNAME_ALLOWED_CHAR_REGEX = /^[\p{L}\p{N}_.@+-]+$/u;

// Remove ASCII control characters that often cause server-side validation issues.
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;
const CONTROL_CHAR_EXCEPT_NEWLINE_REGEX = /[\u0000-\u0009\u000B-\u001F\u007F]/g;

export const sanitizeSingleLineText = (value: string): string =>
  value.replace(CONTROL_CHAR_REGEX, '').replace(/\s+/g, ' ');

export const sanitizeMultiLineText = (value: string): string =>
  value.replace(CONTROL_CHAR_EXCEPT_NEWLINE_REGEX, '');

export const sanitizeUsernameInput = (value: string): string =>
  value.replace(CONTROL_CHAR_REGEX, '').replace(/\s+/g, '');

export const isUsernameValid = (value: string): boolean => USERNAME_ALLOWED_CHAR_REGEX.test(value);

