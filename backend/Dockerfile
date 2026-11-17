FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY server.js ./server.js
COPY migrations ./migrations
COPY scripts ./scripts
COPY public ./public
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "start"]
