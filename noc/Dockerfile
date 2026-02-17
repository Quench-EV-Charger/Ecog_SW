# Use Alpine Linux for even smaller size
FROM python:3.11-alpine AS builder

WORKDIR /usr/src/app

# Update package manager and install build dependencies with retry logic
RUN apk update && \
    apk add --no-cache --virtual .build-deps gcc musl-dev linux-headers

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-alpine

WORKDIR /usr/src/app

# Update package manager before installing runtime dependencies
RUN apk update && \
    apk add --no-cache libstdc++

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application
COPY cms_script.py .

# Run the application
CMD ["python", "-u", "cms_script.py"]