FROM nginx:alpine

# The official entrypoint renders this at startup, so port changes need no image rebuild.
ENV COINAGE_API_PORT=3333 \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
    NGINX_ENVSUBST_FILTER=^COINAGE_API_PORT$
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

EXPOSE 80

WORKDIR /usr/share/nginx/html
COPY ./dist/packages/coinage-webapp .
