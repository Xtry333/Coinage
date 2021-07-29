FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

EXPOSE 3333

WORKDIR /usr/share/nginx/html
COPY ./dist/apps/coinage .