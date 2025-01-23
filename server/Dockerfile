# Use the official Node.js image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and .env
COPY . .

# Expose the port that the backend will run on
EXPOSE 3001

# Start the Node.js server
CMD ["npm", "start"]
