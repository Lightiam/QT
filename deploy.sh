#!/bin/bash

# Build the Docker image
docker build -t quantum-platform .

# Run the container with environment variables
docker run -p 8080:8080 \
  -e IBM_QUANTUM_TOKEN=${IBM_QUANTUM_TOKEN} \
  -e RIGETTI_API_KEY=${RIGETTI_API_KEY} \
  -e GOOGLE_QUANTUM_CREDENTIALS=${GOOGLE_QUANTUM_CREDENTIALS} \
  -e MICROSOFT_QUANTUM_WORKSPACE=${MICROSOFT_QUANTUM_WORKSPACE} \
  -e JWT_SECRET_KEY=${JWT_SECRET_KEY} \
  -e OPENAI_API_KEY=${OPENAI_API_KEY} \
  quantum-platform
