# AWS Deployment Guide for MINMAX Backend

## Prerequisites

- AWS Account
- AWS CLI configured
- Domain name (optional, for production)

## Deployment Options

### Option 1: AWS EC2 (Recommended for simplicity)

#### Step 1: Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.small (2 vCPU, 2GB RAM) - $15/month
# Storage: 20GB gp3
# Security Group: Allow 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)
```

#### Step 2: Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies (optional, using pre-built binary)
# If you want to build on server:
# wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
# sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
# echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
# source ~/.bashrc
```

#### Step 3: Deploy Application

```bash
# On your local machine, build for Linux
cd backend-go
GOOS=linux GOARCH=amd64 go build -o minmax-api main.go

# Copy binary and env file
scp minmax-api ubuntu@your-instance-ip:/home/ubuntu/
scp .env ubuntu@your-instance-ip:/home/ubuntu/

# SSH back to server
ssh -i your-key.pem ubuntu@your-instance-ip

# Make executable
chmod +x minmax-api

# Test run
./minmax-api
# Press Ctrl+C to stop
```

#### Step 4: Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/minmax-api.service
```

Add this content:

```ini
[Unit]
Description=MINMAX API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/home/ubuntu/minmax-api
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=minmax-api
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable minmax-api
sudo systemctl start minmax-api

# Check status
sudo systemctl status minmax-api

# View logs
sudo journalctl -u minmax-api -f
```

#### Step 5: Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/minmax-api
```

Add this content:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/minmax-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: SSL with Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

### Option 2: AWS ECS with Docker

#### Step 1: Create Docker Image

Already created: `backend-go/Dockerfile`

```bash
# Build image
cd backend-go
docker build -t minmax-api .

# Test locally
docker run -p 3001:3001 --env-file .env minmax-api
```

#### Step 2: Push to Amazon ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name minmax-api --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag minmax-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/minmax-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/minmax-api:latest
```

#### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name minmax-cluster --region us-east-1
```

#### Step 4: Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "minmax-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "minmax-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/minmax-api:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:minmax-mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/minmax-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 5: Create ECS Service

```bash
# Create service with Application Load Balancer
aws ecs create-service \
  --cluster minmax-cluster \
  --service-name minmax-api-service \
  --task-definition minmax-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=minmax-api,containerPort=3001"
```

---

### Option 3: AWS Lambda (Serverless)

For serverless deployment, you'll need to adapt the Go application:

1. Use AWS Lambda Go runtime
2. Use API Gateway for HTTP endpoints
3. Modify `main.go` to use Lambda handler

Example handler:

```go
package main

import (
    "context"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/awslabs/aws-lambda-go-api-proxy/gin"
)

var ginLambda *ginadapter.GinLambda

func init() {
    // Initialize Gin router
    router := setupRouter()
    ginLambda = ginadapter.New(router)
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
    lambda.Start(Handler)
}
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Whitelist AWS IP or use 0.0.0.0/0
4. Get connection string
5. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=minmax
```

### Option 2: Self-hosted MongoDB on EC2

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({user: "admin", pwd: "password", roles: ["root"]})
> exit

# Update mongod.conf to enable auth
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled

sudo systemctl restart mongod
```

---

## Cost Estimates

### EC2 Deployment

- **t3.small**: ~$15/month
- **20GB EBS**: ~$2/month
- **Data transfer**: ~$9/GB (first 100GB free)
- **Total**: ~$17-30/month

### ECS Fargate

- **0.5 vCPU, 1GB RAM**: ~$14/month
- **Application Load Balancer**: ~$16/month
- **Total**: ~$30-40/month

### Lambda

- **1M requests**: $0.20
- **Compute**: $0.0000166667/GB-second
- **Total**: Pay as you go, ~$5-20/month for moderate use

### MongoDB Atlas

- **M0 (Free)**: 512MB storage, shared CPU
- **M10**: ~$57/month, 10GB storage, dedicated
- **M20**: ~$115/month, 20GB storage

---

## Monitoring & Maintenance

### CloudWatch Logs (for ECS/Lambda)

```bash
# View logs
aws logs tail /ecs/minmax-api --follow

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name minmax-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80
```

### Systemd Logs (for EC2)

```bash
# Real-time logs
sudo journalctl -u minmax-api -f

# Last 100 lines
sudo journalctl -u minmax-api -n 100

# Logs from today
sudo journalctl -u minmax-api --since today
```

### Health Checks

Add to your monitoring:

```bash
curl http://your-instance-ip:3001/health
# Should return: {"status":"ok"}
```

---

## Updating the Application

### EC2 Update

```bash
# Build new version
cd backend-go
GOOS=linux GOARCH=amd64 go build -o minmax-api main.go

# Copy to server
scp minmax-api ubuntu@your-instance-ip:/home/ubuntu/minmax-api-new

# On server
ssh ubuntu@your-instance-ip
mv minmax-api minmax-api-old
mv minmax-api-new minmax-api
chmod +x minmax-api
sudo systemctl restart minmax-api

# Verify
sudo systemctl status minmax-api
```

### ECS Update

```bash
# Build and push new image
docker build -t minmax-api .
docker tag minmax-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/minmax-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/minmax-api:latest

# Update service
aws ecs update-service \
  --cluster minmax-cluster \
  --service minmax-api-service \
  --force-new-deployment
```

---

## Security Checklist

- [ ] Use HTTPS only (SSL certificate)
- [ ] Restrict security group rules (only necessary ports)
- [ ] Use IAM roles (not access keys)
- [ ] Store secrets in AWS Secrets Manager
- [ ] Enable CloudWatch logging
- [ ] Set up AWS WAF (Web Application Firewall)
- [ ] Regular security updates
- [ ] MongoDB authentication enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented

---

## Backup Strategy

### MongoDB Backups

```bash
# Manual backup
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)

# Automated with cron
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backup/$(date +\%Y\%m\%d) && find /backup -mtime +7 -delete
```

### Application Backups

- Use AWS Backup for EC2 snapshots
- Use ECR image versioning
- Keep previous binaries

---

## Troubleshooting

### Service won't start

```bash
sudo systemctl status minmax-api
sudo journalctl -u minmax-api -n 50
```

### MongoDB connection issues

```bash
# Test connection
mongosh "mongodb+srv://..."

# Check network
curl -v telnet://your-mongodb-host:27017
```

### High memory usage

```bash
# Check memory
free -h
htop

# Restart service
sudo systemctl restart minmax-api
```

---

## Next Steps

1. Choose deployment option (EC2 recommended for start)
2. Set up MongoDB Atlas
3. Deploy backend
4. Configure domain and SSL
5. Set up monitoring
6. Test all API endpoints
7. Update mobile app with production API URL
