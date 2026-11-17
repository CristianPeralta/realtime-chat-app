<div align="center">
   <h1>MessageRealTime Application </h1>
  <img src="https://img.shields.io/badge/Node.js-43853D" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-F7DF1E" alt="Express">
  <img src="https://img.shields.io/badge/-MongoDB-white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vue.js-35495E" alt="Vue.js">
  <img src="https://img.shields.io/badge/Sockets-21af90" alt="Sockets">
  <img src="https://img.shields.io/badge/-CRUD_Operations-red" alt="CRUD Operations">
  <img src="https://img.shields.io/badge/-Docker-blue" alt="Docker">
</div>
<br>

This project is a web application built with Node.js, Express, MongoDB, and Vue.js. The application provides a login system, group chat, direct messages, contacts, and user profile.

## 1. Requirements 

To run this application, you need to have the following installed on your computer:

- Node.js [versión 18.18.2]
- MongoDB [versión 6.0.4]

## 2. Technologies Used
  - Node.js [18.18.2]
  - Express [4.16.2]
  - MongoDB [6.0.4]
  - Vue.js [2.5.13]

## 3. Installation 

Run the following command to install the dependencies: 
```bash
npm install
```

## 4. Configuration

1.  Copy the `.env.example` file as `.env` and configure the necessary environment variables. `SESSION_SECRET` is required. The process exits if it is missing.
2.  If you want to run tests, also copy the `.env.example` file as `.env.test` and configure the necessary environment variables for testing.

## 5. Execution

To run the server, execute the following command in the project root:

```bash
npm run start
```
The server will start on port 3000

And for the client:

```bash
npm run watch
```
The client will start on port 3000


## 6. Docker

This documentation provides instructions on how to use Docker to build and run the Messages application. It covers building the Docker image, running the image with Docker, and using Docker Compose for more complex setups.

### 6.1 Prerequisites

Docker should be installed on your system. If you don't have Docker installed, please follow the [Docker installation guide](https://docs.docker.com/engine/install/).

### 6.2 Building the Docker Image

To build the Docker image for the Messages application, run the following command:
```bash
docker build -t messages-app .
```
### 6.3 Running the Docker Container
To run the Docker container with the Messages app image, use the following command:

```bash
docker run -p 3000:3000 --network host messages-app
```
Note: Using the --network host flag allows the container to consume the database from the host machine. If this is not available, consider using Docker Compose as described below.

### 6.4 Running with Docker Compose

Compose is the one-command boot. The host does not need Node 18.18.2 or a local MongoDB. From a clean clone:

```bash
docker compose up
```

That starts MongoDB 6.0.4 and the app image (`node:18.18.2-alpine3.18`). The app listens on port 3000 and connects to Mongo on the compose network. The connection string is set in `docker-compose.yml`; do not edit `.env` for this path. If `SESSION_SECRET` is unset, compose generates one and keeps it in the `session-secret` volume. Database files live in the `mongo-data` volume, so no host directory permissions are required.

Port 3000 must be free on the host. MongoDB is not published to the host.

## 7. Author
[Cristian Peralta](https://github.com/CristianPeralta)

## 8. License
This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.
