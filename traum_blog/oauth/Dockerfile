FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

# Drop privileges for runtime (use built-in node user)
USER node

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
