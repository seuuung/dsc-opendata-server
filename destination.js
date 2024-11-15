const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws'); // WebSocket 서버 추가

const app = express();
const port = 5500;

const parkingCounts = {};
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// HTTP 서버
app.get('/', (req, res) => {
    res.json(parkingCounts);
});

// WebSocket 서버
const server = app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

const wss = new WebSocket.Server({ server });

// WebSocket 클라이언트 연결 이벤트
wss.on('connection', (ws) => {
    console.log('웹소켓 클라이언트 연결됨');

    // 클라이언트에게 ping 메시지를 주기적으로 전송
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 30000); // 30초마다 ping 메시지 전송

    // 클라이언트가 pong 응답을 보내면 로그 출력
    ws.on('pong', () => {
        console.log('pong 응답 받음');
    });

    // 클라이언트 연결 종료 시 pingInterval 클리어
    ws.on('close', () => {
        clearInterval(pingInterval);
        console.log('웹소켓 클라이언트 연결 종료됨');
    });

    // 클라이언트로 초기 상태 전송
    ws.send(JSON.stringify({ type: 'initial', data: parkingCounts }));

    // 주차장 카운트 업데이트 시 클라이언트로 전송
    ws.on('message', (message) => {
        console.log('메시지 수신:', message);
    });
});

// 목적지 설정/해제 요청 처리
app.post('/destination', (req, res) => {
    const { action, data } = req.body;

    if (!action || !data || !data.placeName) {
        return res.status(400).json({ message: 'action과 placeName을 제공해야 합니다.' });
    }

    const placeName = decodeURIComponent(data.placeName);

    if (!parkingCounts[placeName]) {
        parkingCounts[placeName] = 0;
    }

    if (action === 'set') {
        parkingCounts[placeName]++;
    } else if (action === 'unset') {
        parkingCounts[placeName] = Math.max(0, parkingCounts[placeName] - 1);
    } else {
        return res.status(400).json({ message: '유효하지 않은 action입니다.' });
    }

    // 실시간 데이터 전송
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
                type: 'update', 
                data: { placeName, count: parkingCounts[placeName] } 
            }));
        }
    });

    res.json({ 
        message: '요청이 성공적으로 처리되었습니다.', 
        currentCount: parkingCounts[placeName] 
    });
});

// 초기 데이터 요청 처리
app.get('/getParkingData', (req, res) => {
    const { placeName } = req.query;

    // 데이터가 없으면 0을 반환
    if (!placeName || !parkingCounts[placeName]) {
        return res.json({ count: 0 });
    }

    const count = parkingCounts[placeName];
    res.json({ count });
});
