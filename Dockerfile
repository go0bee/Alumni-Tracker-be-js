# Use the official Playwright image as base
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port defined in src/server.js
EXPOSE 8005

# Start the application
CMD ["npm", "start"]
