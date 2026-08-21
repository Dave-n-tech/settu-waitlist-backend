# Settu Waitlist Backend — Build Instructions

This document contains everything needed to build and deploy the Settu waitlist backend. Follow the setup instructions and implement the code exactly as specified.

---

## Overview

A simple Node.js + TypeScript REST API that:
- Saves waitlist signups to a PostgreSQL database via Prisma
- Sends an email notification to the owner on every new signup
- Exposes a protected endpoint to view all entries
- Exposes a protected endpoint to export all entries as a CSV

---

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Email:** Nodemailer (Gmail SMTP)
- **Validation:** Zod
- **Hosting:** Render

---

## Project Structure

```
settu-waitlist/
├── src/
│   ├── index.ts
│   ├── router.ts
│   ├── controller.ts
│   ├── service.ts
│   └── email.ts
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Setup Instructions

### 1. Initialise the project

```bash
mkdir settu-waitlist
cd settu-waitlist
pnpm init
```

### 2. Install dependencies

```bash
pnpm add express cors nodemailer zod @prisma/client
pnpm add -D typescript tsx @types/express @types/cors @types/nodemailer @types/node prisma
```

### 3. Initialise TypeScript

```bash
npx tsc --init
```

Replace the generated tsconfig.json with the one in this document.

### 4. Initialise Prisma

```bash
npx prisma init
```

Replace the generated schema.prisma with the one in this document.

### 5. Set up environment variables

Copy .env.example to .env and fill in all values:

```bash
cp .env.example .env
```

### 6. Run the database migration

```bash
npx prisma migrate dev --name init
```

### 7. Generate the Prisma client

```bash
npx prisma generate
```

### 8. Run the development server

```bash
pnpm dev
```

Server runs on http://localhost:3000

---

## Environment Variables

### .env.example

```
DATABASE_URL=your_postgresql_connection_string
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
NOTIFY_EMAIL=your@gmail.com
ADMIN_API_KEY=generate_a_long_random_string_here
PORT=3000
```

### How to get each value

**DATABASE_URL**
Get this from your Prisma Data Platform or Render PostgreSQL instance. Format:
`postgresql://user:password@host:port/database?sslmode=require`

**GMAIL_APP_PASSWORD**
Do not use your real Gmail password. Generate an App Password:
1. Go to your Google Account → Security
2. Enable 2-Step Verification if not already enabled
3. Go to Security → App Passwords
4. Generate a new app password for "Mail"
5. Use the 16-character code as GMAIL_APP_PASSWORD

**ADMIN_API_KEY**
Generate a random string. Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your ADMIN_API_KEY.

---

## .gitignore

```
node_modules/
dist/
.env
```

---

## package.json

```json
{
  "name": "settu-waitlist",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "nodemailer": "^6.9.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/nodemailer": "^6.4.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model WaitlistEntry {
  id           String   @id @default(cuid())
  name         String
  businessName String
  businessType String
  whatsapp     String
  email        String?
  createdAt    DateTime @default(now())
}
```

---

## Source Files

### src/index.ts

```typescript
import express from 'express';
import cors from 'cors';
import { router } from './router';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Settu waitlist server running on port ${PORT}`);
});
```

---

### src/router.ts

```typescript
import { Router } from 'express';
import { signup, getEntries, exportEntries } from './controller';

export const router = Router();

router.post('/waitlist', signup);
router.get('/waitlist', getEntries);
router.get('/waitlist/export', exportEntries);
```

---

### src/service.ts

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SignupData {
  name: string;
  businessName: string;
  businessType: string;
  whatsapp: string;
  email?: string;
}

export async function createEntry(data: SignupData) {
  return prisma.waitlistEntry.create({ data });
}

export async function getAllEntries() {
  return prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });
}
```

---

### src/email.ts

```typescript
import nodemailer from 'nodemailer';
import { SignupData } from './service';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendSignupNotification(entry: SignupData) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: `New Settu waitlist signup — ${entry.name}`,
      text: [
        `Name: ${entry.name}`,
        `Business: ${entry.businessName}`,
        `Type: ${entry.businessType}`,
        `WhatsApp: ${entry.whatsapp}`,
        `Email: ${entry.email || 'Not provided'}`
      ].join('\n')
    });
  } catch (error) {
    // Email failure should never block a signup
    console.error('Email notification failed:', error);
  }
}
```

---

### src/controller.ts

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { createEntry, getAllEntries } from './service';
import { sendSignupNotification } from './email';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  whatsapp: z.string().min(1, 'WhatsApp number is required'),
  email: z.string().email().optional()
});

