FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install build tools for packages like psutil
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    musl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY cms_script.py .

# Run the application
CMD ["python", "cms_script.py"]
