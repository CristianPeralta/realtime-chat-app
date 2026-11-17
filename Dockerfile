FROM node:18.18.2-alpine3.18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Generates SESSION_SECRET when compose does not set one, then starts watch and the server.
CMD ["docker-entrypoint.sh"]
