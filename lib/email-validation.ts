export const GREYORANGE_EMAIL_DOMAIN = "greyorange.com";
export const GREYORANGE_EMAIL_SUFFIX = `@${GREYORANGE_EMAIL_DOMAIN}`;

const GREYORANGE_EMAIL_PATTERN = /^[^\s@]+@(greyorange|dematic)\.com$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Valid GreyOrange organization email: user@greyorange.com or user@dematic.com. */
export function isGreyOrangeEmail(email: string): boolean {
  return GREYORANGE_EMAIL_PATTERN.test(normalizeEmail(email));
}

export function greyOrangeEmailErrorMessage(): string {
  return "Please use your organization email only (@greyorange.com or dematic.com).";
}
