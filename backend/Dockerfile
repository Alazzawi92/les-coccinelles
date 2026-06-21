# Dockerfile backend — Node.js + Express
FROM node:20-alpine

# Dossier de travail dans le container
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Exposer le port backend
EXPOSE 3001

# Démarrer le serveur avec nodemon en développement
CMD ["npm", "run", "dev"]
