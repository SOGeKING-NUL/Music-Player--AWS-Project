<h1 align="center">Music Player AWS</h1>

<p align="center">
  <img src="https://img.shields.io/badge/AWS-S3%20%7C%20RDS%20%7C%20EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-RDS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/React%20Flow-Canvas-FF0072?style=for-the-badge&logo=react&logoColor=white" alt="React Flow">
</p>

> A highly interactive, scalable music streaming platform powered by Amazon Web Services. Features a unique canvas-based user interface using React Flow for discovering artists, managing albums, and streaming audio directly from AWS S3 via secure presigned URLs.

---

## 🎥 System Demo

*(Recruiter Note: The following video demonstrates the seamless interaction between the React Flow canvas, Node.js backend, and AWS S3 audio streaming.)*

<p align="center">
  <img src="./assets/demo.gif" alt="System Demo" width="800" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
</p>

---

## 🏗️ System Architecture

Built from the ground up to be cloud-native, utilizing AWS services for secure storage, scalability, and performance.

<p align="center">
  <img src="./assets/architecture.png" alt="Architecture Diagram" width="800" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
</p>

**Key Architectural Decisions:**
*   **Decoupled Storage:** Audio files and images are uploaded directly to **AWS S3** from the browser using secure Presigned URLs, keeping heavy payload traffic entirely off the Node.js API servers.
*   **Relational Data:** Complex relationships (Artists ↔ Albums ↔ Tracks) are managed with strict data integrity in **PostgreSQL (AWS RDS)**.
*   **Node.js/Express API:** A lightweight, high-performance API that acts as the control plane for metadata, authentication, and S3 URL generation.

> 📖 **Read the full deep-dive in the [System Architecture Documentation](./docs/system-architecture.md)**

---

## ✨ Core Features Showcase

### 1. Interactive Discovery Canvas
Navigate artists, discographies, and tracks using an intuitive, drag-and-drop canvas powered by React Flow.
<p align="center"><img src="./assets/feature_canvas.gif" alt="Canvas Demo" width="600"></p>

### 2. Direct-to-S3 Uploads
Content creators can drag-and-drop entire albums. Files bypass the backend and go directly to AWS S3, enabling massive horizontal scalability without choking the API.
<p align="center"><img src="./assets/feature_upload.gif" alt="Upload Demo" width="600"></p>

### 3. Gapless Streaming
Audio streams seamlessly from AWS S3 directly into the custom React global audio player.
<p align="center"><img src="./assets/feature_player.gif" alt="Audio Player Demo" width="600"></p>

---

## 🛠️ Technology Stack

| Category | Technologies | Purpose |
| :--- | :--- | :--- |
| **Cloud (AWS)** | S3, RDS (PostgreSQL), EC2 / Elastic Beanstalk | Object Storage, Relational Database, Compute |
| **Frontend** | React, TypeScript, Tailwind CSS, Vite | UI components, Styling, Build Tooling |
| **Canvas UI** | React Flow | Node-based visual navigation system |
| **Backend API** | Node.js, Express, `pg` | REST API, Business Logic, Presigned URL generation |
| **AWS SDK** | `@aws-sdk/client-s3` | Backend AWS integration (v3 SDK) |

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/music-player-aws.git

# 2. Setup environment variables (Requires AWS Keys & DB String)
cp .env.example .env

# 3. Start the Backend API
npm install
npm run dev

# 4. Start the Frontend Client
cd client
npm install
npm run dev
```
