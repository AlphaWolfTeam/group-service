# Build Stage
FROM node:13.12-alpine
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json", "./"]
RUN npm install --silent
COPY . .
EXPOSE 8000
CMD npm run test