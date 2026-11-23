export const pricesIncludeVat = true;

export type ShippingClass = "letterbox" | "parcel";
export type ShipCountry = "NL";

const cents: Record<ShipCountry, Record<ShippingClass, number>> = {
  NL: { letterbox: 455, parcel: 695 },
};

export const shipCountries: ShipCountry[] = ["NL"];

export function isShipCountry(value: string): value is ShipCountry {
  return shipCountries.includes(value as ShipCountry);
}

export function shippingCents(country: ShipCountry, shippingClass: ShippingClass) {
  return cents[country][shippingClass];
}
