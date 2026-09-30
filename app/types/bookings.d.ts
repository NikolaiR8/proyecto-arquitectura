type User = {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: "customer" | "admin";
    is_banned: boolean;
    created_at: string;
};

type Court = {
    court_id: number;
    court_name: string;
    sport: string;
};

type BookingRow = {
    user_id: number;
    court_id: number;
    booked_date: string;
    booked_time: string;
    booking_status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    payment_status?: "paid" | "pending" | "refunded";
    payment_method?: string;
    price?: number;
    created_at: Date;
};

type Booking = {
    booking_id: number;
    user_id: number;
    court_id: number;
    booked_date: string;
    booked_time: string;
    booking_status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    payment_status?: "paid" | "pending" | "refunded";
    payment_method?: string;
    price?: number;
    created_at: string;
};

type BookingSummary = Pick<Booking, "court_id" | "booked_date" | "booked_time">;

type Reservation = Pick<Booking, "booking_id" | "court_id" | "booked_date" | "booked_time" | "booking_status"> & 
    Pick<Court, "court_name"> & {
        payment_status?: "paid" | "pending" | "refunded";
        payment_method?: string;
        payment_proof?: string;
        price?: number;
    };

type UserBooking = BookingSummary & {
    court_name: string;
    price?: number;
};

type AdminBooking = Pick<Booking, "booking_id" | "booked_time" | "booking_status"> & 
    Pick<Court, "court_name"> & 
    Pick<User, "first_name" | "last_name" | "email"> & {
        payment_status?: string;
        payment_method?: string;
        payment_proof?: string;
        price?: number;
        booked_date?: string;
    };

type KpiData = {
    total_signups: number;
    new_signups: number;
    banned_users: number;
    total_bookings: number;
    cancelled_percentage: number;
    no_show_percentage: number;
};

type BookingsBreakdownData = {
    confirmed_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    no_show_bookings: number;
};

type SportBreakdownData = {
    sport: string;
    total: number;
};

type HeatMapData = {
    totalCourts: number;
    heatMapMatrix: Array<number[]>;
};

type RevenueData = {
    total_revenue: number;
    pending_revenue: number;
    refunded_revenue: number;
    total_paid_bookings: number;
    average_ticket: number;
};

type CourtUsageItem = {
    court_id: number;
    court_name: string;
    sport: string;
    booking_count: number;
    completed_count: number;
    total_court_revenue: number;
    usage_percentage: number;
    is_most_used: boolean;
};

type AuditBookingItem = {
    booking_id: number;
    court_id: number;
    court_name: string;
    sport: string;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    booked_date: string;
    booked_time: string;
    booking_status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    payment_status: "paid" | "pending" | "refunded";
    payment_method: string;
    payment_proof?: string | null;
    price: number;
    created_at: string;
};

type AdminData = {
    kpiData: KpiData;
    revenueData: RevenueData;
    courtUsageData: CourtUsageItem[];
    auditData: AuditBookingItem[];
    bookingsBreakdownData: BookingsBreakdownData;
    sportsBreakdownData: SportBreakdownData[];
    heatMapData: HeatMapData;
};

type DonutSlice = { name: string; value: number; fill: string };
type DonutChartInput = { config: import("../components/ui/chart").ChartConfig; data: DonutSlice[] };