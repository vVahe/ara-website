import { copy } from "@/config/copy";

export const addressFields = ["name", "email", "street", "postalCode", "city"] as const;

export type AddressField = (typeof addressFields)[number];

export type AddressErrors = Partial<Record<AddressField, string>>;

export type AddressDraft = Record<AddressField, string>;

const limits: Record<AddressField, number> = {
  name: 80,
  email: 120,
  street: 120,
  postalCode: 16,
  city: 80,
};

const wordsPattern = /^(?=.*\p{L})[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const postalPattern = /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u;

function tidy(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

export function addressErrors(input: Record<string, unknown> | AddressDraft): AddressErrors {
  const name = tidy(input.name);
  const email = tidy(input.email);
  const street = tidy(input.street);
  const postalCode = tidy(input.postalCode);
  const city = tidy(input.city);
  const errors: AddressErrors = {};

  if (!name) errors.name = copy.nameMissing;
  else if (name.length > limits.name || !wordsPattern.test(name)) errors.name = copy.nameInvalid;

  if (!email) errors.email = copy.emailMissing;
  else if (email.length > limits.email || !emailPattern.test(email)) errors.email = copy.emailInvalid;

  if (!street || street.length > limits.street || !/[\p{L}\p{N}]/u.test(street)) errors.street = copy.streetMissing;

  if (!postalCode) errors.postalCode = copy.postalMissing;
  else if (postalCode.length > limits.postalCode || !postalPattern.test(postalCode)) {
    errors.postalCode = copy.postalInvalid;
  }

  if (!city) errors.city = copy.cityMissing;
  else if (city.length > limits.city || !wordsPattern.test(city)) errors.city = copy.cityInvalid;

  return errors;
}

export function readAddress(
  input: Record<string, unknown> | AddressDraft,
): { ok: true; value: AddressDraft } | { ok: false; fields: AddressErrors } {
  const fields = addressErrors(input);
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      name: tidy(input.name),
      email: tidy(input.email),
      street: tidy(input.street),
      postalCode: tidy(input.postalCode),
      city: tidy(input.city),
    },
  };
}
