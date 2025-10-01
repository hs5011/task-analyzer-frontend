import React, { useState } from 'react'

const API_URL = 'https://task-analyzer-api.onrender.com/analyze';

export default function App() {
  const [text, setText] = useState('Tôi muốn giao cho ông A làm việc với Hóc Môn và báo cáo lại cho tôi vào ngày 05/07');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null); // lưu full phản hồi
  const [data, setData] = useState(null);       // phần JSON trích xuất

  async function callApi() {
    setLoading(true); setError(''); setPayload(null); setData(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Input: text, Temperature: 0.9 })
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `${res.status} ${res.statusText}`);

      const json = raw ? JSON.parse(raw) : {};
      setPayload(json);
      // lấy phần JSON trích xuất (API của ta trả về { success, data, rawContent })
      setData(json?.data || null);
    } catch (e) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  // Map các khóa trả về từ LLM -> nhãn trên UI
  function pick(obj, keys) {
    for (const k of keys) {
      if (obj?.[k] != null && String(obj[k]).trim() !== '') return String(obj[k]);
    }
    return ''; // không có thì để trống
  }

  const lines = data ? [
    { label: 'Công việc',    value: pick(data, ['Nội dung', 'Công việc', 'Content', 'Task']) },
    { label: 'Người xử lý',  value: pick(data, ['Người thực hiện', 'Người xử lý', 'Assignee']) },
    { label: 'Hạn xử lý',    value: pick(data, ['Thời hạn', 'Hạn xử lý', 'Deadline']) },
    { label: 'Phối hợp',     value: pick(data, ['Người phối hợp', 'Phối hợp', 'Stakeholders']) },
    { label: 'Ưu tiên',      value: pick(data, ['Độ ưu tiên', 'Ưu tiên', 'Priority']) },
  ] : [];

  return (
    <div style={styles.wrap}>
      <h1>Task Analyzer (Frontend)</h1>

      {/* 1 textbox + 1 nút */}
      <div style={styles.row}>
  <textarea
    style={styles.textarea}
    rows={4}
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="Nhập nội dung giao việc..."
  />
  <button onClick={callApi} disabled={loading} style={styles.button}>
    {loading ? 'Đang gọi...' : 'Phân tích'}
  </button>
</div>

      {/* lỗi */}
      {error && <div style={styles.error}>❌ {error}</div>}

      {/* kết quả theo từng dòng */}
      {data && (
        <div style={styles.card}>
          <h2 style={{marginTop: 0}}>Kết quả phân tích</h2>
          {lines.map((item) => (
            <div key={item.label} style={{margin: '6px 0'}}>
              <b>{item.label}:</b> {item.value || <span style={{opacity:.6}}>(không có)</span>}
            </div>
          ))}
        </div>
      )}

      {/* debug (nếu cần xem thô) */}
      {payload && !data && (
        <div style={styles.card}>
          <b>Phản hồi API (raw):</b>
          <pre style={styles.pre}>{JSON.stringify(payload, null, 2)}</pre>
        </div>
      )}

      <p style={{marginTop: 16, color: '#666'}}>API: <code>{API_URL}</code></p>
    </div>
  )
}

const styles = {
  wrap: { maxWidth: 840, margin: '40px auto', padding: 20, fontFamily: 'system-ui, Arial, sans-serif' },
  // ↓ đổi layout: xếp dọc
  row: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 10, resize: 'vertical' },
  // (tuỳ chọn) nếu muốn căn phải, dùng alignSelf: 'flex-end'
  button: { padding: '12px 18px', fontWeight: 700, cursor: 'pointer', borderRadius: 10, alignSelf: 'flex-start' },
  error: { marginTop: 12, color: '#b00020' },
  card: { marginTop: 16, background: '#f7f7f7', border: '1px solid #ddd', padding: 18, borderRadius: 12 },
};

