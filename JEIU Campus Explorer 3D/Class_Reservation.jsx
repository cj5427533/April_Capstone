import React, { useState, useEffect } from 'react';
import './Class_Reservation.css';
import { createReservation, checkAvailability } from './예약시스템API';

const ClassReservation = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [purpose, setPurpose] = useState('');

  const classrooms = [
    { id: 1, name: '101', capacity: 30 },
    { id: 2, name: '102', capacity: 25 },
    { id: 3, name: '201', capacity: 40 },
    { id: 4, name: '202', capacity: 35 },
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  const [isAvailable, setIsAvailable] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (selectedDate && selectedTime && selectedRoom) {
      checkAvailability(selectedDate, selectedTime, selectedRoom)
        .then(response => {
          setIsAvailable(response.available);
          setMessage(response.message);
        });
    }
  }, [selectedDate, selectedTime, selectedRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable) {
      alert('선택하신 시간은 이미 예약되어 있습니다.');
      return;
    }

    try {
      const response = await createReservation({
        date: selectedDate,
        time: selectedTime,
        room: selectedRoom,
        purpose: purpose
      });

      if (response.success) {
        alert('예약이 완료되었습니다.');
        // 폼 초기화
        setSelectedDate('');
        setSelectedTime('');
        setSelectedRoom('');
        setPurpose('');
      } else {
        alert('예약 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('예약 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="reservation-container">
      <h1>강의실 예약 시스템</h1>
      
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label>날짜:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>시간:</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          >
            <option value="">시간을 선택하세요</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>강의실:</label>
          <div className="classroom-grid">
            {classrooms.map(room => (
              <button
                key={room.id}
                type="button"
                className={`classroom-button ${selectedRoom === room.name ? 'selected' : ''}`}
                onClick={() => setSelectedRoom(room.name)}
              >
                <div className="room-name">{room.name}</div>
                <div className="room-capacity">수용인원: {room.capacity}명</div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>사용 목적:</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="사용 목적을 입력하세요"
            required
          />
        </div>

        {message && (
          <div className={`availability-message ${isAvailable ? 'available' : 'unavailable'}`}>
            {message}
          </div>
        )}
        <button 
          type="submit" 
          className={`submit-button ${!isAvailable ? 'disabled' : ''}`}
          disabled={!isAvailable}
        >
          예약하기
        </button>
      </form>
    </div>
  );
};

export default ClassReservation;