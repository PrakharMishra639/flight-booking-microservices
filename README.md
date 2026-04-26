# Smart Airline Booking & Seat Management System
## Microservices Architecture

### Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │ Port 5173
│  (Vite + Tailwind)  │
└─────────┬───────────┘
          │ HTTP / WebSocket
          ▼
┌─────────────────────┐
│    API GATEWAY      │ Port 4000
│  JWT Auth + Proxy   │
│  WebSocket Proxy    │
└─────────┬───────────┘
          │
    ┌─────┼─────┬──────┬──────┬──────┬──────┬──────┬──────┐
    ▼     ▼     ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│ Auth ││ User ││Flight││ Seat ││Book- ││Price ││Notif ││Analy │
│:4001 ││:4002 ││:4003 ││:4004 ││:4005 ││:4006 ││:4007 ││:4008 │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
    │       │       │       │       │       │       │       │
    └───────┴───────┴───┬───┴───────┴───────┴───────┴───────┘
                        ▼
              ┌──────────────────┐
              │  MySQL (Shared)  │
              │  Redis  │ MongoDB│
              └──────────────────┘
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 4000 | Entry point, JWT auth, rate limiting, WebSocket proxy |
| Auth Service | 4001 | Login, register, OTP, OAuth, token management |
| User Service | 4002 | User CRUD, profile management |
| Flight Service | 4003 | Flight search, graph traversal, airline/airport CRUD |
| Seat Service | 4004 | Seat maps, Redis locks, Socket.IO real-time |
| Booking Service | 4005 | Bookings, payments (Stripe), check-in |
| Pricing Service | 4006 | Fare calculation, class multipliers |
| Notification Service | 4007 | Email, PDF e-tickets, boarding passes |
| Analytics Service | 4008 | Dashboard stats, admin operations |

### Prerequisites

- **Node.js** >= 18
- **MySQL** 8.x
- **Redis** 6.x+
- **MongoDB** (Atlas or local)

### Quick Start

```bash
# 1. Make startup script executable
chmod +x services.sh

# 2. Install all dependencies
./services.sh install

# 3. Seed the database (uses existing monolith seeder)
cd flight-booking-backend && node seed.js

# 4. Start all microservices
./services.sh start

# 5. Start frontend
cd frontend && npm run dev

# 6. Open http://localhost:5173
```

### Service Management

```bash
./services.sh install   # Install npm deps for all services
./services.sh start     # Start all services
./services.sh stop      # Stop all services
./services.sh restart   # Restart all services
./services.sh health    # Check health of all services
```

### API Routes

All routes go through the API Gateway at `http://localhost:4000`:

```
POST /api/auth/login              → auth-service
POST /api/auth/register           → auth-service
GET  /api/search?source=DEL&...   → flight-service
GET  /api/seats/schedule/:id      → seat-service
POST /api/booking/create          → booking-service
POST /api/payment/initiate        → booking-service
POST /api/checkin/lookup          → booking-service
GET  /api/admin/dashboard         → analytics-service
```

### Inter-Service Communication

Services communicate via REST (HTTP/Axios):

```
booking-service ──→ seat-service     (lock/confirm seats)
booking-service ──→ pricing-service  (calculate fares)
booking-service ──→ notification     (send emails)
booking-service ──→ flight-service   (schedule details)
auth-service    ──→ user-service     (CRUD users)
analytics       ──→ flight-service   (admin CRUD)
analytics       ──→ user-service     (user management)
flight-service  ──→ seat-service     (availability counts)
flight-service  ──→ pricing-service  (class multipliers)
```

### Test Credentials

```
Admin:  superadmin@flightbooking.com / SuperAdmin@123
User:   john@example.com / User@123
```

### Environment Variables

Each service has its own `.env` file. Key variables:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL connection
- `REDIS_HOST`, `REDIS_PORT` — Redis for caching and seat locks
- `JWT_SECRET` — Shared JWT signing key
- `STRIPE_SECRET_KEY` — Stripe payments (booking-service)
- `SMTP_*` — Email configuration (auth/notification services)
