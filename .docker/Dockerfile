FROM node:12.18.4-buster-slim

LABEL maintainer="buildmaster@rocket.chat"

# dependencies
RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -m -g rocketchat rocketchat \
    && mkdir -p /built_app/uploads \
    && chown -R rocketchat:rocketchat /built_app/ \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig git

ADD . /not_built_app

# install meteor and build production ready rocket chat 

RUN apt-get -y install curl \
    # && curl https://install.meteor.com/ | sh \
    # && cd /not_built_app \
    # && ls \
    # && meteor build --directory /tmp/built_app/ \
    && chown -R rocketchat:rocketchat /not_built_app/ 
    # && cp -rp /tmp/built_app/* /built_app \
    # && rm -r /not_built_app \
    # && rm -r /tmp/build_app

USER rocketchat

RUN curl https://install.meteor.com/ | sh \
    && PATH=$PATH:$HOME/.meteor \
    && cd /not_built_app/ \
    && ls \
    && meteor npm install \
    && meteor build --directory /built_app/ \
    && rm package-lock.json 
    # && sudo chown -Rh rocketchat:rocketchat .meteor/local \
    # && cp -rp /tmp/built_app/* /built_app \
    # && rm -r /not_built_app/
    # && rm -r /tmp/build_app

USER root
# USER rocketchat

# RUN cd /not_built_app \
#     && meteor build --directory /tmp/built_app/ \
#     && cp -rp /tmp/built_app/* /built_app 

# USER root

# RUN rm -r /not_built_app \
#     && rm -r /tmp/build_app

# ENV METEOR_ALLOW_SUPER_USER=true

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
    && chown -R rocketchat:rocketchat /built_app \
    && rm -r /not_built_app/

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
