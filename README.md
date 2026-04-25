# SocietyCMS - Multi-Tenancy Housing Society Complaint Management System

SocietyCMS is a state-of-the-art, role-based management system designed for modern housing societies. It streamlines communication between residents, staff, and administration while leveraging AI for intelligent complaint prioritization.

## 🌟 Key Features

### 🏢 Infrastructure Management
- **Infra-First Onboarding**: Admins are guided to set up buildings and flats before accessing the dashboard.
- **Bulk Onboarding**: Seamlessly import residents and staff via CSV with automatic building and flat registration.
- **Smart Flat Mapping**: Automatically maps residents to specific units and tracks occupancy status (Occupied/Vacant).

### 📝 Intelligent Complaint System
- **AI-Powered Priority**: Uses local **Ollama (TinyLlama)** to analyze complaint descriptions and automatically assign priority (CRITICAL, HIGH, MEDIUM, LOW).
- **Visibility Guards**: 
  - Residents see their own complaints and relevant society-wide/building-specific issues.
  - Building-specific complaints are visible only to residents of that building.
  - Admins have complete visibility across the society.
- **Workflow Automation**: Duplicate detection, auto-assignment to specialized staff, and upvote-driven escalation.

### 🔔 Real-time Notifications
- Instant alerts for new complaints, status updates, and task assignments.
- Role-specific notification feeds for Residents, Staff, and Admins.

### 🛠️ Staff & Vendor Management
- specialized staff roles (Security, Plumber, Electrician, etc.).
- Performance tracking with "Before & After" image verification for resolved tasks.

## 🚀 Tech Stack

- **Backend**: Spring Boot 3.x (Java 21+), Hibernate, PostgreSQL (via Supabase).
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS (for layout utilities), Vanilla CSS (for premium UI).
- **AI Engine**: Ollama (TinyLlama model) running locally.
- **Database**: Supabase / PostgreSQL.
- **Authentication**: JWT-based Secure Authentication.

## 🛠️ Setup Instructions

### Prerequisites
- Java 21+
- Node.js 18+
- [Ollama](https://ollama.com/) (installed and running)

### Backend Setup
1. Clone the repository.
2. Configure `backend/src/main/resources/application.yml` with your database credentials.
3. Pull the TinyLlama model for AI features:
   ```bash
   ollama pull tinyllama
   ```
4. Run the Spring Boot application:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📸 Demonstration Workflow
1. **Initial Login**: Admin logins and is redirected to the Infrastructure setup.
2. **Setup**: Admin registers buildings (Tower A, B, etc.).
3. **Bulk Upload**: Admin uploads the provided `society_users_upload.csv` to create the society population.
4. **Resident Experience**: A resident logs in, files a complaint, and observes the AI automatically determining the priority.
5. **Staff Experience**: A plumber or electrician receives a notification and sees their assigned task.
6. **Resolution**: Staff resolves the task with image evidence, and the resident is notified.

## 📄 License
This project is for demonstration purposes. All rights reserved.
