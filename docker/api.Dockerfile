FROM node:26.4.0

ADD package.json /tmp/package.json
ADD yarn.lock /tmp/yarn.lock
ADD .yarnrc.yml /tmp/.yarnrc.yml
RUN npm install --global --force corepack@0.36.0 && corepack enable
ENV YARN_NODE_LINKER=node-modules
RUN cd /tmp && CYPRESS_INSTALL_BINARY=0 yarn install --immutable
RUN mkdir -p /app/api && cp -a /tmp/node_modules /app/api/

WORKDIR /app/api
COPY dist/packages/coinage-api/ /app/api

EXPOSE 3333

CMD [ "node", "main.js" ]
