# LOBI – MVP

### Core Objective

Provide a **simple digital system for managing residential buildings**, where **managers can handle payments and residents can track their obligations**, all through a **phone-number-based login without passwords**.

---

# User Types

### 1️⃣ Admin

System-level operator.

Capabilities:

- Create buildings
- Create managers
- Access all buildings
- Manage system data

Admin is mainly for **initial setup and support**.

---

### 2️⃣ Building Manager

Responsible for managing **one building**.

Capabilities:

- Manage apartments in the building
- Add residents to apartments
- Create and manage payments (maintenance, fees, etc.)
- Track which residents paid
- View building payment status

Manager is the **main operational user**.

---

### 3️⃣ Resident

A tenant or apartment owner.

Capabilities:

- View their apartment
- View required payments
- See payment history
- Possibly mark payment as paid / upload proof (depending on scope)

Resident is the **consumer side of the system**.

---

# Core MVP Features

## 1️⃣ Authentication

- Login via **phone + OTP**
- User selects **context (Manager / Resident / Admin)** if multiple roles exist
- JWT session created

---

## 2️⃣ Building Management (Admin)

Admin can:

- Create buildings
- Assign managers

---

## 3️⃣ Apartment Management (Manager)

Manager can:

- Create apartments in the building
- View apartments
- Assign residents to apartments

---

## 4️⃣ Resident Management (Manager)

Manager can:

- Add residents by phone
- Connect them to apartments
- View residents in building

---

## 5️⃣ Payments (Manager)

Manager can:

- Create building payments
- Assign them to apartments
- Track payment status

Example:

```
Payment: March MaintenanceAmount: 120₪Apartments: all
```

---

## 6️⃣ Payment Visibility (Resident)

Residents can:

- See payments they owe
- See past payments
- See payment status

---

# Typical MVP Flow

### Manager Setup

1. Admin creates building
2. Admin creates manager
3. Manager logs in
4. Manager creates apartments
5. Manager adds residents

---

### Monthly Operation

1. Manager creates payment
2. Residents see payment
3. Residents pay
4. Manager tracks payments