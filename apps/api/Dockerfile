FROM node:22-bookworm-slim AS build
WORKDIR /workspace

COPY package*.json ./apps/api/
COPY prisma ./prisma
COPY apps/api ./apps/api

WORKDIR /workspace/apps/api
RUN npm ci
RUN npx prisma generate --schema ../../prisma/schema.prisma
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /workspace
ENV NODE_ENV=production

COPY --from=build /workspace/apps/api/package*.json ./apps/api/
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/prisma ./prisma

WORKDIR /workspace/apps/api
EXPOSE 10000
CMD ["sh", "-c", "npx prisma migrate deploy --schema ../../prisma/schema.prisma && node dist/src/main.js"]
