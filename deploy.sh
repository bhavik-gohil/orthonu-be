#!/bin/bash

echo "Starting deployment for Backend..."

# Build the Docker image
echo "Building image 'be'..."
docker build -t be .

# Stop and remove the existing container if it exists
echo "Stopping and removing existing container..."
docker stop be || true
docker rm be || true

# Ensure the uploads directory exists on the host machine
mkdir -p public/uploads

# Run the new container
# - Port 3100 mapped for frontend consumption
# - Volume added for persistent file uploads
# - Using .env file if it exists
echo "Starting new container 'be' on port 3100..."

if [ -f .env ]; then
  ENV_ARG="--env-file .env"
else
  ENV_ARG=""
fi

docker run -d \
  --name be \
  -p 3100:3100 \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -e PORT=3100 \
  $ENV_ARG \
  be

echo "Backend deployed successfully!"
