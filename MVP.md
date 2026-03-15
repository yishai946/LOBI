# LOBI – MVP

## Core Objective

Provide a **simple digital system for managing residential buildings**, enabling:

* **Managers** to operate building administration (payments, residents, announcements, issues)
* **Residents** to track obligations and communicate building problems

All authentication is done using **phone number + OTP**, with **no passwords required**.

The system focuses on **streamlining common building-management tasks** in a lightweight mobile-friendly interface.

---

# User Types

## 1️⃣ Admin

System-level operator responsible for **platform setup and oversight**.

Capabilities:

* Create buildings
* Assign managers to buildings
* View and manage all system data
* Access all buildings regardless of ownership

Admin is mainly used for **initial configuration and system administration**.

---

## 2️⃣ Building Manager

Responsible for **managing one building**.

This is the **primary operational role** in the system.

Capabilities:

* Manage apartments within the building
* Assign residents to apartments
* Create and manage building payments
* Track payment completion by residents
* View payment status across the building
* Send announcements/messages to residents
* View and manage issues reported by residents

Managers operate the **day-to-day administration of the building**.

---

## 3️⃣ Resident

A tenant or apartment owner living in the building.

Capabilities:

* View their apartment details
* View building announcements
* See required payments
* View payment history
* Pay assigned payments via checkout
* Report building issues
* Track status of reported issues

Residents primarily interact with the system to **stay informed and fulfill obligations**.

---

# Core MVP Features

## 1️⃣ Authentication

Authentication uses **phone-number-based login**.

Flow:

1. User enters phone number
2. System sends OTP
3. User verifies OTP
4. If user has multiple roles, they select a **session context**
5. A **JWT session** is created

Supported session types:

* Admin
* Manager
* Resident

Each session includes the necessary **context data** (building / apartment).

---

# 2️⃣ Building Management (Admin)

Admin can:

* Create buildings
* Assign managers to buildings
* View building information
* Manage system-level data

Buildings represent the **primary container for all data**.

---

# 3️⃣ Apartment Management (Manager)

Managers can manage apartments inside their building.

Capabilities:

* Create apartments
* View apartments
* Update apartment information
* Assign residents to apartments

Each apartment belongs to **one building**.

---

# 4️⃣ Resident Management (Manager)

Managers can manage residents in their building.

Capabilities:

* Add residents using phone number
* Assign residents to apartments
* View residents in the building
* Update or remove residents

Residents are linked to **both a user account and an apartment**.

---

# 5️⃣ Payments (Manager)

Managers can create **building payments** such as:

* Maintenance fees
* Repairs
* Shared services

Example:

Payment: March Maintenance
Amount: 120₪
Scope: All apartments in the building

When a payment is created:

* **Payment assignments are automatically generated** for every apartment in the building.

Managers can:

* View payment status per apartment
* Track who has paid
* Update or remove payments

---

# 6️⃣ Payment Visibility & Checkout (Resident)

Residents can:

* See payments assigned to their apartment
* View payment history
* Track payment status
* Pay using an integrated **checkout flow**

Payment status updates automatically when the **payment provider confirms completion**.

---

# 7️⃣ Resident Issue Reporting

Residents can report **building-related issues**.

Example issues:

* Water leak
* Elevator malfunction
* Electricity problem

Capabilities:

Resident:

* Create issue reports
* Add description and optional images
* Track issue status

Manager:

* View issues reported in the building
* Update issue status
* Manage building maintenance workflow

---

# 8️⃣ Building Announcements (Messages)

Managers can send **announcements to all residents in the building**.

Examples:

* Maintenance notices
* Water shutoff alerts
* Community updates

Residents can:

* View messages for their building
* Access message history

Admins can view all system messages.

---

# Typical MVP Flows

## Manager Setup Flow

1. Admin creates building
2. Admin assigns manager
3. Manager logs in
4. Manager creates apartments
5. Manager assigns residents to apartments

---

## Monthly Payment Flow

1. Manager creates payment
2. System generates assignments for all apartments
3. Residents see the payment
4. Residents pay through checkout
5. Manager monitors payment completion

---

## Issue Reporting Flow

1. Resident reports issue
2. Manager receives issue in dashboard
3. Manager updates issue status
4. Resident tracks progress

---

## Announcement Flow

1. Manager creates message
2. Message becomes visible to all residents in the building
3. Residents read building announcements
