# Use official Node image
FROM node:18-slim

# Set working directory inside container
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json .

# Install dependencies
RUN npm install

# Copy rest of frontend code
COPY . .

# Expose port 5173
EXPOSE 5173

# Command to run the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
