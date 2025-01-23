# Use the official Node.js image to build the React app
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and other necessary files
COPY . .

# Build the React app for production
RUN npm run build

# Use a lightweight Nginx image to serve the built app
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Expose the port Nginx will use
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
