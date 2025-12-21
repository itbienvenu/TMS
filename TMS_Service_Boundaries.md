# Service Responsibility and Boundary Definition

**Target Audience:** Backend Developers, Architects  
**Goal:** Enforce loose coupling and high cohesion by strictly defining service boundaries.

---

## 1. Core Philosophy
*   **Share Nothing:** Services must not share database schemas or tables.
*   **Interact via Interfaces:** All communication must occur via public APIs (REST) or Domain Events (RabbitMQ).
*   **Single Responsibility:** A service should have one reason to change.

---

## 2. Service Definitions

### 2.1 Auth Service (`/services/auth-service`)
*   **Role:** Identity Provider (IdP).
*   **Owns:**
    *   User Credentials (Password hashes).
    *   JWT Issuance & Signing Keys.
    *   Role Definitions (RBAC).
*   **Does NOT Own:**
    *   User Profiles (Addresses, Preferences) -> *User Service*.
    *   Driver Licenses -> *Company Service*.
*   **Boundary Rule:** If it involves verifying *who* someone is, it belongs here. If it involves *what* they are doing, it is elsewhere.

### 2.2 Company Service (`/services/company-service`)
*   **Role:** Domain Core / Fleet Management.
*   **Owns:**
    *   Company Metadata.
    *   Assets (Buses, physical layout).
    *   Topography (Routes, Stops).
    *   Planning (Schedules, Trips).
*   **Does NOT Own:**
    *   Ticket Inventory (Seat locking) -> *Ticketing Service*.
    *   Live GPS Data -> *Tracking Service*.
*   **Boundary Rule:** This service defines the *static* and *planned* world. It does not handle the *transactional* selling of that world.

### 2.3 Ticketing Service (`/services/ticketing-service`)
*   **Role:** Sales & Inventory engine.
*   **Owns:**
    *   Ticket Records (Status: Reserved, Paid, Used).
    *   Seat Inventory (Row-level locking).
    *   Pricing Logic (Fare calculation).
*   **Does NOT Own:**
    *   Payment Gateways -> *Payment Service*.
    *   Bus Capacity Definition -> *Company Service*.
*   **Boundary Rule:** This is the "Cash Register" logic. It cares about filling seats, not about the bus engine.

### 2.4 Payment Service (`/services/payment-service`)
*   **Role:** Financial Processor.
*   **Owns:**
    *   Transactions (Records of money movement).
    *   Integrations (M-Pesa, Stripe, PayPal).
    *   Idempotency Keys (Preventing double-charge).
*   **Does NOT Own:**
    *   Order Fulfillment (Delivering the ticket).
*   **Boundary Rule:** It answers one question: "Did we get the money?" It should be agnostic to *what* was bought.

### 2.5 Notification Service (`/services/notification-service`)
*   **Role:** Communication Gateway.
*   **Owns:**
    *   Message Templates (SMS, Email).
    *   Provider Integration (Twilio/AWS SNS).
    *   Delivery Logs.
*   **Does NOT Own:**
    *   Business Logic (Deciding *when* to send).
*   **Boundary Rule:** Dumb pipe. It receives a command "Send X to Y" and executes. It does not decide functionality.

### 2.6 Tracking Service (`/services/tracking-service`)
*   **Role:** Telemetry & Geospatial.
*   **Owns:**
    *   WebSocket Connections (Live stream).
    *   Redis Geospatial Index.
    *   Trip History (Breadcrumbs).
*   **Does NOT Own:**
    *   Schedule adherence logic (Comparing planned vs actual) - *Shared responsibility, but storage is here.*

---

## 3. Communication Patterns

### 3.1 Synchronous (REST API)
*   **Use when:** The client needs an immediate answer or the operation is a localized query.
*   **Example:** `GET /trips/{id}` (Frontend asks Company Service).
*   **Constraint:** Avoid Service-to-Service HTTP chains (Service A calls B, B calls C). This creates latency spikes and brittleness.

### 3.2 Asynchronous (Event-Driven)
*   **Use when:** An action in one domain triggers side effects in others.
*   **Pattern:** Publisher/Subscriber via RabbitMQ.
*   **Example:**
    *   Payment Service: *Publishes* `PaymentSuccess`.
    *   Ticketing Service: *Subscribes* -> Issues Ticket.
    *   Notification Service: *Subscribes* -> Sends Receipt.

---

## 4. Anti-Patterns (Strictly Forbidden)

### 4.1 The "Shared Database"
*   **Violation:** Service A querying Service B's tables directly.
*   **Why:** Tighly couples schemas. If B changes a column, A breaks.
*   **Fix:** Service B must expose an API or publish data changes via events.

### 4.2 The "God Service"
*   **Violation:** Putting everything into `Company Service` because "it's easier".
*   **Why:** Creates a monolith that is hard to scale and deploy.
*   **Fix:** Continually refactor. If `Company Service` starts handling payments, extract it.

### 4.3 "Distributed Monolith"
*   **Violation:** Services that are physically valid but logically coupled (e.g., they must be deployed together).
*   **Why:** Defeats the purpose of microservices.
*   **Fix:** Ensure API versioning and backward compatibility.

---
