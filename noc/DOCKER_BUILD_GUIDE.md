# Docker Build Guide for CMS NOC Integration Script

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Dockerfile Options](#dockerfile-options)
- [Building Images](#building-images)
- [Cross-Platform Builds (ARM64)](#cross-platform-builds-arm64)
- [Saving and Loading Images](#saving-and-loading-images)
- [Running Containers](#running-containers)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

This guide provides instructions for building Docker images for the CMS NOC Integration script. We provide multiple Dockerfile options optimized for different use cases.

### Image Sizes Comparison
- **Standard Dockerfile**: ~407MB (includes all build tools)
- **Optimized Dockerfile**: ~131MB (multi-stage build)
- **Minimal Dockerfile**: ~63MB (Alpine-based, smallest size)

## Prerequisites

1. **Docker installed**: Version 20.10 or higher
   ```bash
   docker --version
   ```

2. **Docker Compose** (optional): For orchestration
   ```bash
   docker-compose --version
   ```

3. **Docker Buildx** (for ARM64 builds):
   ```bash
   docker buildx version
   ```

## Quick Start

### 1. Clone or navigate to project directory
```bash
cd /mnt/Ecog_SW/noc
```

### 2. Build the image (using optimized Dockerfile)
```bash
docker build -f Dockerfile.optimized -t ador-samsung-1-14:latest .
```

### 3. Run the container
```bash
docker run -d --name cms-noc --restart unless-stopped ador-samsung-1-14:latest
```

## Dockerfile Options

### 1. **Dockerfile** (Standard)
- Base: `python:3.11-slim`
- Size: ~407MB
- Includes: All build tools in final image
- Use when: Development or when size is not a concern

### 2. **Dockerfile.optimized** (Recommended)
- Base: `python:3.11-slim` with multi-stage build
- Size: ~131MB
- Features: Build tools removed from final image
- Use when: Production deployment on x86_64

### 3. **Dockerfile.minimal** (Smallest)
- Base: `python:3.11-alpine`
- Size: ~63MB
- Features: Minimal footprint
- Use when: Size is critical, embedded systems

### 4. **Dockerfile.arm64** (ARM without psutil)
- Base: `python:3.11-slim`
- Size: ~125MB
- Features: No compiled dependencies
- Use when: ARM64 without psutil requirement

## Building Images

### Standard Build (x86_64)

```bash
# Using standard Dockerfile
docker build -t ador-samsung-1-14:latest .

# Using optimized Dockerfile (recommended)
docker build -f Dockerfile.optimized -t ador-samsung-1-14:latest .

# Using minimal Alpine-based Dockerfile
docker build -f Dockerfile.minimal -t ador-samsung-1-14:latest .
```

### Build with specific version tag
```bash
docker build -f Dockerfile.optimized -t ador-samsung-1-14:v1.14 .
docker tag ador-samsung-1-14:v1.14 ador-samsung-1-14:latest
```

## Cross-Platform Builds (ARM64)

### Setup Buildx for Multi-Architecture

1. **Create multi-architecture builder**
   ```bash
   docker buildx create --name multiarch --use
   docker buildx inspect --bootstrap
   ```

2. **List available builders**
   ```bash
   docker buildx ls
   ```

### Building for ARM64

#### Option 1: Build and export to tar
```bash
docker buildx build --platform linux/arm64 -f Dockerfile -t ador-samsung-1-14:latest --output type=docker,dest=ador-samsung-1-14.tar .
```

#### Option 2: Build and compress directly
```bash
docker buildx build --platform linux/arm64 -f Dockerfile -t ador-samsung-1-14:latest --output type=docker,dest=- . | gzip > ador-samsung-1-14.tar.gz
```

#### Option 3: Build for multiple platforms
```bash
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile -t ador-samsung-1-14:multiarch .
```

### Common ARM64 Build Issues

If you encounter "exec format error":
```bash
# Install QEMU for emulation
sudo apt-get update
sudo apt-get install -y qemu-user-static

# Verify QEMU installation
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

## Saving and Loading Images

### Save as TAR file

```bash
# Save uncompressed
docker save -o ador-samsung-1-14.tar ador-samsung-1-14:latest

# View tar file size
ls -lh ador-samsung-1-14.tar
```

### Save as compressed TAR.GZ

```bash
# Method 1: Using pipe
docker save ador-samsung-1-14:latest | gzip > ador-samsung-1-14.tar.gz

# Method 2: Compress existing tar
docker save -o ador-samsung-1-14.tar ador-samsung-1-14:latest
gzip ador-samsung-1-14.tar

# View compressed size
ls -lh ador-samsung-1-14.tar.gz
```

### Load from TAR/TAR.GZ

```bash
# Load from tar
docker load -i ador-samsung-1-14.tar

# Load from tar.gz
gunzip -c ador-samsung-1-14.tar.gz | docker load

# Or using zcat
zcat ador-samsung-1-14.tar.gz | docker load
```

### Transfer to another system

```bash
# On source system
docker save ador-samsung-1-14:latest | gzip > ador-samsung-1-14.tar.gz

# Transfer file (example using scp)
scp ador-samsung-1-14.tar.gz user@target-system:/path/to/destination/

# On target system
gunzip -c ador-samsung-1-14.tar.gz | docker load
```

## Running Containers

### Basic Run

```bash
# Run in detached mode
docker run -d --name cms-noc ador-samsung-1-14:latest

# Run with auto-restart
docker run -d --name cms-noc --restart unless-stopped ador-samsung-1-14:latest
```

### Run with Environment Variables

```bash
docker run -d \
  --name cms-noc \
  --restart unless-stopped \
  -e SERVER_URL=https://your-cms-server.com/ \
  -e HARDWARE_URL=http://192.168.1.50:3001 \
  -e POLLING_INTERVAL=60 \
  ador-samsung-1-14:latest
```

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f cms-noc

# Stop services
docker-compose down
```

### View Container Logs

```bash
# View logs
docker logs cms-noc

# Follow logs
docker logs -f cms-noc

# View last 100 lines
docker logs --tail 100 cms-noc
```

## Troubleshooting

### 1. Build Errors

**Error**: `exec format error`
```bash
# Solution: Build for correct architecture
docker build --platform linux/amd64 -t ador-samsung-1-14:latest .
```

**Error**: `no space left on device`
```bash
# Clean up Docker system
docker system prune -a
```

### 2. Runtime Issues

**Container exits immediately**
```bash
# Check logs
docker logs cms-noc

# Run interactively for debugging
docker run -it --rm ador-samsung-1-14:latest /bin/sh
```

**Permission denied errors**
```bash
# Run with specific user
docker run -d --user 1000:1000 ador-samsung-1-14:latest
```

### 3. Network Issues

**Cannot connect to hardware**
```bash
# Run with host network
docker run -d --network host ador-samsung-1-14:latest

# Or use custom network
docker network create cms-network
docker run -d --network cms-network ador-samsung-1-14:latest
```

## Best Practices

### 1. Security
- Always use non-root user in production
- Keep base images updated
- Scan images for vulnerabilities:
  ```bash
  docker scan ador-samsung-1-14:latest
  ```

### 2. Image Optimization
- Use `.dockerignore` to exclude unnecessary files
- Leverage build cache with proper layer ordering
- Remove unnecessary packages and files

### 3. Tagging Strategy
```bash
# Semantic versioning
docker tag ador-samsung-1-14:latest ador-samsung-1-14:1.14.6
docker tag ador-samsung-1-14:latest ador-samsung-1-14:1.14
docker tag ador-samsung-1-14:latest ador-samsung-1-14:1

# Environment tags
docker tag ador-samsung-1-14:latest ador-samsung-1-14:production
docker tag ador-samsung-1-14:latest ador-samsung-1-14:staging
```

### 4. Multi-Stage Build Example
```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc python3-dev
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
COPY cms_script.py .
CMD ["python", "-u", "cms_script.py"]
```

### 5. Health Checks
Add health checks to monitor container status:
```dockerfile
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3001/health', timeout=5)" || exit 1
```

## Automated Build Script

Use the provided `build.sh` script:
```bash
# Make executable
chmod +x build.sh

# Run build
./build.sh
```

## Environment Variables

### Available Configuration
- `SERVER_URL`: CMS server URL (default: https://quenchcms.com/)
- `HARDWARE_URL`: Hardware endpoint URL (default: http://10.20.27.50:3001)
- `POLLING_INTERVAL`: Polling interval in seconds (default: 60)
- `MAX_STATE_LOG_LINES`: Maximum state log lines (default: 60000)
- `MAX_EVENT_STATE_LOG_LINES`: Maximum event log lines (default: 1000)

### Using .env file
```bash
# Copy example
cp .env.example .env

# Edit configuration
nano .env

# Run with env file
docker run -d --env-file .env ador-samsung-1-14:latest
```

## Maintenance

### Update Image
```bash
# Pull latest base image
docker pull python:3.11-slim

# Rebuild
docker build -f Dockerfile.optimized -t ador-samsung-1-14:latest .

# Remove old image
docker image prune
```

### Backup and Restore
```bash
# Backup
docker save ador-samsung-1-14:latest | gzip > ador-samsung-1-14_backup_$(date +%Y%m%d).tar.gz

# Restore
gunzip -c ador-samsung-1-14_backup_20240816.tar.gz | docker load
```

## Summary Commands Cheatsheet

```bash
# Build for x86_64
docker build -f Dockerfile.optimized -t ador-samsung-1-14:latest .

# Build for ARM64
docker buildx build --platform linux/arm64 -f Dockerfile -t ador-samsung-1-14:latest --output type=docker,dest=- . | gzip > ador-samsung-1-14.tar.gz

# Save image
docker save ador-samsung-1-14:latest | gzip > ador-samsung-1-14.tar.gz

# Load image
gunzip -c ador-samsung-1-14.tar.gz | docker load

# Run container
docker run -d --name cms-noc --restart unless-stopped ador-samsung-1-14:latest

# View logs
docker logs -f cms-noc

# Stop container
docker stop cms-noc

# Remove container
docker rm cms-noc
```

---

*Last Updated: August 2025*
*Version: 1.14.6*