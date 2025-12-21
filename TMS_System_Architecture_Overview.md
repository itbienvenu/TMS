# System Architecture Overview: Transport Management System (TMS)

**Document Version:** 1.0  
**Target Audience:** Backend Engineers, System Architects, DevOps  
**Purpose:** High-level technical understanding of the system topology, boundaries, and data flow.

---

## 1. Architectural Pattern

The TMS uses a **Microservices Architecture**. The system is decomposed into vertical business domains (e.g., Ticketing, Payments, Fleet), each managed by an isolated service.

*   **Communication:**
    *   **Synchronous:** HTTP/REST (FastAPI) for direct client requests.
    *   **Asynchronous:** AMQP (RabbitMQ) for inter-service consistency and event propagation.
    *   **Real-time:** WebSockets & Redis Pub/Sub for fleet tracking.
*   **Storage:** Per-service logical isolation (logical separation within shared PostgreSQL instance for simplicity in current deployment, but architecturally distinct).
*   **Infrastructure:** Containerized (Docker), orchestrated via Docker Compose (support for K8s).

---

## 2. System Topology

### 2.1 The Entry Point (API Gateway)
*   **Component:** Nginx Reverse Proxy
*   **Role:** Single ingress point for all external traffic.
*   **Responsibilities:**
    *   SSL Termination.
    *   Path-based routing (e.g., `/api/v1/auth` -> Auth Service).
    *   Static content serving for Web Frontend.
    *   CORS handling.

### 2.2 Core Backend Services (Python/FastAPI)

| Service | Responsibility | Key Interactions |
| :--- | :--- | :--- |
| **Auth Service** | Identity Provider (IdP). Issues/Verifies JWTs. Manages RBAC. | All services (via Token Validation). |
| **Company Service** | **Domain Core.** Manages Fleets, Routes, Stops, Schedules, and Driver assignments. | Publishes `ScheduleCreated`; Consumes `BusLocationUpdated`. |
| **Ticketing Service** | Inventory/Sales. Handles Booking locking, Seat selection, and QR generation. | Publishes `TicketSold`; Calls `PaymentService` for status. |
| **Payment Service** | Financial Transaction Processor. Handles Mobile Money/PayPal integrations. | Publishes `PaymentSuccess`; Consumes `TicketLocked`. |
| **Notification Service** | **Event Consumer.** Sends SMS/Emails based on system events. | Consumes `TicketSold`, `TripCancelled`. |
| **Tracking Service** | Real-time GPS ingest and broadcasting. | WebSockets to Clients; Redis Geospatial Index. |
| **AI Service** | LLM Integration (Google Gemini) for natural language queries. | Read-only access to DB schemas for SQL generation. |
| **QR Service** | Cryptographic verification of ticket validity. | Isolated for security/performance. |

### 2.3 Data & Infrastructure Layer

*   **Message Broker (RabbitMQ):**
    *   Decouples services.
    *   Examples: `PaymentService` emits `payment.confirmed` -> `TicketingService` finalizes ticket -> `NotificationService` SMS.
*   **In-Memory Store (Redis):**
    *   **Caching:** Frequently accessed Route/Schedule data.
    *   **Distributed Locking:** Prevents double-booking of seats (`SETNX`).
    *   **Geospatial:** Stores live bus coordinates.
*   **Database (PostgreSQL):**
    *   Relational persistence. Heavily relies on Foreign Keys and ACID transactions within service boundaries.

---

## 3. Data Flow Diagrams (Conceptual)

### 3.1 Flow: Ticket Booking (Sync + Async)
1.  **Client** requests seat lock -> **Gateway** -> **Ticketing Service**.
2.  **Ticketing Service** acquires Redis Lock on `seat_id`.
3.  **Client** initiates payment -> **Payment Service**.
4.  **Payment Service** confirms transaction -> Publishes `PaymentSuccess` to RabbitMQ.
5.  **Ticketing Service** consumes event -> Updates DB status to `CONFIRMED`.
6.  **Notification Service** consumes event -> Sends SMS to User.

### 3.2 Flow: Live Fleet Tracking
1.  **Driver App** captures GPS -> POSTs to **Tracking Service**.
2.  **Tracking Service** updates `bus:{id}:geo` in Redis.
3.  **Web Client** (via WebSocket) subscribes to `trip:{id}`.
4.  **Tracking Service** pushes updates from Redis to WebSocket subscribers.

---

## 4. Client Ecosystem

The architecture supports multiple diverse clients, all consuming the same REST APIs.

1.  **Public Web Portal (React):** SEO-optimized, customer-facing booking engine.
2.  **Super Admin Dashboard (React/MUI):** Platform-wide analytics and tenancy management.
3.  **Company Operations (Desktop .NET/Avalonia):** Cross-platform desktop app for heavy duty scheduling and fleet management (offline capable).
4.  **Driver App (React Native):** Focused interface for Trip Start/Stop and QR Scanning.
5.  **POS App (React Native):** High-throughput, offline-first ticket sales for agents.

---

## 5. External Integrations

*   **Google Gemini (AI):** Used for Natural Language Processing in the Chat Assistant.
*   **Payment Gateways:** Interface for Mobile Money (M-Pesa, MTN) and PayPal.
*   **SMS Gateway:** Cloud provider integration for outbound messaging.

---

## 6. Deployment Model

*   **Current State:** Docker Compose monolith on a single Virtual Machine (AWS/Azure).
    *   Port 80/443 exposed via Nginx.
    *   Services communicate on internal Docker bridge network.
*   **Scalability Path:**
    *   Stateful components (Postgres, Redis, RabbitMQ) moved to managed cloud services (RDS, ElastiCache).
    *   Stateless services (Python containers) migrated to Kubernetes (EKS/AKS) or Serverless (Cloud Run).

---

## 7. Key Engineering Constraints & Decisions

*   **Synchronization:** Offline-first clients (POS) sync via batch endpoints when connectivity is restored. Conflict resolution favors the Server.
*   **Consistency:** "At least once" delivery via RabbitMQ. Idempotency keys required for all critical mutations (Payments, Booking).
*   **Security:** Services do not trust each other implicitly; JWTs are passed and validated at each boundary (Zero Trust principles).

---
