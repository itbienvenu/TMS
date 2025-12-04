# Ticketing System - Setup & Testing Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (or SQLite for development)
- .NET 8.0 SDK (for Company Dashboard)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file with:
# SECRET_KEY=your-secret-key-here
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=1440
# TICKET_SECRET_KEY=your-ticket-secret-key
# DATABASE_URL=postgresql://user:password@localhost/ticketing
# GMAIL_SMTP_USER=your-email@gmail.com
# GMAIL_SMTP_PASSWORD=your-app-password

# Seed the database
python seed_database.py

# Run the backend
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`
API Documentation: `http://localhost:8000/documentation`

### 2. Frontend Setup

```bash
cd frontend-react

# Install dependencies
npm install

# Run the frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown)

### 3. Company Dashboard Setup (.NET)

```bash
cd companies

# Restore packages
dotnet restore

# Run the application
dotnet run
```

## 📋 Test Credentials

After running `seed_database.py`, you can use these credentials:

### Regular Users (Customer Portal - Frontend)
- **Email:** `john.doe@example.com`
- **Password:** `password123`

- **Email:** `jane.smith@example.com`
- **Password:** `password123`

### Company Users (Company Dashboard)
- **Company:** Express Bus Lines
- **Login Email:** `admin@expressbus.com`
- **Password:** `password123`
- **OTP Email:** `alice@expressbus.com` (where OTP will be sent)

- **Company:** Comfort Travel
- **Login Email:** `admin@comforttravel.com`
- **Password:** `password123`
- **OTP Email:** `bob@comforttravel.com` (where OTP will be sent)

### Super Admin
- **Login Email:** `admin@ticketing.com`
- **Password:** `password123`
- **OTP Email:** `superadmin@ticketing.com` (where OTP will be sent)

## 🧪 Testing the System

### 1. Test Customer Flow (Frontend)

1. **Register/Login**
   - Go to `http://localhost:5173/register`
   - Or login with test credentials

2. **Book a Ticket**
   - Navigate to "Book Ticket" in the sidebar
   - Select a route (e.g., "Gare du Nord → Gare du Sud")
   - Select tomorrow's date
   - Click "Search"
   - Select a schedule and click "Book Now"

3. **Make Payment**
   - After booking, you'll be redirected to payment page
   - Enter phone number
   - Select payment provider (Mobile Money or Tigo Cash)
   - Click "Pay"

4. **View Tickets**
   - Go to "My Tickets" to see your booked tickets
   - View QR codes for boarding

### 2. Test Company Dashboard

1. **Login**
   - Open the Company Dashboard application
   - Enter login email: `admin@expressbus.com`
   - Enter password: `password123`
   - Check email for OTP code
   - Enter OTP to complete login

2. **Manage Resources**
   - View buses, routes, schedules, stations
   - Create new resources
   - View tickets and payments

### 3. Test Backend API

Use the interactive API docs at `http://localhost:8000/documentation`

**Example API Calls:**

```bash
# Login as regular user
curl -X POST "http://localhost:8000/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password_hash": "password123"}'

# Search schedules
curl "http://localhost:8000/api/v1/schedules/search?route_id=route-001&date=2024-01-15"

# Book a ticket (requires auth token)
curl -X POST "http://localhost:8000/api/v1/tickets/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-001",
    "bus_id": "bus-001",
    "route_id": "route-001",
    "schedule_id": "schedule-001"
  }'
```

## 🗄️ Database Schema

The seed script creates:
- **2 Companies** (Express Bus Lines, Comfort Travel)
- **2 Regular Users** (John Doe, Jane Smith)
- **3 Company Users** (2 company admins + 1 super admin)
- **5 Bus Stations**
- **3 Routes**
- **3 Route Segments**
- **3 Buses**
- **4 Schedules** (for tomorrow)
- **2 Sample Tickets**
- **1 Sample Payment**

## 🔧 Troubleshooting

### Backend Issues

1. **Database connection error**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Or use SQLite by changing DATABASE_URL

2. **Import errors**
   - Make sure you're in the `backend` directory
   - Check that all dependencies are installed

3. **OTP email not sending**
   - Verify GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD in .env
   - Use Gmail App Password (not regular password)

### Frontend Issues

1. **API connection error**
   - Check that backend is running on port 8000
   - Verify API base URL in `frontend-react/src/api/axios.ts`

2. **CORS errors**
   - Backend CORS is configured to allow all origins
   - Check backend logs for CORS issues

### Company Dashboard Issues

1. **API connection error**
   - Update `Config/ApiConfig.cs` with correct backend URL
   - Default is `http://localhost:8000`

## 📝 Notes

- All passwords in seed data are: `password123`
- Schedules are created for tomorrow's date
- QR codes are generated with HMAC signatures
- Payment webhook endpoint is at `/api/v1/payments/webhook`
- Super admin endpoints are at `/api/v1/admin/*`

## 🎯 Next Steps

1. **Configure Email** - Set up Gmail SMTP for OTP delivery
2. **Payment Integration** - Connect real payment providers
3. **Deploy** - Deploy backend, frontend, and company dashboard
4. **Add Features** - Implement seat selection, PDF receipts, etc.

## 📞 Support

For issues or questions, check the codebase documentation or create an issue.

