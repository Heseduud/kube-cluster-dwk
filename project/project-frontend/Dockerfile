# build
FROM node:alpine as build
WORKDIR /app
COPY ./package* ./
RUN npm ci
COPY . .
RUN npm run build

# serve static from nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
ENV REACT_APP_BACKENDURL=localhost:8081
CMD ["nginx", "-g", "daemon off;"]