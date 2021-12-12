FROM node:16

RUN yarn global add nodemon

ADD package.json /tmp/package.json
ADD yarn.lock /tmp/yarn.lock
RUN cd /tmp && yarn install --prod --ignore-scripts
RUN mkdir -p /app/api && cp -a /tmp/node_modules /app/api/

WORKDIR /app/api
COPY dist/apps/api/ /app/api

EXPOSE 3333

CMD [ "nodemon", "main.js" ]