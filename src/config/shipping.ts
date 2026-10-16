export const pricesIncludeVat = true;

export type ShippingClass = "letterbox" | "parcel";
export type ShipCountry = "NL" | "BE" | "AM" | "Other";

const cents: Record<ShipCountry, Record<ShippingClass, number>> = {
  NL: { letterbox: 455, parcel: 695 },
  BE: { letterbox: 895, parcel: 1295 },
  AM: { letterbox: 1450, parcel: 1895 },
  Other: { letterbox: 1450, parcel: 1895 },
};

export const shipCountries: ShipCountry[] = ["NL", "BE", "AM", "Other"];

export function isShipCountry(value: string): value is ShipCountry {
  return shipCountries.includes(value as ShipCountry);
}

export function shippingCents(country: ShipCountry, shippingClass: ShippingClass) {
  return cents[country][shippingClass];
}
