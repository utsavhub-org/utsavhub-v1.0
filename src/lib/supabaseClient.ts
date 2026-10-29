import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Business, BookingInquiry } from '../types';
import { MOCK_BUSINESSES } from './mockData';

// Standard Supabase credentials
const supabaseUrl = '';
const supabaseAnonKey = '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const localInquiries: BookingInquiry[] = [];

export interface FilterParams {
  location?: string;
  date?: string;
  guests?: number;
  category?: string;
  acOnly?: boolean;
  outsideCatering?: boolean;
  maxBudget?: number;
}

export async function getFilteredBusinesses(filters: FilterParams): Promise<{
  businesses: Business[];
  blockedCount: number;
}> {
  let results = [...MOCK_BUSINESSES];
  let blocked = 0;

  if (filters.location && filters.location.trim().length > 0) {
    const loc = filters.location.toLowerCase();
    results = results.filter(
      (b) =>
        b.city.toLowerCase().includes(loc) ||
        b.area_locality.toLowerCase().includes(loc)
    );
  }

  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'wishlist') {
      results = results.filter((b) => ['venue-1', 'venue-2', 'decor-1'].includes(b.id));
    } else {
      results = results.filter((b) => b.category === filters.category);
    }
  }

  // Date-First Gatekeeper
  if (filters.date) {
    const targetDate = filters.date;
    results = results.filter((b) => {
      const isBooked = b.availability_calendar?.some(
        (slot) => slot.blocked_date === targetDate && slot.is_booked
      );
      if (isBooked) {
        blocked++;
        return false;
      }
      return true;
    });
  }

  // Capacity Gatekeeper
  if (filters.guests && filters.guests > 0) {
    const req = filters.guests;
    results = results.filter((b) => {
      if (b.category === 'venue' && b.venue_details) {
        return (
          b.venue_details.floating_capacity >= req ||
          b.venue_details.seating_capacity >= req
        );
      }
      return true;
    });
  }

  // AC Only
  if (filters.acOnly) {
    results = results.filter((b) => {
      if (b.category === 'venue') {
        return b.venue_details?.is_ac === true;
      }
      return true;
    });
  }

  // Outside Catering
  if (filters.outsideCatering) {
    results = results.filter((b) => {
      if (b.category === 'venue') {
        return b.venue_details?.outside_catering_allowed === true;
      }
      return true;
    });
  }

  return { businesses: results, blockedCount: blocked };
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const found = MOCK_BUSINESSES.find((b) => b.id === id);
  return found || null;
}

export async function createBookingInquiry(
  inquiry: Omit<BookingInquiry, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; id: string }> {
  const mockId = 'INQ-' + Math.floor(100000 + Math.random() * 900000);
  localInquiries.push({
    ...inquiry,
    id: mockId,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  return { success: true, id: mockId };
}
