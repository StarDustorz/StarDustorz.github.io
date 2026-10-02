# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
RUN npm install --global pnpm@10.33.0
WORKDIR /workspace
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY . .
ARG SITE_URL=http://127.0.0.1:8080
ARG LOCAL_ADMIN_URL=/admin/
ENV STARDUST_SITE_URL=${SITE_URL}
ENV STARDUST_LOCAL_ADMIN_URL=${LOCAL_ADMIN_URL}
RUN pnpm build
RUN sha256sum pnpm-lock.yaml | cut -d ' ' -f 1 > node_modules/.stardust-lock

FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install --no-install-recommends -y git gh ca-certificates ffmpeg libheif-examples nginx \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default \
    && npm install --global pnpm@10.33.0 \
    && git config --global --add safe.directory /workspace
WORKDIR /workspace
COPY --from=build /workspace/node_modules /opt/stardust/dependencies
COPY --from=build /workspace/dist /opt/stardust/initial-site
COPY . .
COPY docker/nginx.conf /etc/nginx/conf.d/stardust.conf
COPY docker/entrypoint.sh /usr/local/bin/stardust-entrypoint
RUN chmod +x /usr/local/bin/stardust-entrypoint
ENV NODE_ENV=development TZ=Asia/Shanghai STARDUST_CONTAINER=1 STARDUST_LOCAL_SITE=1 STARDUST_LOCAL_ADMIN_URL=/admin/
EXPOSE 8080 4322
ENTRYPOINT ["stardust-entrypoint"]
CMD ["pnpm", "admin"]
