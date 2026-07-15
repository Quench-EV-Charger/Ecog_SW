#!/bin/bash
# ============================================================
# build.sh — Build ador-samsung and ador-intel Docker images
# Usage: ./build.sh <version>
# Example: ./build.sh 26
# ============================================================

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 26"
    exit 1
fi

SAMSUNG_TAG="ador-samsung-1-${VERSION}"
INTEL_TAG="ador-intel-1-${VERSION}"
SAMSUNG_OUT="${SAMSUNG_TAG}.tar"
INTEL_OUT="${INTEL_TAG}.tar"

echo "============================================================"
echo " Building version: 1-${VERSION}"
echo " Samsung (ARM64): ${SAMSUNG_OUT}"
echo " Intel   (AMD64): ${INTEL_OUT}"
echo "============================================================"

cd "$(dirname "$0")"

# Build both platforms in parallel
echo ""
echo "[1/2] Starting ARM64 (Samsung) build..."
docker buildx build --platform linux/arm64 -f Dockerfile -t "${SAMSUNG_TAG}:latest" \
    --output type=docker,dest="${SAMSUNG_OUT}" . 2>/tmp/build_samsung.log &
PID_SAMSUNG=$!

echo "[2/2] Starting AMD64 (Intel) build..."
docker buildx build --platform linux/amd64 -f Dockerfile -t "${INTEL_TAG}:latest" \
    --output type=docker,dest="${INTEL_OUT}" . 2>/tmp/build_intel.log &
PID_INTEL=$!

# Wait for both and capture exit codes
echo ""
echo "Waiting for builds to complete..."

FAIL=0

wait $PID_SAMSUNG && echo "[Samsung] Build SUCCESS" || { echo "[Samsung] Build FAILED — see /tmp/build_samsung.log"; FAIL=1; }
wait $PID_INTEL   && echo "[Intel]   Build SUCCESS" || { echo "[Intel]   Build FAILED — see /tmp/build_intel.log"; FAIL=1; }

if [ $FAIL -ne 0 ]; then
    echo ""
    echo "One or more builds failed."
    exit 1
fi

echo ""
echo "============================================================"
echo " Done!"
ls -lh "${SAMSUNG_OUT}" "${INTEL_OUT}"
echo "============================================================"
