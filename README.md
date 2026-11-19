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

To run without Docker, install:

- Node.js 18.18.2
- MongoDB 6.0.4

To run with Docker, you only need Docker. Compose starts Node 18.18.2 and MongoDB 6.0.4. See section 6.

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

A host run (`npm start`) needs a `.env` file:

1. Copy `.env.example` to `.env`.
2. Set `SESSION_SECRET` to a long random string. The process exits if it is missing.
3. Set `MONGODB_CONNECTION_STRING`. For MongoDB on the host, use `mongodb://localhost/messageDb`.

For tests, copy `.env.example` to `.env.test` and set those same variables for the test database.

Compose does not read this file. It sets the Mongo connection string and generates `SESSION_SECRET` when you do not pass one.

## 5. Execution

Start the server from the project root:

```bash
npm run start
```

It listens on `PORT`, or 3000 if that variable is unset. The public deploy sets `PORT=3001`.

Rebuild the Vue bundle into `public/js`:

```bash
npm run watch
```

That command does not start a second server.

Run the tests:

```bash
npm test
```


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
docker run -p 3000:3000 --network host \
  -e SESSION_SECRET=replace-me \
  -e MONGODB_CONNECTION_STRING=mongodb://localhost/messageDb \
  messages-app
```

`--network host` lets the container reach MongoDB on the host. The process exits if `SESSION_SECRET` is missing. Prefer Compose below.

### 6.4 Running with Docker Compose

Compose is the one-command boot. The host does not need Node 18.18.2 or a local MongoDB. From a clean clone:

```bash
docker compose up
```

That starts MongoDB 6.0.4 and the app image (`node:18.18.2-alpine3.18`). The app listens on port 3000 and connects to Mongo on the compose network. The connection string is set in `docker-compose.yml`; do not edit `.env` for this path. If `SESSION_SECRET` is unset, compose generates one and keeps it in the `session-secret` volume. Database files live in the `mongo-data` volume, so no host directory permissions are required.

Port 3000 must be free on the host. MongoDB is not published to the host. Open the app on the same host you publish, such as `http://127.0.0.1:3000`. `localhost` and `127.0.0.1` are different origins.

## 7. Behavior

- Login does not return the password hash. A wrong password or an unknown email returns 401 and shows `Email or password is incorrect`. Enter submits the login form.
- A duplicate username or email on signup returns 409 and shows that the account already exists.
- Creating a message, uploading a file, and deleting messages or rooms requires a session. A room URL without a session shows Login.
- Socket actions use the logged-in session, not the user id sent by the client.
- A room name is 1 to 40 characters of letters, numbers, and spaces. The URL slug is lowercase, without accents, with spaces as hyphens. An empty or already used slug is rejected.
- Add opens the new room. Other sessions see it without a reload.
- A room message is delivered only to clients in that room. Enter sends it. Shift+Enter inserts a newline. The panel scrolls to the latest message, and the cursor stays in the composer.
- A direct message is delivered to the recipient's session. If that chat is closed or minimized, the window opens again. After a reload, the open chat, its unsent text, and its history come back.
- A missing profile photo uses `/img/avatar.svg`. Profile shows the signed-in username and email.

## 8. Author
[Cristian Peralta](https://github.com/CristianPeralta)

## 9. License
This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.
