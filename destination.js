const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const port = 5500;

const parkingCounts = {}; // 주차장별 목적지 카운트를 저장하는 객체
const corsOptions = {
    origin: '*', // 모든 출처 허용
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions)); // CORS 설정


// JSON 파싱 미들웨어
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json(parkingCounts);
});

// 주차장 정보를 가져오는 엔드포인트 (URL 디코딩 처리)
app.get('/:placeName', (req, res) => {
    const placeName = decodeURIComponent(req.params.placeName); // URL 디코딩
    res.send(`주차장 정보: ${placeName}`);
});

// 목적지 설정 및 해제 요청을 처리하는 엔드포인트
app.post('/destination', (req, res) => {
    const { action, data } = req.body;

    // 필수 파라미터 체크
    if (!action || !data || !data.placeName) {
        return res.status(400).json({ message: 'action과 placeName을 제공해야 합니다.' });
    }

    const placeName = decodeURIComponent(req.body.data.placeName); // URL 디코딩

    // 주차장 이름이 객체에 없으면 초기화
    if (!parkingCounts[placeName]) {
        parkingCounts[placeName] = 0;
    }

    // 목적지 설정 및 해제 처리
    if (action === 'set') {
        parkingCounts[placeName]++;
        console.log(`목적지 설정됨: ${placeName}, 현재 카운트: ${parkingCounts[placeName]}`);
    } else if (action === 'unset') {
        if (parkingCounts[placeName] > 0) {
            parkingCounts[placeName]--;
            console.log(`목적지 해제됨: ${placeName}, 현재 카운트: ${parkingCounts[placeName]}`);
        } else {
            console.log(`목적지 해제 요청이 있었지만 ${placeName}의 설정된 목적지가 없습니다.`);
        }
    } else {
        return res.status(400).json({ message: '유효하지 않은 action입니다. set 또는 unset이어야 합니다.' });
    }

    res.json({ message: '요청이 성공적으로 처리되었습니다.', currentCount: parkingCounts[placeName] });
});

// 특정 주차장의 현재 설정된 목적지 수를 조회하는 엔드포인트
app.get('/destination/count/:placeName', (req, res) => {
    const placeName = decodeURIComponent(req.params.placeName); // URL 디코딩 처리

    // 주차장 이름이 객체에 없으면 초기화
    if (!parkingCounts[placeName]) {
        parkingCounts[placeName] = 0;
    }

    // 해당 주차장의 현재 설정된 목적지 수 반환
    res.json({ 
        placeName, 
        count: parkingCounts[placeName] // 여기서 'count'로 반환
    });
});

// 모든 주차장의 카운트 상태를 반환하는 엔드포인트
app.get('/destination/count', (req, res) => {
    res.json(parkingCounts);
});

// 서버가 실행 중일 때
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
