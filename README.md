# WOLFITNESS | The Performance Ecosystem

![WOLFITNESS Hero](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200)

**WOLFITNESS** is a high-performance fitness e-commerce and training platform designed for elite coaches and athletes. Built on a unified database architecture shared with the **Signal** network, it provides a seamless transition from professional mentorship to physical execution.

---

## ⚡ The Vision
WOLFITNESS replaces fragmented training apps with a single, cinematic experience. It is built for the "Represent" aesthetic: sharp corners, monochrome palettes, and bold typography. It’s not just a tracker; it’s a marketplace for performance protocols.

---

## 🚀 Key Features (V1 Complete)

### **For Coaches & Mentors**
*   **Professional Storefront:** A dedicated profile highlighting credentials, specializations, and verified status.
*   **Hierarchical Program Builder:** Create complex training protocols organized by Weeks → Days → Exercises with video support.
*   **Stripe Connect Integration:** Seamless onboarding for coaches to receive payouts (90/10 revenue split).
*   **Franchise System:** Mentors can create "Master Templates" that other coaches can clone and sell (80/10/10 royalty split).

### **For Athletes (Consumers)**
*   **Vibe-Based Onboarding:** Proprietary biometric mapping to align training protocols with performance intent.
*   **High-Fidelity Dashboard:** Real-time tracking of training streaks, volume trends, and active program progress.
*   **Real-Time Workout Logger:** A tactile, mobile-first session interface with optimistic updates and haptic feedback.
*   **Secure Checkout:** Integrated Stripe Checkout for instant access to premium protocols.

### **For Administrators**
*   **Network CMS:** Manage landing page content (Hero, Campaigns, Features) dynamically.
*   **Quality Control:** A verification pipeline to vet and approve coaches entering the ecosystem.

---

## 🛠 Tech Stack

*   **Framework:** [Next.js 16 (React 19)](https://nextjs.org/) with Turbopack.
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Custom "Represent" Design System).
*   **Backend/Auth:** [Supabase](https://supabase.com/) (PostgreSQL, RLS Security, SSR Auth).
*   **Payments:** [Stripe API](https://stripe.com/) (Connect, Checkout, Webhooks).
*   **Icons:** [Lucide React](https://lucide.dev/).
*   **State Management:** React Query & Server Actions.

---

## 📂 Project Structure

```text
src/
├── app/              # Next.js App Router (Dashboard, Marketplace, API)
├── components/       # UI Library (Shadcn + Custom Landing Sections)
├── hooks/            # Custom React Hooks (useProfile, etc.)
├── lib/              # Shared utilities (Stripe, Supabase Clients)
├── services/         # Data Access Layer (Clean separation of DB logic)
├── types/            # Database and Application Type Definitions
└── supabase/         # SQL Migrations and Security Policies
```

---

## 🛠 Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/wolfitness.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env.local` with the following:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_key
    STRIPE_SECRET_KEY=your_stripe_key
    STRIPE_WEBHOOK_SECRET=your_webhook_secret
    NEXT_PUBLIC_APP_URL=http://localhost:3001
    ```
4.  **Database Migration:**
    Apply the SQL files in `supabase/migrations/` to your Supabase instance.
5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 📈 Next Steps (Roadmap)

### **Phase 2: Signal Intelligence**
*   **Bio-Sync:** Integrate real-time heart rate and effort metrics from wearable devices.
*   **Signal Intel:** Implement the "Daily Signal" algorithm to adjust workout intensity based on recovery data.

### **Phase 3: Community & Scale**
*   **Direct Messaging:** Secure communication channel between coaches and athletes.
*   **Global Exercise Library:** Expansion of the movement database with 4K cinematic demonstrations.
*   **Mobile App:** Wrapping the experience for iOS and Android via Capacitor.

---

## 🎨 Design Philosophy
The UI follows the **Represent Style**:
*   **Radius:** 0px (Strict sharp corners).
*   **Palette:** Monochrome (Black, White, Slate).
*   **Typography:** Bold, Uppercase, Italicized headers for a sense of urgency and speed.

---

&copy; 2026 WOLFITNESS. The Global Mastery Network.
