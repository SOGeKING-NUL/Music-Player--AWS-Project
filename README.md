# 🎵 Cloud-Native Music Streaming Platform

A scalable, production-ready music streaming application built with modern web technologies and deployed on AWS infrastructure. Features include artist/album management, direct-to-S3 uploads, and progressive audio streaming with a unique infinite canvas UI.

**Live Demo**: [Backend API](http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com)

---

## 🏗️ System Architecture

![System Architecture Diagram](./docs/architecture-diagram.png)

### High-Level Overview

```
┌─────────────┐
│   Client    │  React + TypeScript + Vite
│  (Frontend) │  Infinite Canvas UI (React Flow)
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud (ap-south-1)                │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Application Load Balancer                     │    │
│  │  • Health checks & traffic distribution        │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼─────────────────────────────┐    │
│  │  ECS Fargate Cluster (Auto-scaling)            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │ Task 1   │  │ Task 2   │  │ Task N   │    │    │
│  │  │ Express  │  │ Express  │  │ Express  │    │    │
│  │  │ Node.js  │  │ Node.js  │  │ Node.js  │    │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘    │    │
│  └───────┼─────────────┼─────────────┼──────────┘    │
│          │             │             │                 │
│          ├─────────────┴─────────────┤                │
│          │                           │                │
│  ┌───────▼────────┐         ┌────────▼──────────┐   │
│  │ RDS PostgreSQL │         │   S3 Bucket       │   │
│  │ • Artists      │         │   • Audio files   │   │
│  │ • Albums       │         │   • Images        │   │
│  │ • Songs        │         │   • Presigned URLs│   │
│  └────────────────┘         └───────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

- **Stateless Backend**: Express API designed for horizontal scaling
- **Containerized Deployment**: Docker + ECS Fargate for serverless container orchestration
- **Direct S3 Uploads**: Client-side uploads using presigned URLs (reduces server load)
- **Progressive Streaming**: HTTP range requests for efficient audio playback
- **UUID Consistency**: Frontend-generated UUIDs ensure referential integrity across S3 and database

---

## 🚀 Core Features

### 1. Artist Management
![Artist Management](./docs/artist-management.png)

- **Add Artists**: Upload artist profiles with cover images
- **Artist Profiles**: View complete discography with albums and tracks
- **Direct S3 Upload**: Presigned URLs for secure, direct-to-S3 image uploads
- **UUID-based Storage**: Consistent identification across database and object storage

**Technical Highlights**:
- Frontend generates UUID before upload
- Presigned URL generation with 1-hour expiry
- S3 path structure: `media/artists/{artistId}/cover.jpg`

---

### 2. Album & Track Upload
![Album Upload](./docs/album-upload.png)

- **Multi-Track Upload**: Drag-and-drop interface for batch song uploads
- **Track Reordering**: Sortable track list with visual feedback
- **Metadata Management**: Album title, year, genre, and cover art
- **Progress Tracking**: Real-time upload progress for each track
- **Auto-detection**: Automatic audio duration extraction

**Technical Highlights**:
- Sequential S3 uploads with retry logic
- Atomic database transactions for data consistency
- S3 path structure: `media/songs/{artistId}/{albumId}/{songId}.mp3`
- Track numbering with unique constraints

---

### 3. Audio Streaming (Progressive Download)
![Audio Player](./docs/audio-player.png)

- **Progressive Streaming**: Start playback before full download
- **Seek Support**: Jump to any position using HTTP range requests
- **Global Player**: Persistent audio player across navigation
- **Queue Management**: Playlist and queue functionality
- **Playback Controls**: Play, pause, seek, volume, next/previous

**Technical Highlights**:
- HTML5 Audio API with native browser buffering
- S3 presigned URLs for secure streaming (1-hour expiry)
- HTTP 206 Partial Content responses
- Byte-range requests for efficient seeking
- Only pay for data actually downloaded

---

### 4. Infinite Canvas UI
![Infinite Canvas](./docs/infinite-canvas.png)

- **React Flow Integration**: Smooth, interactive node-based interface
- **Immutable Nodes**: Non-draggable, non-editable for consistent UX
- **Modal Interactions**: Canvas-relative modals for forms
- **Minimalist Design**: Black & white aesthetic with Geist Sans font
- **Responsive Layout**: Adapts to different screen sizes

**Technical Highlights**:
- React Flow for canvas rendering
- Custom node components with TypeScript
- shadcn/ui components for consistent design
- Tailwind CSS v4 for styling

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: React Flow, shadcn/ui
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 22 + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (AWS RDS)
- **ORM**: Native pg driver with connection pooling
- **Storage**: AWS S3 with presigned URLs

### Infrastructure (AWS)
- **Compute**: ECS Fargate (serverless containers)
- **Load Balancing**: Application Load Balancer
- **Database**: RDS PostgreSQL (db.t3.micro)
- **Storage**: S3 (Standard storage class)
- **Container Registry**: ECR
- **Monitoring**: CloudWatch Logs & Metrics

### DevOps
- **Containerization**: Docker
- **Orchestration**: AWS ECS
- **CI/CD**: Manual deployment (GitHub Actions ready)
- **Health Checks**: ALB + ECS health monitoring

---

## 📊 Database Schema

```sql
-- Artists table
CREATE TABLE artists (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    s3_cover_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Albums table
CREATE TABLE albums (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    release_year INTEGER,
    genre TEXT,
    s3_cover_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    track_number INTEGER NOT NULL,
    duration_seconds INTEGER,
    s3_audio_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(album_id, track_number)
);
```

**Key Design Decisions**:
- UUID primary keys for distributed system compatibility
- Cascading deletes for referential integrity
- Unique constraint on (album_id, track_number) prevents duplicate tracks
- S3 keys stored as TEXT for flexibility

---

## 🔐 Security & Best Practices

### Implemented Security Measures

✅ **Network Isolation**
- VPC with public/private subnets
- ECS tasks in private subnets
- RDS in private subnet (no public access)

✅ **Access Control**
- Security groups for network segmentation
- IAM roles for ECS tasks (no hardcoded credentials)
- S3 bucket policy restricting access to ECS role

✅ **Data Protection**
- Presigned URLs with time-limited access (1 hour)
- S3 block public access enabled
- CORS policy for frontend origin only

✅ **Application Security**
- Stateless API design (no session storage)
- Input validation on all endpoints
- Health check endpoints for monitoring

### Production Recommendations

🔒 **Authentication & Authorization**
- Implement AWS Cognito for user management
- JWT tokens for API authentication
- Role-based access control (RBAC)

🔒 **HTTPS & Encryption**
- ACM certificate for custom domain
- ALB HTTPS listener (port 443)
- S3 server-side encryption (SSE-S3)
- RDS encryption at rest

🔒 **Secrets Management**
- AWS Secrets Manager for credentials
- Environment variables via ECS task definition
- Rotate database passwords regularly

---

## 📈 Scalability & Performance

### Auto-Scaling Configuration

**ECS Service Auto-Scaling**:
- **Metric**: CPU Utilization
- **Target**: 70%
- **Min Tasks**: 1
- **Max Tasks**: 10
- **Scale-out**: CPU > 70% for 2 minutes
- **Scale-in**: CPU < 30% for 5 minutes

**Load Balancer**:
- Round-robin distribution
- Health checks every 30 seconds
- Connection draining: 30 seconds
- Supports 100-500 req/sec per task

### Performance Optimizations

✅ **Database**
- Connection pooling (max 20 connections)
- Indexes on foreign keys
- Efficient JOIN queries (no N+1 problems)

✅ **S3 Streaming**
- Progressive download (no full file download)
- Browser-native buffering
- HTTP range requests for seeking

✅ **API Response**
- Stateless design (no session overhead)
- JSON responses (lightweight)
- Efficient query patterns

### Future Enhancements

🚀 **CloudFront CDN**
- Edge caching for S3 content
- Reduced latency globally
- Lower data transfer costs

🚀 **Redis Caching**
- Cache frequently accessed data
- Reduce database load
- Session storage for future auth

🚀 **Database Optimization**
- Read replicas for scaling reads
- Query optimization and indexing
- Connection pooling tuning

---

## 💰 Cost Analysis

### Monthly Cost Breakdown (Production)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 2 tasks, 0.5 vCPU, 1GB | $35.55 |
| **Application Load Balancer** | Standard | $16.20 |
| **RDS PostgreSQL** | db.t3.micro | $15.00 |
| **S3 Storage** | 10 GB | $0.23 |
| **S3 Data Transfer** | 50 GB/month | $4.50 |
| **ECR Storage** | 1 GB | $0.10 |
| **CloudWatch Logs** | Standard | $1.00 |
| **Total** | | **~$72/month** |

### Cost Optimization Strategies

💡 **Immediate Savings**:
- Scale down to 1 task during low traffic: Save $17/month
- Use S3 Intelligent-Tiering for old files: Save 30-40%
- RDS Reserved Instance (1-year): Save $5/month

💡 **Future Optimizations**:
- CloudFront for S3 (reduce transfer costs by 15%)
- Fargate Spot for non-critical tasks (save 70%)
- S3 lifecycle policies (move old files to Glacier)

---

## 🎯 Key Technical Achievements

### 1. **Scalable Architecture**
- Horizontal scaling with ECS Fargate
- Stateless API design for easy replication
- Auto-scaling based on CPU metrics
- Load balancing across multiple tasks

### 2. **Efficient Media Handling**
- Direct client-to-S3 uploads (reduces server load)
- Presigned URLs for secure, time-limited access
- Progressive audio streaming (no full downloads)
- UUID-based storage for consistency

### 3. **Production-Ready Infrastructure**
- Containerized deployment with Docker
- Health checks at multiple levels (ALB + ECS)
- CloudWatch monitoring and logging
- Security groups and IAM roles

### 4. **Modern Frontend Architecture**
- TypeScript for type safety
- React Flow for interactive UI
- Context API for global state
- Responsive, accessible design

---

## 📝 API Documentation

### Music Endpoints

```
GET  /api/music/artists              # List all artists
POST /api/music/artist               # Create artist
GET  /api/music/artist/:id/albums    # Get artist's albums
POST /api/music/album                # Create album
GET  /api/music/album/:id/songs      # Get album's songs
```

### Upload Endpoints

```
POST /api/upload/artist/presigned-url     # Get presigned URL for artist image
POST /api/upload/cover/presigned-url      # Get presigned URL for album cover
POST /api/upload/song/presigned-url       # Get presigned URL for song
POST /api/upload/song/confirm             # Confirm song upload to database
```

### Streaming Endpoints

```
GET  /api/stream/song/:songId        # Get streaming URL for song
POST /api/stream/playlist            # Get streaming URLs for multiple songs
```

### Health Check

```
GET  /health                         # Container health status
```

---

## 🔄 Deployment Workflow

```
1. Code Changes → Git Repository
2. Build Docker Image → docker build -t music-player-backend .
3. Push to ECR → docker push ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/...
4. Update ECS Service → aws ecs update-service --force-new-deployment
5. ECS pulls new image and performs rolling update
6. Health checks validate new tasks
7. ALB routes traffic to healthy tasks
8. Old tasks gracefully drained and stopped
```

**Zero-downtime deployment** with rolling updates and health checks.

---

## 🌟 Future Roadmap

### Phase 1: Enhanced Streaming
- [ ] Implement adaptive bitrate streaming
- [ ] Add offline playback support
- [ ] Playlist creation and management
- [ ] Lyrics display and synchronization

### Phase 2: User Features
- [ ] User authentication (AWS Cognito)
- [ ] Personal playlists and favorites
- [ ] Search functionality (artist/album/song)
- [ ] Recommendations engine

### Phase 3: Performance & Scale
- [ ] CloudFront CDN integration
- [ ] Redis caching layer
- [ ] Database read replicas
- [ ] Multi-region deployment

### Phase 4: Production Hardening
- [ ] HTTPS with custom domain
- [ ] Comprehensive monitoring (Datadog/New Relic)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated backups and disaster recovery
- [ ] Rate limiting and DDoS protection

---

## 📞 Contact & Links

**Backend API**: http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com

**Health Check**: http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com/health

**S3 Bucket**: https://music-player-2026.s3.ap-south-1.amazonaws.com

---

## 📄 License

This project is built for educational and portfolio purposes.

---

**Built with ❤️ using React, Node.js, TypeScript, and AWS**
