import { Colors } from "@/constants/Colors";

export interface BookingPatient {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user?: { email?: string };
}

export interface BookingAddress {
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface BookingService {
  id: string;
  service_name: string;
  duration?: number;
  duration_type?: string;
}

export interface Booking {
  id: string;
  patient_id: string;
  nurse_id: string;
  service_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  total_amount: string;
  booking_status: string;
  payment_status: string;
  notes?: string | null;
  parent_booking_id?: string | null;
  patient: BookingPatient;
  service: BookingService;
  booking_address: BookingAddress;
}

type Theme = (typeof Colors)["light"];

/** Pill colours per booking_status (models.Booking documents the values). */
export const statusMeta = (status: string, colors: Theme) => {
  switch (status) {
    case "Confirmed":
      return {
        label: "Confirmed",
        fg: colors.primaryDark,
        bg: colors.primaryTint,
        border: colors.primarySoft,
      };
    case "Completed":
      return {
        label: "Completed",
        fg: colors.success,
        bg: colors.successSoft,
        border: colors.successSoft,
      };
    case "Cancelled":
    case "Rejected":
      return {
        label: status,
        fg: colors.error,
        bg: colors.errorSoft,
        border: colors.errorSoft,
      };
    default:
      // Pending: the patient holds the slot but hasn't paid yet.
      return {
        label: status,
        fg: colors.warning,
        bg: colors.warningSoft,
        border: colors.warningSoft,
      };
  }
};

export const patientName = (booking: Booking) => {
  const name = [booking.patient?.first_name, booking.patient?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "Patient";
};

export const formatDay = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const formatTimeRange = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${new Date(start).toLocaleTimeString(
    undefined,
    opts,
  )} – ${new Date(end).toLocaleTimeString(undefined, opts)}`;
};

export const shortAddress = (address?: BookingAddress) => {
  if (!address) return "";
  return [address.address_line_1, address.city, address.pincode]
    .filter(Boolean)
    .join(", ");
};

/**
 * A Daily_Shift booking is a billing wrapper: the parent carries the payment
 * and each shift is a child booking completed on its own. `/bookings/me`
 * returns both, flat, so roots and shifts are split here.
 */
export const rootBookings = (bookings: Booking[]) =>
  bookings.filter((booking) => !booking.parent_booking_id);

export const shiftsOf = (bookings: Booking[], parentId: string) =>
  bookings
    .filter((booking) => booking.parent_booking_id === parentId)
    .sort(
      (a, b) =>
        new Date(a.scheduled_start_time).getTime() -
        new Date(b.scheduled_start_time).getTime(),
    );

/** A visit can only be completed once it has started and is still Confirmed. */
export const isCompletable = (booking: Booking) =>
  booking.booking_status === "Confirmed" &&
  new Date(booking.scheduled_start_time).getTime() <= Date.now();

export const apiErrorMessage = (error: any, fallback: string) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};
