const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DB에서 rooms + equipment 조회 API
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.building_name, r.room_number, r.seat_count,
             e.name AS equipment_name, e.quantity
      FROM rooms r
      LEFT JOIN equipment e ON r.id = e.room_id
      ORDER BY r.building_name;
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ DB 에러:', err);
    res.status(500).send('서버 오류');
  }
});

app.post('/api/reserve', async (req, res) => {
  const { room_id, user_name, date, start_time, end_time } = req.body;
  try {
    await pool.query(`
      INSERT INTO reservations (room_id, user_name, date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)`,
      [room_id, user_name, date, start_time, end_time]
    );
    res.status(201).json({ message: '예약 완료!' });
  } catch (err) {
    res.status(500).send('예약 실패');
  }
  app.delete('/api/reserve/latest', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id FROM reservations ORDER BY id DESC LIMIT 1'
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: '삭제할 예약이 없습니다.' });
      }
  
      const latestId = rows[0].id;
      await pool.query('DELETE FROM reservations WHERE id = ?', [latestId]);
  
      res.json({ message: `최근 예약(id: ${latestId})이 삭제되었습니다.` });
    } catch (err) {
      console.error('❌ 삭제 실패:', err);
      res.status(500).send('삭제 중 오류 발생');
    }
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(` 서버 실행 중: http://localhost:${PORT}`);
});

