# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Install required packages for downloading MCP server and process management
RUN apk add --no-cache supervisor wget ca-certificates

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Make MCP server executable
RUN chmod +x mcp-server.js

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S buildkite -u 1001 -G nodejs

# Change ownership of the app directory to the buildkite user
RUN chown -R buildkite:nodejs /app

# Expose the ports for both the app and MCP server
EXPOSE 8080 3001

# Environment variables for internal MCP server
ENV MCP_PORT=3001
ENV MCP_INTERNAL=true
ENV MCP_SERVER_URL=http://localhost:3001

# Health check for the main application
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start both services using supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
