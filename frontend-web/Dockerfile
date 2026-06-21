# Dockerfile frontend — React
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Démarrer le serveur de développement React
CMD ["npm", "start"]
