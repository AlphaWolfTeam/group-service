# Build Stage
FROM node:13.12-alpine
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json", "./"]
RUN npm install --silent
COPY . .
RUN npm run build

FROM node:13.12-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json", "./"]
COPY --from=0 /usr/src/app/dist ./dist
RUN npm install --silent
EXPOSE 8000
CMD npm run serve