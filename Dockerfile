FROM node:18.18.2-alpine3.18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Shell form so `&` backgrounds webpack watch. The server stays in the foreground.
CMD ["sh", "-c", "npm run watch & exec npm run start"]
