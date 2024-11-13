# Node.js 공식 이미지 사용
FROM node:20

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사
COPY package.json package-lock.json /app/

# 의존성 설치
RUN npm install

# 애플리케이션 코드 복사
COPY . /app/

# 애플리케이션 포트 열기
EXPOSE 5500

# 애플리케이션 시작
CMD ["npm", "start"]
