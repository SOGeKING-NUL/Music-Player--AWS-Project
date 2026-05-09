# ALB + ECS Fargate Deployment Guide

## Architecture Overview

```
Client (React) → ALB → ECS Fargate (Express Containers) → RDS PostgreSQL + S3
```

## Prerequisites

- AWS Account with appropriate permissions
- Docker installed locally
- AWS CLI configured
- ECR repository created
- RDS PostgreSQL instance running
- S3 bucket configured

---

## Step 1: Dockerize Express Application

### Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

### Create `.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
dist
```

---

## Step 2: Create ECS Task Definition

### `ecs-task-definition.json`:

```json
{
  "family": "music-player-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "music-player-api",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/music-player-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/db-host"
        },
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/db-user"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/db-password"
        },
        {
          "name": "DB_NAME",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/db-name"
        },
        {
          "name": "AWS_ACCESS_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/aws-access-key"
        },
        {
          "name": "AWS_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:music-player/aws-secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/music-player-backend",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## Step 3: Create ALB with Terraform (Optional)

### `alb.tf`:

```hcl
resource "aws_lb" "music_player" {
  name               = "music-player-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "music-player-alb"
  }
}

resource "aws_lb_target_group" "music_player" {
  name        = "music-player-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.music_player.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.music_player.arn
  }
}
```

---

## Step 4: Create ECS Service with Auto Scaling

### `ecs-service.tf`:

```hcl
resource "aws_ecs_cluster" "music_player" {
  name = "music-player-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_service" "music_player" {
  name            = "music-player-service"
  cluster         = aws_ecs_cluster.music_player.id
  task_definition = aws_ecs_task_definition.music_player.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.music_player.arn
    container_name   = "music-player-api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.music_player.name}/${aws_ecs_service.music_player.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu_policy" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

---

## Step 5: Deployment Commands

### Build and Push Docker Image:

```bash
# Login to ECR
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

# Build image
docker build -t music-player-backend .

# Tag image
docker tag music-player-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/music-player-backend:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/music-player-backend:latest
```

### Deploy ECS Service:

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create or update service
aws ecs create-service \
  --cluster music-player-cluster \
  --service-name music-player-service \
  --task-definition music-player-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT_ID:targetgroup/music-player-tg/xxx,containerName=music-player-api,containerPort=3000"
```

---

## Step 6: CI/CD Pipeline (GitHub Actions)

### `.github/workflows/deploy.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: music-player-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster music-player-cluster --service music-player-service --force-new-deployment
```

---

## Monitoring & Logging

### CloudWatch Logs:
- Log group: `/ecs/music-player-backend`
- Retention: 7 days (configurable)

### CloudWatch Metrics:
- CPU Utilization
- Memory Utilization
- Request Count
- Target Response Time

### Alarms:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-utilization \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Cost Estimation

**Fargate Pricing (us-east-1):**
- vCPU: $0.04048/hour
- Memory: $0.004445/GB/hour

**Example (0.5 vCPU, 1GB RAM):**
- Per hour: $0.04048 × 0.5 + $0.004445 × 1 = $0.024685
- Per month (2 tasks): $0.024685 × 24 × 30 × 2 = ~$35.55

**ALB Pricing:**
- Fixed: $0.0225/hour = ~$16.20/month
- LCU: $0.008/hour per LCU

**Total Monthly Cost (2 tasks):**
- ~$50-70/month for moderate traffic

---

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable VPC Flow Logs** for network monitoring
3. **Use Security Groups** to restrict traffic
4. **Enable ALB access logs** to S3
5. **Use IAM roles** instead of access keys where possible
6. **Enable AWS WAF** for ALB (optional)
7. **Use HTTPS** with ACM certificates

---

## Rollback Strategy

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix music-player-backend

# Update service to previous version
aws ecs update-service \
  --cluster music-player-cluster \
  --service music-player-service \
  --task-definition music-player-backend:PREVIOUS_VERSION
```

---

## Implementation Timeline

**Week 1:**
- Dockerize application
- Create ECR repository
- Test locally with Docker

**Week 2:**
- Set up VPC, subnets, security groups
- Create ALB and target groups
- Configure RDS security groups

**Week 3:**
- Create ECS cluster and task definition
- Deploy initial service
- Configure auto-scaling

**Week 4:**
- Set up CI/CD pipeline
- Configure monitoring and alarms
- Load testing and optimization

---

## Next Steps

1. Review and customize task definition
2. Set up AWS infrastructure (VPC, subnets, security groups)
3. Create ECR repository
4. Build and push Docker image
5. Deploy ECS service
6. Configure auto-scaling
7. Set up monitoring and alarms
8. Implement CI/CD pipeline
