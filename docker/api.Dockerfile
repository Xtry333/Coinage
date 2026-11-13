FROM node:26.4.0-slim AS dependencies

WORKDIR /app/api
RUN npm install --global --force corepack@0.36.0 && corepack enable
COPY dist/packages/coinage-api/package.json dist/packages/coinage-api/yarn.lock ./
COPY .yarnrc.yml ./
# Nx emits only the API's production dependencies and their pruned lockfile.
# Install on the target platform; never copy Windows/AMD64 node_modules to the Pi.
RUN yarn install --immutable

FROM node:26.4.0-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app/api
COPY --from=dependencies /app/api/node_modules ./node_modules
COPY dist/packages/coinage-api/ ./

EXPOSE 3333
CMD ["node", "main.js"]
