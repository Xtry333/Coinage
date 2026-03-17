FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8100

WORKDIR /usr/share/nginx/html
COPY ./dist/packages/coinage-webapp .