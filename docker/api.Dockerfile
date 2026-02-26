FROM node:18

ADD package.json /tmp/package.json
ADD yarn.lock /tmp/yarn.lock
RUN corepack enable && corepack prepare yarn@3.3.1 --activate
ENV YARN_NODE_LINKER=node-modules
RUN cd /tmp && yarn install --immutable
RUN mkdir -p /app/api && cp -a /tmp/node_modules /app/api/

WORKDIR /app/api
COPY dist/packages/coinage-api/ /app/api

EXPOSE 3333

CMD [ "node", "main.js" ]