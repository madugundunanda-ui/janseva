# API Documentation

Backend for the Citizen Service Request & Municipal Grievance Resolution System.

## Base URL

```text
http://localhost:5000
```

## Standard Response Format

### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication

Protected APIs require:

```text
Authorization: Bearer <jwt_token>
```

Roles:

- citizen
- officer
- supervisor
- admin

## Health

### GET /

Auth: Public

Response:

```json
{
  "success": true,
  "message": "Citizen Grievance Backend Running",
  "data": {
    "service": "Citizen Service Request & Municipal Grievance Resolution System",
    "status": "running"
  }
}
```

## Auth APIs

### POST /api/auth/register

Auth: Public

Request body:

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

Response data:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Citizen User",
    "email": "citizen@example.com",
    "role": "citizen"
  }
}
```

### POST /api/auth/login

Auth: Public

Request body:

```json
{
  "email": "citizen@example.com",
  "password": "password123"
}
```

### GET /api/auth/me

Auth: JWT required

Response data:

```json
{
  "user": {}
}
```

## Users

### GET /api/users

Auth: admin, supervisor

Optional query:

```text
?role=officer&department=<department_id>
```

Response data:

```json
{
  "count": 1,
  "users": []
}
```

### GET /api/users/:id

Auth: admin, supervisor

Response data:

```json
{
  "user": {}
}
```

## Complaints

### GET /api/complaints

Auth: JWT required

Behavior:

- citizens see their own complaints
- officers see assigned complaints
- supervisors see complaints in their department
- admins see all complaints

Response data:

```json
{
  "count": 1,
  "complaints": []
}
```

### POST /api/complaints

Auth: JWT required

Content type:

```text
multipart/form-data
```

Request fields:

```json
{
  "title": "Garbage not collected",
  "description": "Waste has not been collected for three days.",
  "department": "department_id",
  "priority": "medium",
  "location": {
    "address": "Ward 12 Main Road",
    "ward": "12"
  }
}
```

Files:

```text
images: up to 5 image files
```

### POST /api/complaints/upload

Auth: JWT required

Uploads complaint images before complaint creation.

Content type:

```text
multipart/form-data
```

Files:

```text
images: up to 5 image files
```

Response data:

```json
{
  "count": 1,
  "images": [
    {
      "url": "/uploads/images-123.png",
      "filename": "images-123.png"
    }
  ]
}
```

### GET /api/complaints/:id/assignment-options

Auth: admin, supervisor

Returns only officers and supervisors from the complaint department.

### PATCH /api/complaints/:id/assign-officer

Auth: admin, supervisor

Request body:

```json
{
  "officerId": "officer_user_id"
}
```

### PATCH /api/complaints/:id/assign-supervisor

Auth: admin, officer

Request body:

```json
{
  "supervisorId": "supervisor_user_id",
  "note": "Escalating due to SLA risk"
}
```

Officer rule:

- officers can escalate only complaints assigned to them
- supervisor must belong to the same department as the complaint

## Departments

### GET /api/departments

Auth: Public

Returns saved departments if available, otherwise sample civic departments.

### POST /api/departments

Auth: admin

Request body:

```json
{
  "name": "Water Supply",
  "description": "Handles water supply complaints"
}
```

## Announcements

### GET /api/announcements

Auth: Public

Returns realistic Indian municipal announcement samples if no database records exist.

### POST /api/announcements

Auth: admin, supervisor

Request body:

```json
{
  "title": "Ward-Level Water Supply Maintenance",
  "description": "Scheduled maintenance from 10:00 AM to 2:00 PM.",
  "department": "Water Supply",
  "officialLink": "https://india.gov.in/",
  "publishedDate": "2026-05-08"
}
```

## Feedbacks

### GET /api/feedbacks

Auth: JWT required

Behavior:

- citizens see their own feedback
- officers, supervisors, and admins see all feedback

### POST /api/feedbacks

Auth: citizen

Request body:

```json
{
  "complaint": "complaint_id",
  "rating": 5,
  "comment": "Issue was resolved quickly."
}
```

Rules:

- rating must be between 1 and 5
- feedback is linked to a complaint
- citizens can submit feedback only for their own complaints

## Dashboard

### GET /api/dashboard/stats

Auth: admin, supervisor, officer

Response data:

```json
{
  "stats": {
    "totalComplaints": 25,
    "complaintsResolved": 12,
    "pendingComplaints": 13,
    "activeDepartments": 10,
    "slaSuccessRate": 48,
    "statusBreakdown": {
      "submitted": 5,
      "resolved": 12
    }
  }
}
```

## AI Integration Readiness

AI service placeholders are available in:

```text
src/services/aiService.js
```

Current methods:

- analyzeComplaintImage()
- detectDepartment()
- extractIssueTitle()

These methods intentionally return placeholder responses until an AI provider or local AI service is connected.
