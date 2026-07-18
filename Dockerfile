FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

COPY . .

RUN npm run build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
