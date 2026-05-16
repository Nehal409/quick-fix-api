FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache postgresql-client

RUN npm ci

COPY . .

RUN npm run prisma:generate

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

CMD ["npm", "run", "start"]
