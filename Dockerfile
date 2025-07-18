FROM node:20-slim

COPY . /app

WORKDIR /app

RUN npm ci && npm run build


FROM schnitzler/mysqldump


CMD ["npm", "start"]