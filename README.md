# 🚌 Modern Public Transport Ticketing System

A scalable, robust, and microservices-based platform designed to digitize and streamline public transport operations. This ecosystem connects passengers, bus operators, drivers, and platform administrators through a unified suite of web, mobile, and desktop applications.

## 🚀 Overview

This project is a full-stack solution for inter-city bus ticketing. It handles everything from route scheduling and seat management to ticket booking, payments, and real-time QR code validation. Built with scalability in mind, it utilizes a containerized microservices architecture to ensure distinct separation of concerns and easy deployment.

## 🏗 System Architecture

The system follows a **Microservices Architecture** orchestrated by **Docker** and routed via an **Nginx API Gateway**.

### Core Microservices (Python/FastAPI)
*   **🛡️ Auth Service**: Handles JWT authentication, OTP verification (email), and Role-Based Access Control (RBAC).
*   **🏢 Company Service**: Manages transport operators, fleet (buses), routes, stations, schedules, and drivers.
*   **🎫 Ticketing Service**: Manages booking workflows, seat reservations, and ticket generation.
*   **📱 QR Service**: Generates secure QR codes for tickets and handles validation logic.
*   **💳 Payment Service**: Processes payments (Mobile Money/Cards) and transaction records.
*   **👥 User Service**: Manages customer profiles and booking history.
*   **🔐 Super Admin Service**: Platform-level management for onboarding new companies and oversight.
*   **🤖 AI Service**: An intelligent chat assistant powered by LLMs (OpenAI/Gemini) to assist users and admins.

## 💻 Client Applications

The ecosystem includes specialized interfaces for different stakeholders:

1.  **🌐 Customer Web Portal**:
    *   *Tech Stack:* **React, Vite, TypeScript**
    *   Allows passengers to search routes, view schedules, book seats, and pay online.
2.  **🖥️ Company Dashboard**:
    *   *Tech Stack:* **.NET 8, C#, AvaloniaUI**
    *   A powerful cross-platform desktop application for bus companies to manage their fleet, staff, and schedules.
3.  **📱 Driver Mobile App**:
    *   *Tech Stack:* **React Native, Expo**
    *   Empowers drivers to scan passenger tickets (QR codes) and view trip details on the go.
4.  **⚡ Super Admin Dashboard**:
    *   *Tech Stack:* **React**
    *   Centralized control panel for system administrators.

## 🛠️ Technology Stack

*   **Backend Framework:** FastAPI (Python)
*   **Database:** PostgreSQL (SQLAlchemy ORM)
*   **Gateway:** Nginx
*   **Containerization:** Docker & Docker Compose
*   **Authentication:** OAuth2 with JWT & OTP
*   **Version Control:** Git

## ✨ Key Features

*   **Dynamic Routing & Scheduling**: Flexible route segment pricing and automated scheduling.
*   **Real-time Availability**: Locking mechanism to prevent double-booking of seats.
*   **Secure Validation**: Cryptographic QR code generation for offline-capable ticket verification.
*   **AI-Powered Support**: Integrated natural language processing for customer queries.
*   **Multi-Tenancy**: Designed to host multiple independent bus companies on a single platform.

---

## 🚀 Installation & Getting Started

Follow these instructions to set up the system locally.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
*   [Node.js](https://nodejs.org/) (Client apps).
*   [.NET SDK 8.0](https://dotnet.microsoft.com/download) (Company Dashboard).
*   Git.

### 1. Clone the Repository
```bash
git clone https://github.com/IkobeProject/ticketing-system.git
cd ticketing-system
```

### 2. Environment Setup
The project uses environment variables for sensitive data. Create a `.env` file in the root directory:

```bash
# Example .env configuration
DATABASE_URL=postgresql://itbienvenu:123@postgres:5432/ticketing_system
POSTGRES_USER=itbienvenu
POSTGRES_PASSWORD=123
SECRET_KEY=supersecretkey
JWT_SECRET=supersecretkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (Optional for local dev)
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### 3. Start the Backend Infrastructure
Launch all microservices, databases, and the gateway using Docker Compose:

```bash
docker-compose up --build -d
```
*Wait for a few minutes for the database to initialize and services to become healthy.*

### 4. Seed Initial Data
Populate the database with a default Admin, a sample Bus Company (KBS), stations, and a driver.

```bash
# Run this temporary container to execute the seed script
docker-compose run --rm --entrypoint "" \
  -v $(pwd):/workspace \
  -w /workspace \
  -e PYTHONPATH=/workspace \
  auth-service \
  bash -c "pip install sqlalchemy psycopg2-binary passlib bcrypt && python scripts/seed.py"
```

### 5. Run Client Applications

**Customer Web Frontend**
```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:5173
```

**Driver Mobile App**
```bash
cd driver-mobile
npm install
npx expo start
# Scan QR code with Expo Go app
```

**Company Dashboard (Desktop)**
```bash
cd companies
dotnet run
```

### 📡 API Access
The Nginx Gateway routes all traffic. You can access the unified API at:
*   **Base URL:** `http://localhost:8000/api/v1`
*   **Swagger Docs:** Currently, individual services have their own docs, e.g., `http://localhost:8001/docs` (Auth), `http://localhost:8003/docs` (Company), etc.

---
*Developed by the [MWIMULE Bienvenu]*
