FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use --omit=dev if you have devDependencies not needed for runtime
RUN npm install --omit=dev 

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# The command to run the server will be specified in smithery.yaml
# Expose port if using SSE transport (adjust if needed)
# EXPOSE 3000 

# Default command (will be overridden by smithery.yaml)
CMD ["node", "dist/index.js"] 