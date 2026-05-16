# Music Player Project - Complete Context

## Project Overview

A cloud-native music streaming platform built with React, Express, PostgreSQL, and AWS services. Users can upload artists, albums, and songs, then stream music directly from S3 with a Spotify-like interface featuring an infinite canvas UI.

---

## Technology Stack

### **Frontend**
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: React Flow (infinite canvas), shadcn/ui components
- **Styling**: Tailwind CSS v4, Geist Sans font
- **State Management**: React Context API (Audio playback)
- **Design**: Black & white minimalist aesthetic

### **Backend**
- **Runtime**: Node.js 22 + Express + TypeScript
- **Database**: PostgreSQL (AWS RDS)
- **Storage**: AWS S3 (media files)
- **Deployment**: Docker + AWS ECS Fargate + Application Load Balancer

### **AWS Services**
- **ECS Fargate**: Serverless container orchestration
- **Application Load Balancer**: Traffic distribution and health checks
- **RDS PostgreSQL**: Relational database
- **S3**: Object storage for audio files and images
- **ECR**: Docker image registry
- **CloudWatch**: Logging and monitoring

---

## Project Structure

```
Music-Player--AWS-Project/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/             # React Flow nodes
│   │   │   │   ├── InfiniteCanvas.tsx
│   │   │   │   ├── AddArtistNode.tsx
│   │   │   │   ├── ArtistPoolNode.tsx
│   │   │   │   ├── CreateAlbumNode.tsx
│   │   │   │   └── ...
│   │   │   ├── forms/              # Upload forms
│   │   │   ├── player/             # Audio player components
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── context/
│   │   │   └── AudioContext.tsx    # Global audio state
│   │   ├── services/
│   │   │   └── api.ts              # API client
│   │   ├── types/
│   │   │   └── music.types.ts      # TypeScript interfaces
│   │   └── App.tsx
│   ├── .env                        # Environment variables
│   └── package.json
│
├── src/                            # Express backend
│   ├── config/
│   │   ├── db.config.ts           # PostgreSQL connection
│   │   └── s3.config.ts           # S3 client
│   ├── controllers/
│   │   ├── music.controller.ts    # Artist/album/song endpoints
│   │   └── upload.controller.ts   # Presigned URL generation
│   ├── routes/
│   │   ├── music.routes.ts
│   │   └── upload.routes.ts
│   ├── services/
│   │   ├── db.service.ts          # Database queries
│   │   └── s3.service.ts          # S3 operations
│   ├── utils/
│   │   └── s3KeyGenerator.ts      # S3 path generation
│   ├── db/                        # Database utilities
│   │   ├── createTable.ts
│   │   ├── listTables.ts
│   │   └── ...
│   └── index.ts                   # Express server entry
│
├── Dockerfile                      # Container definition
├── ALB_FARGATE_DEPLOYMENT.md      # Deployment guide
└── package.json
```

---

## Database Schema

### **Artists Table**
```sql
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    s3_cover_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Albums Table**
```sql
CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    release_year INTEGER,
    genre TEXT,
    s3_cover_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Songs Table**
```sql
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

---

## S3 Storage Structure

```
music-player-2026/
├── media/
│   ├── artists/
│   │   └── {artistId}/
│   │       └── cover.jpg
│   ├── images/
│   │   └── {artistId}/
│   │       └── {albumId}/
│   │           └── cover.jpg
│   └── songs/
│       └── {artistId}/
│           └── {albumId}/
│               └── {songId}.mp3
```

**UUID Consistency:**
- Frontend generates UUID once per entity
- Same UUID used for both S3 path and database ID
- Ensures referential integrity across systems

---

## Key Features Implemented

### **1. Artist Management**
- Add artists with name and cover image
- View artist profile with all albums
- Upload artist cover to S3 via presigned URLs

### **2. Album Management**
- Create albums with title, year, genre, cover
- Multi-track upload with drag-and-drop reordering
- Automatic track numbering
- Album cover upload to S3

### **3. Song Management**
- Upload multiple songs per album
- Auto-detect audio duration
- Sequential S3 upload with progress tracking
- Track metadata storage in PostgreSQL

### **4. Audio Streaming (Planned)**
- Progressive download from S3
- HTML5 Audio API integration
- Presigned URL generation for secure streaming
- Global audio player with playback controls
- Queue management and playlist support

### **5. Infinite Canvas UI**
- React Flow-based node system
- Immutable nodes (non-draggable, non-editable)
- Modal-based interactions
- Black & white minimalist design

---

## API Endpoints

### **Music Endpoints**
```
GET  /api/music/artists              # List all artists
POST /api/music/artist               # Create artist
GET  /api/music/artist/:id/albums    # Get artist's albums
POST /api/music/album                # Create album
GET  /api/music/album/:id/songs      # Get album's songs
```

### **Upload Endpoints**
```
POST /api/upload/artist/presigned-url     # Get presigned URL for artist image
POST /api/upload/cover/presigned-url      # Get presigned URL for album cover
POST /api/upload/cover/confirm            # Confirm album cover upload
POST /api/upload/song/presigned-url       # Get presigned URL for song
POST /api/upload/song/confirm             # Confirm song upload
```

### **Streaming Endpoints (Planned)**
```
GET  /api/stream/song/:songId        # Get streaming URL for song
POST /api/stream/playlist            # Get streaming URLs for playlist
```

### **Health Check**
```
GET  /health                         # Container health status
```

---

## Environment Variables

### **Backend (.env)**
```env
# Database
DB_HOST=your-rds-endpoint.ap-south-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=music_player
DB_PORT=5432

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=music-player-2026

