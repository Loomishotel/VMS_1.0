# Enterprise Visitor Management System (VMS) — User Access Map

This document lists the credentials, roles, and branch locations of all default user accounts seeded in the PostgreSQL/Supabase database.

---
## 1. Branch-Specific User Directory (Seeded Locations)

### 1.1 Bangalore HQ (Silicon Valley HQ / Bangalore HQ)
* **Branch Timezone:** `Asia/Kolkata`

| Full Name | Role | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Prakash Raj** | Admin | `admin.blr@vms.local` | `Admin@123` |
| **Marcus Guard** | Security | `security.blr@vms.local` | `Security@123` |
| **Sarah Jenkins** | Employee | `sarah.j@vms.local` | `Employee@123` |
| **David Chen** | Employee | `david.c@vms.local` | `Employee@123` |
| **Emma Rodriguez** | Employee | `emma.r@vms.local` | `Employee@123` |
| **Robert Sterling** | Employee | `robert.s@vms.local` | `Employee@123` |
| **Lisa Monroe** | Employee | `lisa.m@vms.local` | `Employee@123` |

---

### 1.2 Mumbai Office
* **Branch Timezone:** `Asia/Kolkata`

| Full Name | Role | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Karan Johar** | Admin | `admin.mum@vms.local` | `Admin@123` |
| **Vijay Salgaonkar** | Security | `security.mum@vms.local` | `Security@123` |
| **Rahul Desai** | Employee | `rahul.d@vms.local` | `Employee@123` |
| **Sneha Patil** | Employee | `sneha.p@vms.local` | `Employee@123` |
| **Anita Joshi** | Employee | `anita.j@vms.local` | `Employee@123` |
| **Vikram Mehta** | Employee | `vikram.m@vms.local` | `Employee@123` |
| **Pooja Kulkarni** | Employee | `pooja.k@vms.local` | `Employee@123` |

---

### 1.3 Pune Office
* **Branch Timezone:** `Asia/Kolkata`

| Full Name | Role | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Aditya Birla** | Admin | `admin.pun@vms.local` | `Admin@123` |
| **Tanaji Malusare** | Security | `security.pun@vms.local` | `Security@123` |
| **Amit Kulkarni** | Employee | `amit.k@vms.local` | `Employee@123` |
| **Neha Deshpande** | Employee | `neha.d@vms.local` | `Employee@123` |
| **Ravi Bhosale** | Employee | `ravi.b@vms.local` | `Employee@123` |
| **Sunita Wagh** | Employee | `sunita.w@vms.local` | `Employee@123` |
| **Kiran Jadhav** | Employee | `kiran.j@vms.local` | `Employee@123` |

---

### 1.4 Gurgaon Office
* **Branch Timezone:** `Asia/Kolkata`

| Full Name | Role | Email Address | Password |
| :--- | :--- | :--- | :--- |
| **Rakesh Jhunjhunwala** | Admin | `admin.gur@vms.local` | `Admin@123` |
| **Baldev Singh** | Security | `security.gur@vms.local` | `Security@123` |
| **Rohit Gupta** | Employee | `rohit.g@vms.local` | `Employee@123` |
| **Anjali Singh** | Employee | `anjali.s@vms.local` | `Employee@123` |
| **Manish Verma** | Employee | `manish.v@vms.local` | `Employee@123` |
| **Pooja Agarwal** | Employee | `pooja.a@vms.local` | `Employee@123` |
| **Sanjay Khanna** | Employee | `sanjay.k@vms.local` | `Employee@123` |

---

> [!NOTE]
> All passwords are cryptographically salted and hashed inside the database using Postgres `pgcrypto` crypt/blowfish functions during database migration seeding.
