const amsterdam = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function amsterdamToday(now = new Date()) {
  const parts = amsterdam.formatToParts(now);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

export function amsterdamYear(now = new Date()) {
  return part(amsterdam.formatToParts(now), "year");
}