# Server
PORT=8000
NODE_ENV=production
CLIENT_ORIGIN=http://localhost:5173
```

### **Frontend (client/.env)**
```env
VITE_API_BASE=http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com/api
VITE_S3_BASE_URL=https://music-player-2026.s3.ap-south-1.amazonaws.com
```

---

## AWS Deployment Configuration

### **ECS Task Definition**
- **CPU**: 0.5 vCPU
- **Memory**: 1 GB
- **Network Mode**: awsvpc
- **Platform**: Linux/X86_64
- **Launch Type**: Fargate

### **Application Load Balancer**
- **Listener**: HTTP:80
- **Target Group**: Port 8000
- **Health Check**: `/health` endpoint
- **DNS**: music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com

### **Auto Scaling**
- **Min Tasks**: 1
- **Max Tasks**: 10
- **Target CPU**: 70%

### **Security Groups**
- **ALB SG**: Allow HTTP (80) from 0.0.0.0/0
- **ECS SG**: Allow port 8000 from ALB SG
- **RDS SG**: Allow port 5432 from ECS SG

---

## Docker Configuration

### **Dockerfile**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npx tsc
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "dist/index.js"]
```

### **Key Points**
- Listens on `0.0.0.0:8000` (all interfaces)
- Health check endpoint for ECS
- TypeScript compilation during build
- Production-ready Node.js setup

---

## Development Workflow

### **Local Development**
```bash
# Backend
npm run dev          # Start Express server on port 8000

# Frontend
cd client
npm run dev          # Start Vite dev server on port 5173
```

### **Docker Build & Push**
```bash
# Build image
docker build -t music-player-backend .

# Tag for ECR
docker tag music-player-backend:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/music-player-backend:latest

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/music-player-backend:latest
```

### **ECS Deployment**
```bash
# Force new deployment
aws ecs update-service \
  --cluster music-player-cluster \
  --service music-player-service \
  --force-new-deployment \
  --region ap-south-1
```

---

## Cost Estimation (Monthly)

### **AWS Services**
- **ECS Fargate** (2 tasks, 0.5 vCPU, 1GB): ~$35
- **Application Load Balancer**: ~$16
- **RDS PostgreSQL** (db.t3.micro): ~$15
- **S3 Storage** (10GB): ~$0.23
- **S3 Data Transfer** (50GB): ~$4.50
- **ECR Storage** (1GB): ~$0.10
- **CloudWatch Logs**: ~$1

**Total**: ~$70-80/month

### **Optimization Opportunities**
- Use Reserved Instances for RDS (save 30-40%)
- Add CloudFront for S3 (reduce transfer costs)
- Scale down to 1 task during low traffic
- Use S3 Intelligent-Tiering for old files

---

## Security Considerations

### **Implemented**
- ✅ Presigned URLs for S3 uploads (time-limited)
- ✅ VPC isolation for ECS tasks
- ✅ Security groups for network segmentation
- ✅ RDS in private subnet
- ✅ Environment variables for secrets

### **Recommended Additions**
- [ ] AWS Secrets Manager for credentials
- [ ] HTTPS with ACM certificate
- [ ] WAF for ALB protection
- [ ] CloudTrail for audit logging
- [ ] IAM roles instead of access keys
- [ ] S3 bucket encryption
- [ ] Database encryption at rest

---

## Known Issues & Limitations

1. **No Authentication**: Currently no user authentication system
2. **No HTTPS**: ALB uses HTTP only (should add SSL)
3. **No CDN**: Direct S3 access (should add CloudFront)
4. **No Caching**: No Redis or caching layer
5. **No Rate Limiting**: API endpoints are unprotected
6. **No Monitoring**: Basic CloudWatch only (should add detailed metrics)

---

## Future Enhancements

### **Phase 1: Audio Streaming**
- [ ] Implement audio streaming with presigned URLs
- [ ] Build global audio player component
- [ ] Add queue management
- [ ] Support seeking and buffering

### **Phase 2: User Features**
- [ ] User authentication (Cognito)
- [ ] Playlists and favorites
- [ ] Search functionality
- [ ] Artist/album recommendations

### **Phase 3: Performance**
- [ ] Add CloudFront CDN
- [ ] Implement Redis caching
- [ ] Database read replicas
- [ ] Optimize S3 costs with lifecycle policies

### **Phase 4: Production Readiness**
- [ ] Add HTTPS with custom domain
- [ ] Implement comprehensive monitoring
- [ ] Set up CI/CD pipeline
- [ ] Add automated backups
- [ ] Implement disaster recovery

---

## Contact & Support

**Backend API URL**: http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com

**Health Check**: http://music-player-load-balancer-19704141.ap-south-1.elb.amazonaws.com/health

**S3 Bucket**: https://music-player-2026.s3.ap-south-1.amazonaws.com

---

## Version History

- **v1.0.0** (Current): Initial deployment with artist/album/song management
- **v1.1.0** (Planned): Audio streaming implementation
- **v2.0.0** (Future): User authentication and playlists
