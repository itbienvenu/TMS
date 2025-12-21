# Operations Manual: Transport Management System

**Version:** 1.0  
**Target Audience:** Operations Supervisors, Station Agents, Drivers, and Managers.

---

## 1. Introduction
This manual provides step-by-step instructions for the daily use of the Transport Management System (TMS). It is designed to help your team manage trips, sell tickets, and oversee fleet operations efficiently.

## 2. Getting Started
*   **Station Agents:** You will use the **POS Tablet** or **Desktop Computer** at the counter.
*   **Drivers:** You will use the **Driver Mobile App** on your smartphone.
*   **Supervisors/Managers:** You will use the **Web Dashboard** or **Company Desktop System** in the office.

**Login:** Always use your own unique username and password. Never share accounts.

---

## Part 1: Trip Planning & Scheduling (Supervisors)
*Responsibility: Operations Manager / Scheduler*

Before tickets can be sold, trips must be created in the system.

### 1.1 Creating a Schedule
1.  Log in to the **Company Desktop System**.
2.  Navigate to the **Schedules** section.
3.  Click **"Add New Trip"**.
4.  **Select Route:** Choose the origin and destination (e.g., "City A to City B").
5.  **Set Date & Time:** Select the departure date and exact time.
6.  **Assign Vehicle:** Select a bus from the dropdown list. *Note: Only active, available buses will appear.*
7.  **Assign Driver:** Select the primary driver for this trip.
8.  **Publish:** Click **"Save & Publish"**.
    *   *Result:* The trip is now visible to all sales agents and online customers. Tickets can be sold immediately.

---

## Part 2: Issuing Tickets (Station Agents)
*Responsibility: Ticket Agents / Cashiers*

### 2.1 Selling a Ticket (Standard Sale)
1.  Open the **POS Application**.
2.  **Find the Trip:** Ask the passenger for their destination and preferred time. Select the matching trip from the list.
3.  **Select Seat:** The screen shows a layout of the bus.
    *   *Green Seats:* Available.
    *   *Red Seats:* Already sold.
    *   Tap a **Green Seat** to select it.
4.  **Enter Passenger Details:** Type the passenger’s Name and Phone Number. *Accurate phone numbers are crucial for SMS, significantly if the bus changes.*
5.  **Payment:**
    *   Select **"Cash"** if the customer is paying physically.
    *   Select **"Mobile Money"** to trigger a payment request to their phone.
6.  **Confirm:** Tap **"Complete Sale"**.
    *   *Result:* The system prints a ticket (if a printer is connected) or sends an SMS ticket to the passenger. The seat turns Red on all screens instantly.

---

## Part 3: Boarding & Trip Execution (Drivers)
*Responsibility: Drivers / Conductors*

### 3.1 Validation (Boarding)
*Never allow a passenger on board without scanning their ticket.*
1.  Open the **Driver App** on your phone.
2.  Select your assigned trip (e.g., "08:00 AM to City B").
3.  Tap **"Scan Ticket"**.
4.  Point the camera at the passenger’s QR code (on their phone or paper ticket).
    *   **Green Checkmark:** VALID. Allow boarding.
    *   **Red "X":** INVALID. Do not allow boarding. (Ticket may be fake, used, or for a different trip).

### 3.2 Starting the Trip
1.  Once all passengers are seated, verify the **"Passenger Count"** on your app matches the number of people on the bus.
2.  Tap **"Start Trip"**.
3.  The status changes to **"In Transit"**. Head office now sees your bus moving on the map.

### 3.3 Ending the Trip
1.  Upon arrival at the destination, tap **"End Trip"**.
2.  This frees up the bus and driver to be assigned to a new schedule.

---

## Part 4: Managing Exceptions (Supervisors)
*Responsibility: Operations Managers*

Things go wrong. Here is how to handle common issues without disrupting operations.

### 4.1 Bus Breakdown / Swapping Vehicles
*Scenario: Bus A is assigned to the 10:00 AM trip but has a flat tire. You need to switch to Bus B.*

1.  Go to the **Schedules** dashboard.
2.  Find the 10:00 AM trip. It may still be marked "Scheduled".
3.  Click **"Edit / Swap Bus"**.
4.  Select the new vehicle (**Bus B**) from the list.
5.  **Confirm Swap.**
    *   *The System Checks:* Does Bus B have enough seats for the tickets already sold? If yes, it proceeds.
    *   *Notification:* The system automatically updates the Driver App (Driver B now sees the trip) and sends SMS alerts to passengers if the plate number changes.

### 4.2 Cancelling a Trip
*Scenario: Extreme weather forces a cancellation.*

1.  Select the trip in the dashboard.
2.  Click **"Cancel Trip"**.
3.  System will ask for a **Reason** (e.g., "Weather").
4.  **Confirm.**
    *   All passengers receive a "Trip Cancelled" SMS.
    *   The tickets are flagged for "Refund/Reschedule" in the system.

---

## Part 5: End-of-Day Reporting
*Responsibility: Supervisors & Finance Team*

### 5.1 Reconciliation (Cashing Out)
At the end of a shift, every agent must balance their cash.

1.  Agent logs into the **Sales Report** section.
2.  Generate **"My Daily Sales"**.
3.  The system displays:
    *   *Total Cash Tickets Sold:* $550
    *   *Total Mobile Money Tickets:* $400
4.  **Action:** The agent must hand over exactly **$550** in cash to the supervisor.
5.  Supervisor marks the shift as **"Reconciled"** in the system.

### 5.2 Operational Review
manager checks the **Daily Summary Report**:
*   *Scheduled Trips:* 20
*   *Completed Trips:* 19
*   *Cancelled:* 1
*   *Total Revenue:* $15,000
*   *Average Occupancy:* 85%

Use this data to plan for tomorrow.

---

**Support:** If you encounter a technical error (e.g., "Network Error"), please contact the IT Support Desk immediately at [Insert Number].
