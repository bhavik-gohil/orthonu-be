FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .

RUN mkdir -p public/uploads

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs public/uploads

USER appuser

EXPOSE 3100

CMD ["node", "index.js"]