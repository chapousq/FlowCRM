FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .

RUN cd client && npm run build

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
