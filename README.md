# UtsavHub Mobile (React Native / Android App)

> **Native Android & iOS Event Planning Platform • Date-First & Capacity-First Discovery**

This is the native Android mobile application for **UtsavHub**, built with **React Native**, **Expo SDK 52**, **TypeScript**, and **Supabase**.

---

## 📱 Features on Android
1. **Date-First, Location-First, Capacity Discovery Engine**
   - Quick date selector (Muhurtham dates like Nov 20, Dec 14).
   - Locality dropdown selector (Madhurawada, Rushikonda, MVP Colony, etc.).
   - Capacity quick chips (`50-100`, `100-300`, `300-500`, `500-1000`, `1000+`).
   - Anti-disappointment gatekeeper immediately hides any booked or under-capacity venues.

2. **Vertical Video Reels Walkthrough (`media_reels`)**
   - Fullscreen vertical video player with sound toggle, time counter, and instant WhatsApp inquiry handoff.

3. **Interactive Catering Plate-Cost Calculator**
   - Veg & Non-Veg package selectors.
   - Smooth native guest slider (100 to 1,500+ guests).
   - Dynamic real-time calculation: `Calculated Total = Guests × Price/plate`.
   - Itemized dish checklist and WhatsApp quote generator.

4. **Mandapam & Stage Decor Lookbook**
   - Realistic dimensions (e.g., 40×25 ft), fiber/floral photos, fixed price, and PDF lookbook integration.

5. **Slide-Up Native Booking Sheet (`booking_inquiries`)**
   - Seamless inquiry submission with reference code and 1-tap WhatsApp message to the venue manager.

---

## 🚀 How to Run the App

### Option A: Run on an Android Phone (via Expo Go)
1. Install **Expo Go** from the Google Play Store on your Android phone.
2. In your terminal, run:
   ```bash
   npm start
   ```
3. Scan the generated QR code using the Expo Go app. The native Android app will load on your device!

### Option B: Run on Android Emulator
```bash
npm run android
```

### Option C: Run in Browser / Web Mode
```bash
npm run web
```

---

## 📦 Project Structure
- `App.tsx`: Main navigation controller and bottom tab bar (`Home`, `Explore`, `AC Halls`, `Catering`).
- `src/screens/HomeScreen.tsx`: Screen 1 — Mobile Home Hero, Locality Dropdown, Guest Chips, Category Pills, Reels Carousel.
- `src/screens/ListingsScreen.tsx`: Screen 2 — Sticky Active Filter Bar, AC/Catering Toggles, Live Gatekeeper banner.
- `src/screens/VendorDetailScreen.tsx`: Screen 3 — Vertical Reels carousel, Mandapam Lookbook tab, Catering Calculator tab, Sticky Bottom Booking Bar.
- `src/components/`: Reusable native components (`Header`, `SearchCard`, `ListingCard`, `CateringCalculator`, `ReelModal`, `BookingModal`).
- `src/lib/`: `supabaseClient.ts` (with offline fallback engine) & `mockData.ts`.
