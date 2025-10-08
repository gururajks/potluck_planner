FROM node:20-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --omit=dev

COPY src ./src
COPY public ./public

EXPOSE 8080
CMD ["npm", "start"]


