const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 테스트 API
app.get('/api/test', (req, res) => {
  res.json({ message: '서버가 정상 작동합니다.' });
});

// 디버깅용 미들웨어 추가
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// ✅ [1] DB에서 rooms + equipment 조회
app.get('/api/rooms-with-equipment', async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT 
        rsv.id AS reservation_id,
        rsv.user_name,
        rsv.date,
        rsv.start_time,
        rsv.end_time,
        rm.building_name,
        rm.room_number
      FROM reservations rsv
      JOIN rooms rm ON rsv.room_id = rm.id
      ORDER BY rsv.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ DB 에러:', err);
    res.status(500).json({ error: '서버 오류', details: err.message });
  }
});

// ✅ [2] 건물별 방 목록 조회 API
app.get('/api/rooms', async (req, res) => {
  const building = req.query.building;
  console.log('요청된 건물:', building);
  
  if (!building) {
    return res.status(400).json({ error: '건물 이름이 필요합니다.' });
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT id, room_number, seat_count FROM rooms WHERE building_name = ? ORDER BY room_number',
      [building]
    );
    
    console.log('조회된 방 개수:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ 방 조회 실패:', err);
    res.status(500).json({ error: '조회 오류', details: err.message });
  }
});

// ✅ [3] 예약 등록 API
app.post('/api/reserve', async (req, res) => {
  console.log('예약 요청 데이터:', req.body);
  const { room_id, user_name, date, start_time, end_time, university_number } = req.body;

  // 필수 필드 확인
  if (!room_id || !user_name || !date || !start_time || !end_time) {
    return res.status(400).json({ 
      error: '모든 필드가 필요합니다.',
      received: { room_id, user_name, date, start_time, end_time, university_number }
    });
  }

  try {
    // room_id 존재 여부 확인
    const [roomCheck] = await pool.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
    if (roomCheck.length === 0) {
      return res.status(404).json({ error: `방 ID ${room_id}가 존재하지 않습니다.` });
    }

    // 시간 겹침 확인
    const [timeCheck] = await pool.query(
      `SELECT id FROM reservations 
       WHERE room_id = ? AND date = ? AND 
       ((start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?))`,
      [room_id, date, end_time, start_time, end_time, start_time, start_time, end_time]
    );

    if (timeCheck.length > 0) {
      return res.status(409).json({ error: '해당 시간에 이미 예약이 있습니다.' });
    }

    // 예약 추가 - university_number 포함
    const [result] = await pool.query(
      `INSERT INTO reservations (room_id, user_name, date, start_time, end_time, university_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [room_id, user_name, date, start_time, end_time, university_number || null]
    );
    
    console.log('예약 성공:', result);
    res.status(201).json({ 
      message: `${user_name}님(학번: ${university_number || '입력 없음'}) 예약이 완료되었습니다.`,
      reservation_id: result.insertId
    });
  } catch (err) {
    console.error('❌ 예약 실패:', err);
    res.status(500).json({ error: '예약 실패', details: err.message });
  }
});

// ✅ [4] 최근 예약 1건 삭제 API
app.delete('/api/reserve/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM reservations ORDER BY id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '최근 예약이 없습니다.' });
    }

    const latestId = rows[0].id;
    await pool.query('DELETE FROM reservations WHERE id = ?', [latestId]);

    res.json({ message: `최근 예약(id: ${latestId})이 삭제되었습니다.` });
  } catch (err) {
    console.error('❌ 삭제 실패:', err);
    res.status(500).json({ error: '삭제 중 오류 발생', details: err.message });
  }
});

// ✅ [5] 예약 가능 여부 확인 API (추가)
app.get('/api/check-availability', async (req, res) => {
  const { room_id, date, start_time, end_time } = req.query;
  
  if (!room_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: '모든 매개변수가 필요합니다.' });
  }
  
  try {
    // 해당 시간에 예약이 있는지 확인
    const [rows] = await pool.query(
      `SELECT * FROM reservations 
       WHERE room_id = ? AND date = ? AND 
       ((start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?))`,
      [room_id, date, end_time, start_time, end_time, start_time, start_time, end_time]
    );
    
    // 겹치는 예약이 없으면 가능
    const isAvailable = rows.length === 0;
    res.json({ available: isAvailable });
  } catch (err) {
    console.error('❌ 가용성 확인 실패:', err);
    res.status(500).json({ error: '서버 오류', details: err.message });
  }
});

// ✅ [6] 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
});

// ✅ 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});