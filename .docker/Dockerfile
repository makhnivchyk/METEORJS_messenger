FROM node:12.18.4-buster-slim

LABEL maintainer="buildmaster@rocket.chat"

# dependencies
RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /built_app/uploads \
    && chown rocketchat:rocketchat /built_app/uploads \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig

ADD . /not_built_app

# install meteor and build production ready rocket chat
RUN cd not_built_app \
    && apt-get -y install curl \
    && curl https://install.meteor.com/ | sh 

USER rocketchat
WORKDIR /not_built_app/

RUN meteor build --directory /built_app/ \
    && cd .. \
    && rm -r not_built_app

USER root

RUN aptMark="$(apt-mark showmanual)" \
    && apt-get install -y --no-install-recommends g++ make python ca-certificates \
    && cd /built_app/bundle/programs/server \
    && npm install \
    && apt-mark auto '.*' > /dev/null \
    && apt-mark manual $aptMark > /dev/null \
    && find /usr/local -type f -executable -exec ldd '{}' ';' \
       | awk '/=>/ { print $(NF-1) }' \
       | sort -u \
       | xargs -r dpkg-query --search \
       | cut -d: -f1 \
       | sort -u \
       | xargs -r apt-mark manual \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && npm cache clear --force \
    && chown -R rocketchat:rocketchat /built_app

USER rocketchat

VOLUME /built_app/uploads

WORKDIR /built_app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/built_app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
