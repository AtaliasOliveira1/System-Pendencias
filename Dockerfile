FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000
# CMD [ "node", "server.js" ]
CMD ["bash", "start.sh"]

# Se seu start.sh tinha lógica especial, use:
# CMD ["bash", "start.sh"]