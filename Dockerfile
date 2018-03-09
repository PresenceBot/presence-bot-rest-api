FROM node:8

RUN npm install -g pm2
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

EXPOSE 4000
RUN npm install
CMD ["pm2-runtime", "src/index.js"]
