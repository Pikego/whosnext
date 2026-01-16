FROM node:lts-slim AS base

WORKDIR /app

RUN npm install --global fastify-cli

EXPOSE 3000

#
# DEV
#

FROM base AS dev

CMD [ "npm", "run", "dev" ]

#
# PROD
#

FROM base AS prod

COPY . .

RUN npm ci && \
    npm run build

CMD [ "npm", "start" ]
