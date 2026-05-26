# Citizen Service Request & Municipal Grievance Resolution System - Backend

Clean Express and MongoDB backend foundation for citizen complaints, municipal departments, authentication, announcements, and feedback.

## Tech Stack

- Node.js
- Express.js
- MongoDB Community Edition
- Mongoose
- JWT Authentication
- Multer file uploads

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── data/
│   └── app.js
├── server.js
├── .env
├── package.json
└── README.md
```

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/citizen_grievance
JWT_SECRET=supersecretkey
```

Use a strong `JWT_SECRET` before deploying.

## Setup

```bash
npm install
npm run dev
```

MongoDB Community Edition should be running locally before starting the server.

## Base URL

```text
http://localhost:5000
```

## Working APIs

```text
GET /
GET /api/departments
GET /api/announcements
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/complaints/upload
GET /api/dashboard/stats
```

Full API details are available in `API_DOCUMENTATION.md`.

## Auth Payload Examples

### Register

```json
{
  "name": "Citizen User",
  "email": "citizen@example.com",
  "password": "password123",
  "phone": "9999999999",
  "address": "Ward 12",
  "role": "citizen"
}
```

### Login

```json
{
  "email": "citizen@example.com",
  "password": "password123"
}
```

Use the returned token in protected routes:

```text
Authorization: Bearer <token>
```

## Departments Seeded As Sample Data

- Water Supply
- Roads
- Electricity
- Sanitation
- Waste Management
- Public Health
- Drainage
- Environment
- Public Safety
- Street Lighting

## Notes For Future Features

The structure is ready for AI image analysis, voice recognition, automatic assignment, real-time notifications, and multi-language support through separate service modules.
