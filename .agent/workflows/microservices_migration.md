---
description: Microservices Migration Plan - Advanced
---

# Microservices Migration Phase 1: Infrastructure & Services

This plan converts the Monolith into a fully containerized Microservices architecture.

## Architecture

| Service | Port | Description | DB Name |
| :--- | :--- | :--- | :--- |
| **API Gateway (Nginx)** | 8080 | Routes traffic to services | N/A |
| **Auth Service** | 8001 | Users, Login, Registration | `db_auth` |
| **User Service** | 8002 | User Profiles, Dashboard Stats | `db_user` |
| **Company Service** | 8003 | Companies, Buses, Routes, Drivers | `db_company` |
| **Ticketing Service** | 8004 | Tickets, Booking, Search | `db_ticketing` |
| **QR Service** | 8005 | QR Generation & Verification | `db_qr` |
| **Payment Service** | 8006 | Payments | `db_payment` |

## Infrastructure

-   **Docker Compose**: Orchestrates all services + PostgreSQL + Redis.
-   **PostgreSQL**: Single container, multiple databases (or schemas).
-   **Redis**: For async events (RabbitMQ alternative for simpler setup, or we use RabbitMQ if strictly requested).
-   **Nginx**: Reverse proxy.

## Implementation Steps (Iterative)

1.  **Scaffold Repository Structure**: Create `services/` folder with sub-folders for each service.
2.  **Shared Library**: Create `common/` for shared Auth middleware, Logging, and Database utils.
3.  **Auth Service**: Migrate `login_router.py` logic.
4.  **Company Service**: Migrate Companies/Buses/Routes logic.
5.  **User Service**: Migrate User management.
6.  **Ticketing Service**: Migrate Ticket logic.
7.  **QR Service**: Extract QR logic.
8.  **API Gateway**: Configure Nginx.
9.  **Dockerize**: Create `Dockerfile` for each service and root `docker-compose.yml`.

## Execution Plan (Immediate)

1.  **Create Directory Structure**:
    ```
    /services
      /auth-service
      /user-service
      /company-service
      /ticketing-service
      /qr-service
      /payment-service (already planned)
    /common (shared code)
    /gateway (nginx config)
    ```
2.  **Define Shared Library**: Establish `common/` for consistent JWT handling and DB connection.
3.  **Migrate Auth Service First**: It's the dependency for everything else.
// turbo-all