export async function signup(req: Request, res: Response) {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid data',
      details: result.error.flatten()
    });
  }

  try {
    const entry = await createEntry(result.data);

    // Fire and forget — email failure never blocks the signup response
    sendSignupNotification(result.data);

    return res.status(201).json({
      message: "You're on the list!",
      id: entry.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
}

export async function getEntries(req: Request, res: Response) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const entries = await getAllEntries();
    return res.json({ count: entries.length, entries });
  } catch (error) {
    console.error('Get entries error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

export async function exportEntries(req: Request, res: Response) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const entries = await getAllEntries();

    const headers = [
      'ID',
      'Name',
      'Business Name',
      'Business Type',
      'WhatsApp',
      'Email',
      'Signed Up At'
    ];

    const rows = entries.map(e => [
      e.id,
      e.name,
      e.businessName,
      e.businessType,
      e.whatsapp,
      e.email ?? '',
      e.createdAt.toISOString()
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=settu-waitlist.csv'
    );
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
```

---

## API Reference

### GET /api/health
Check that the server can reach the PostgreSQL database.

**Response 200:**
```json
{ "status": "ok", "database": "up" }
```

**Response 503:**
```json
{ "status": "error", "database": "down" }
```

### POST /api/waitlist
Save a new waitlist signup.

**Request body:**
```json
{
  "name": "Zara Johnson",
  "businessName": "Zara Couture",
  "businessType": "Fashion/Tailoring",
  "whatsapp": "08012345678",
  "email": "zara@gmail.com"
}
```

**Notes:**
- `email` is optional — all other fields are required
- On success, also fires an email notification to NOTIFY_EMAIL (non-blocking)

**Response 201:**
```json
{
  "message": "You're on the list!",
  "id": "clx1234567890"
}
```

**Response 400 (validation failure):**
```json
{
  "error": "Invalid data",
  "details": { ... }
}
```

---

### GET /api/waitlist
Get all waitlist entries. Protected.

**Headers:**
```
x-api-key: your_admin_api_key
```

**Response 200:**
```json
{
  "count": 42,
  "entries": [
    {
      "id": "clx1234567890",
      "name": "Zara Johnson",
      "businessName": "Zara Couture",
      "businessType": "Fashion/Tailoring",
      "whatsapp": "08012345678",
      "email": "zara@gmail.com",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

**Response 403:**
```json
{ "error": "Forbidden" }
```

---

### GET /api/waitlist/export
Download all entries as a CSV file. Protected.

**Headers:**
```
x-api-key: your_admin_api_key
```

**Response:** CSV file download — `settu-waitlist.csv`

Columns: ID, Name, Business Name, Business Type, WhatsApp, Email, Signed Up At

---

## Landing Page Form Integration

Add this to your landing page to submit to the API:

```html
<form id="waitlist-form">
  <input type="text" id="name" placeholder="Your name" required />
  <input type="text" id="businessName" placeholder="Business name" required />
  <select id="businessType" required>
    <option value="">Select business type</option>
    <option value="Fashion/Tailoring">Fashion / Tailoring</option>
    <option value="Food/Catering">Food / Catering</option>
    <option value="Photography/Creative">Photography / Creative</option>
    <option value="Freelance/Services">Freelance / Services</option>
    <option value="Other">Other</option>
  </select>
  <input type="tel" id="whatsapp" placeholder="WhatsApp number" required />
  <input type="email" id="email" placeholder="Email address (optional)" />
  <button type="submit">Join the waitlist</button>
  <p id="form-message"></p>
</form>

<script>
  document.getElementById('waitlist-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.querySelector('button');
    const message = document.getElementById('form-message');
    button.disabled = true;
    button.textContent = 'Joining...';

    const body = {
      name: document.getElementById('name').value,
      businessName: document.getElementById('businessName').value,
      businessType: document.getElementById('businessType').value,
      whatsapp: document.getElementById('whatsapp').value,
      email: document.getElementById('email').value || undefined
    };

    try {
      const res = await fetch('https://your-render-url.onrender.com/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        message.textContent = "You're on the list! We'll reach out on WhatsApp when we launch.";
        message.style.color = 'green';
        e.target.reset();
      } else {
        throw new Error('Signup failed');
      }
    } catch {
      message.textContent = 'Something went wrong. Please try again.';
      message.style.color = 'red';
    } finally {
      button.disabled = false;
      button.textContent = 'Join the waitlist';
    }
  });
</script>
```

Replace `https://your-render-url.onrender.com` with your actual Render deployment URL.

---

## Render Deployment

### Step 1 — Push to GitHub
Push the project to a GitHub repository.

### Step 2 — Create a new Web Service on Render
1. Go to render.com → New → Web Service
2. Connect your GitHub repository
3. Set the following:
   - **Environment:** Node
   - **Build command:** `pnpm install && npx prisma generate && pnpm build`
   - **Start command:** `npx prisma migrate deploy && node dist/index.js`

### Step 3 — Add environment variables
In Render's Environment settings, add all variables from .env.example with their real values:
- DATABASE_URL
- GMAIL_USER
- GMAIL_APP_PASSWORD
- NOTIFY_EMAIL
- ADMIN_API_KEY

### Step 4 — Deploy
Render will build and deploy automatically. Your API will be live at:
`https://your-service-name.onrender.com`

---

## Notes for the coding agent

- All source files go in `src/` exactly as structured above
- Do not modify the Prisma schema — implement it exactly as specified
- The email sending in the signup controller is intentionally not awaited — this is correct behavior, email failure must never block a signup response
- The CSV export wraps every cell value in double quotes to handle values that may contain commas
- Both the GET and export endpoints are protected by the same ADMIN_API_KEY — pass it as the `x-api-key` header
- Do not add any additional endpoints or features beyond what is specified
- Do not add a database seeder or any test data
