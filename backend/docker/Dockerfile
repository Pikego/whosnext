FROM node:22-alpine AS base
WORKDIR /app
RUN npm install --global fastify-cli

FROM base AS dev
CMD ["npm", "run", "dev"]

FROM base AS prod
COPY . .
RUN npm ci --only=production
CMD ["npm", "start"]
