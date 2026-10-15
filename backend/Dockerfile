FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY bft_node.cjs sync_service.cjs ./

EXPOSE 3000

CMD ["node", "bft_node.cjs"]
