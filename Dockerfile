FROM node:13.12-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json", "./"]
RUN npm install --production=false --silent
COPY . .

RUN chmod g+rwx -R /usr/src/app
RUN npm run build
CMD npm run serve

EXPOSE 8000