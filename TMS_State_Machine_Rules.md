# State Machine and Business Rules

**Purpose:** Defines the rigorous logic governing the lifecycle of core business entities. These rules enforce data integrity and prevent operational chaos (e.g., selling tickets for a departed bus).

---

## 1. Trip (Schedule) Lifecycle
*Owner: Company Service*

A "Trip" represents a specific instance of a route (e.g., Kigali -> Huye at 08:00 AM on 25th Dec).

### 1.1 State Definitions
| State | Description | Sales Status |
| :--- | :--- | :--- |
| **DRAFT** | Created but not yet visible to public. | Closed |
| **PUBLISHED** | Live on the system. | **OPEN** |
| **BOARDING** | Bus is at the platform loading passengers. | **OPEN** (Last minute) |
| **DEPARTED** | Bus has left the terminal. | **CLOSED** |
| **COMPLETED** | Bus arrived at destination. | Closed |
| **CANCELLED** | Trip aborted (Weather, Breakdown). | Closed |

### 1.2 Transition Rules
| From | To | Trigger / Actor | Condition |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `PUBLISHED` | Scheduler (Admin) | Bus and Driver must be confirmed. |
| `PUBLISHED` | `BOARDING` | Time Auto-trigger OR Driver | 30 mins before dep time. |
| `BOARDING` | `DEPARTED` | Driver (App) | "Start Trip" button pressed. |
| `DEPARTED` | `COMPLETED` | Driver (App) | "End Trip" button pressed. |
| `PUBLISHED` | `CANCELLED` | Supervisor | Must trigger Refund flow. |
| `DEPARTED` | `CANCELLED` | **BLOCKED** | Cannot cancel a moving bus (Use "Breakdown" flow instead). |

---

## 2. Ticket Lifecycle
*Owner: Ticketing Service*

A "Ticket" represents the right to occupy a specific seat.

### 2.1 State Definitions
| State | Description |
| :--- | :--- |
| **LOCKED** | Temporarily held while user attempts payment (TTL: 5-10 mins). |
| **BOOKED** | Payment confirmed. Ticket is valid. |
| **USED** | Passenger has successfully boarded. |
| **EXPIRED** | User failed to pay within the lock time. Seat released. |
| **CANCELLED** | User requested refund or Trip was cancelled. |

### 2.2 Transition Rules
| From | To | Trigger | Consistency Check |
| :--- | :--- | :--- | :--- |
| *(Null)* | `LOCKED` | Customer/Agent | **Strict:** Redis Mutex Lock on `seat_id`. Atomic check. |
| `LOCKED` | `BOOKED` | Payment Webhook | Verify `payment_status == SUCCESS`. |
| `LOCKED` | `EXPIRED` | System Cron / TTL | If time > 10 mins and no payment. |
| `BOOKED` | `USED` | Driver App | Scan QR Code. Bus must not be `COMPLETED`. |
| `USED` | `BOOKED` | **BLOCKED** | Cannot "un-use" a ticket (prevents fraud). |
| `BOOKED` | `CANCELLED` | Customer | Only if Trip status is `PUBLISHED` (not `DEPARTED`). |

---

## 3. Payment Lifecycle
*Owner: Payment Service*

### 3.1 State Definitions
| State | Description |
| :--- | :--- |
| **PENDING** | Initial state. Waiting for user to enter PIN (Mobile Money) or approve. |
| **SUCCESS** | Provider confirmed receipt of funds. |
| **FAILED** | Provider rejected (Insufficient funds, timeout). |
| **REFUNDED** | Money returned to user. |

### 3.2 Transition Rules
*   **Idempotency:** A Payment ID can strictly transition to `SUCCESS` or `FAILED` **only once**. Subsequent webhooks for the same ID are ignored.

---

## 4. Operational Invariants (The "Golden Rules")

These rules are enforced by code constraints and database constraints.

1.  **The Physics of Time:** A ticket cannot be sold for a Trip in state `DEPARTED`, `COMPLETED`, or `CANCELLED`.
2.  **The Physics of Space:** `Tickets Sold` <= `Bus Capacity`. The system prevents "Standing Room" sales unless explicitly configured.
3.  **One Butt, One Seat:** A specific seat (e.g., "A1") cannot have two active `BOOKED` tickets for the same Trip ID. Uniqueness Constraint in Database.
4.  **Driver License:** A driver cannot be assigned to a trip if their backend status is `SUSPENDED` or `EXPIRED_LICENSE`.
5.  **Vehicle Availability:** A bus cannot be assigned to two overlapping trips. (e.g., Trip A ends at 10:00, Trip B starts at 09:00 with the same bus -> **REJECTED**).

---

## 5. Conflict Resolution Strategy

*   **Online vs Offline Sales:**
    *   Scenario: Online user buys Seat 4. Simultaneously, Offline POS (no internet) sells Seat 4.
    *   Resolution: When POS syncs, the server rejects the Offline sale.
    *   Action: Agent must issue a refund or move passenger to another seat. **Server is Authority.**
*   **Race Conditions:**
    *   Scenario: Two online users click "Buy" on Seat 5 at the exact same millisecond.
    *   Resolution: Redis `SETNX` (Set if Not Exists) is used. The first request wins the lock. The second request receives `409 Conflict` ("Seat taken").
