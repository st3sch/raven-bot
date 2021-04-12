FROM node:14.16

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./

USER node

COPY --chown=node:node . .

RUN npm install

CMD ["node", "src/main.js" ]
