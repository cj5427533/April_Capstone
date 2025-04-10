reserveBtn.addEventListener('click', () => {
  fetch('http://localhost:3000/api/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_id: 1,
      user_name: '홍길동',
      date: '2025-04-04',
      start_time: '10:00',
      end_time: '12:00'
    })
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(err => alert('예약 실패: ' + err));
});

// ✅ 예약 삭제 (예: id = 1 삭제)
document.getElementById('autoDeleteBtn').addEventListener('click', () => {
  fetch('http://localhost:3000/api/reserve/latest', {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(err => alert("삭제 실패: " + err));
});
