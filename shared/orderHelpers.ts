export function formatOrderNumber(id: number, date = new Date()) {
  return `ET-${date.getFullYear()}-${String(id).padStart(6, "0")}`;
}

export function isEurotruckAfterHours(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Santo_Domingo", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(date);
  const weekday = parts.find(part => part.type === "weekday")?.value;
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? 0);
  const currentMinutes = hour * 60 + minute;
  return weekday === "Sat" || weekday === "Sun" || currentMinutes < 510 || currentMinutes >= 1020;
}

export function buildWhatsAppOrderUrl(phone: string, orderNumber: string, company: string) {
  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(`Hola Eurotruck, damos seguimiento a la orden ${orderNumber} de ${company}.`);
  return `https://wa.me/${digits}?text=${message}`;
}
