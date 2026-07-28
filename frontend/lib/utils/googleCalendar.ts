interface CalendarEventInput {
  title: string;
  description: string;
  location?: string;
  startsAt: string;
  endsAt: string;
}

function toGoogleDateFormat(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl({
  title,
  description,
  location,
  startsAt,
  endsAt,
}: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleDateFormat(startsAt)}/${toGoogleDateFormat(endsAt)}`,
    details: description,
  });

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}