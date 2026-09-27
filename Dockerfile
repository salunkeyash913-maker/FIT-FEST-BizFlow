# Standard Node.js Dockerfile for Google Cloud Run
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy source files
COPY . .

# Expose port 8080 (Cloud Run standard port)
EXPOSE 8080

# Set default environment variable
ENV PORT=8080

# Command to run application
CMD ["npm", "start"]
