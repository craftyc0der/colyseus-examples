FROM node:14

WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# RUN npm ci
# run this for production
RUN npm ci --only=production

COPY . .

ENV PORT 8080

EXPOSE 8080

CMD [ "npm", "start" ]