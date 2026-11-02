FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

WORKDIR /usr/share/nginx/html
COPY ./dist/packages/coinage-webapp .
