# Use Alpine Linux for even smaller size
FROM python:3.11-alpine AS builder

WORKDIR /app

# Install build dependencies for Alpine
RUN apk add --no-cache gcc musl-dev linux-headers

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-alpine

WORKDIR /app

# Install only runtime dependencies if needed
RUN apk add --no-cache libstdc++

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application
COPY cms_script.py .

# Run the application
CMD ["python", "-u", "cms_script.py"]