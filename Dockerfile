FROM node:20-slim

RUN apt-get update && apt-get install -y mariadb-client 

COPY . /app

WORKDIR /app

RUN npm ci && npm run build

ENTRYPOINT ["/bin/bash"]
CMD ["npm", "start"]