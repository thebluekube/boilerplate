FROM node:20-alpine

WORKDIR /app

# Install tzdata and set timezone
RUN apk add --no-cache tzdata
ENV TZ=America/New_York

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["node", "src/app.js"] 