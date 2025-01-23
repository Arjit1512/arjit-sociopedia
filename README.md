# SocioPedia - Social Networking App

SocioPedia is a social networking application that allows users to create profiles, manage friendships, chat with other users, post content, and like/share posts. The app is built with a modern tech stack and leverages cloud hosting for scalability.

## Deployment
1. On AWS Elastic Beanstalk: http://sociopedia-application.us-east-1.elasticbeanstalk.com
2. On Vercel: https://arjit-sociopedia.vercel.app

## Features
- User profile management
- Chat feature for real-time communication
- Like and share posts
- Friend management (Add, remove)
- Post content creation and sharing

## Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Cloud Services:** AWS (Elastic Beanstalk, S3, ECR)
- **Containerization:** Docker
- **Authentication:** JWT

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Docker
- AWS Account

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Arjit1512/arjit-sociopedia.git
2. Navigate to the project directory:

   Install the required dependencies:
   Set up the environment variables in a .env file (refer to .env.example for the required variables).
   ```bash
   npm install

3. Start the application:
   ```bash
   npm start

### Deployment on AWS
Use AWS S3 for scalable storage of images and posts.
Deploy the client and server on AWS Elastic Beanstalk for cloud hosting and scalability.
Manage containerized client and server apps with Amazon ECR.
