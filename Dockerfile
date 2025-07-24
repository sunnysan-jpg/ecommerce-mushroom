# Use Node.js base image
FROM node:22

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Make script executable
RUN chmod +x wait-for-it.sh

# Expose port (same as your app uses, e.g., 3000)
EXPOSE 5000

# Start the app
CMD ["./wait-for-it.sh", "postgres:5432", "--", "node", "server.js"]
