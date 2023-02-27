ARG USER=vbot
ARG APP_DIR=/home/${USER}/app
ARG NODE_VERSION=18

# build stage
FROM docker.io/library/node:${NODE_VERSION}-slim AS builder

ARG USER
ARG APP_DIR

RUN useradd "$USER" --create-home;
RUN mkdir -p "$APP_DIR"; \
    chown "$USER" "$APP_DIR"; \
    chown "$USER" /usr/local/lib/node_modules;
WORKDIR ${APP_DIR}

COPY package*.json ${APP_DIR}/
RUN npm install

COPY . ${APP_DIR}/
RUN npm run build
RUN rm -rf node_modules

# run stage
FROM docker.io/library/node:${NODE_VERSION}-slim as runner
LABEL \
  maintainer="louis@orleans.io" \
  org.opencontainers.image.source="https://github.com/Virginity-Bot/virginity-bot" \
  org.opencontainers.image.title="virginity-bot3" \
  org.opencontainers.image.description="A Discord Bot to track peoples' time in VC." \
  org.opencontainers.image.licenses="AGPL-3.0"

ARG USER
ARG APP_DIR

RUN DEBIAN_FRONTEND=noninteractive apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  curl

RUN useradd "$USER" --create-home;
WORKDIR ${APP_DIR}

COPY package*.json ${APP_DIR}/
RUN npm install --omit=dev

ENV MIKRO_ORM_CACHE_DIR=/tmp/mikroorm-cache

ARG PORT=3000
EXPOSE $PORT/tcp
ENV PORT $PORT

# Ensure Chalk outputs colors
ENV FORCE_COLOR 1

COPY --from=builder ${APP_DIR} ${APP_DIR}/

USER ${USER}
CMD npm run start:prod

HEALTHCHECK CMD curl --fail localhost:${PORT}/health || exit 1
