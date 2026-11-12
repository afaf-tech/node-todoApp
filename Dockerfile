FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY views ./views
COPY public ./public

USER node

EXPOSE 7000

CMD ["node", "src/server.js"]
