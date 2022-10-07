# build stage
FROM docker.io/library/node:18 AS builder

ARG USER=virgin
ARG APP_DIR=/home/${USER}/app

RUN useradd "$USER" \
      --create-home;
RUN mkdir -p "$APP_DIR"; \
    chown "$USER" "$APP_DIR"; \
    chown "$USER" /usr/local/lib/node_modules;
USER ${USER}
WORKDIR ${APP_DIR}

COPY --chown=${USER}:${USER} package*.json ./

RUN npm clean-install

COPY --chown=${USER}:${USER} . ./
RUN npm run build

# run stage
FROM docker.io/library/node:18 as runner
LABEL maintainer="louis@orleans.io"

ARG USER=virgin
ARG APP_DIR=~/app
ARG PORT=3000
EXPOSE $PORT/tcp

RUN useradd "$USER"
WORKDIR ${APP_DIR}

COPY --from=builder --chown=${USER} ${APP_DIR} ${APP_DIR}/

ENV PROC_DIR=/host/proc

RUN npm clean-install --only=production
CMD npm run start

# HEALTHCHECK CMD curl --fail localhost:${PORT}/health || exit 1
