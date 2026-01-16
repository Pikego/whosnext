FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
