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

RUN npm clean-install

COPY . ${APP_DIR}/
RUN npm run build
RUN rm -rf node_modules

# run stage
FROM docker.io/library/node:${NODE_VERSION}-slim as runner
LABEL maintainer="louis@orleans.io"

ARG USER
ARG APP_DIR

RUN useradd "$USER" --create-home;
WORKDIR ${APP_DIR}

COPY --from=builder ${APP_DIR} ${APP_DIR}/

RUN npm clean-install --omit=dev

ENV MIKRO_ORM_CACHE_DIR=/tmp/mikroorm-cache

ARG PORT=3000
EXPOSE $PORT/tcp
ENV PORT $PORT

# Ensure Chalk outputs colors
ENV FORCE_COLOR 1

USER ${USER}
CMD npm run start:prod

# HEALTHCHECK CMD curl --fail localhost:${PORT}/health || exit 1
