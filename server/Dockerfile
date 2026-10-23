FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
# Saved requests live here; docker-compose mounts a volume so they survive redeploys
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3001
CMD ["node", "server.js"]
