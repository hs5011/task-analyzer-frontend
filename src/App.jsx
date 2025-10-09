import React, { useState, useMemo } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://task-analyzer-api.onrender.com/analyze';

export default function App() {
  const [text, setText] = useState(null);
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

      const json = raw ? safeParseJson(raw) : {};
      setPayload(json);
      // lấy phần JSON trích xuất (API trả { success, data, rawContent })
      setData(json?.data || null);
    } catch (e) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  // --- Helpers ---
  function safeParseJson(text) {
    try { return JSON.parse(text); } catch { return {}; }
  }

  // Lấy giá trị theo danh sách alias; nếu value là mảng -> join bằng ", ". Luôn trả về fallback nếu không có dữ liệu.
  function pick(obj, keys, fallback = '(chưa có thông tin)') {
    if (!obj || typeof obj !== 'object') return fallback;
    for (const k of keys) {
      const v = obj?.[k];
      if (v == null) continue;
      if (Array.isArray(v)) {
        const s = v.map(x => (x == null ? '' : String(x))).filter(Boolean).join(', ');
        if (s.trim() !== '') return s;
      } else {
        const s = String(v).trim();
        if (s !== '') return s;
      }
    }
    return fallback;
  }

  // Suy diễn “Ưu tiên” khi thiếu
  function inferPriority(taskObj, raw = '') {
    let pri = pick(taskObj, ['Độ ưu tiên', 'Ưu tiên', 'Priority']);
    if (pri) return pri;
    const txt = (raw + ' ' + JSON.stringify(taskObj)).toLowerCase();
    if (/gấp|khẩn|cấp\s*bách|cần\s*ngay|cao\s*độ/.test(txt)) return 'khẩn cấp';
    if (/gấp|high/.test(txt)) return 'gấp';
    if (/thấp|low/.test(txt)) return 'thấp';
    if (/bình\s*thường|normal|medium/.test(txt)) return 'bình thường';
    return 'bình thường';
  }

  // Tạo 5 dòng hiển thị từ 1 task object, hỗ trợ mảng cho người/phối hợp
  function taskToLines(taskObj, raw) {
    return [
      { label: 'Công việc',    value: pick(taskObj, ['Nội dung', 'Công việc', 'Content', 'Task']) },
      { label: 'Người xử lý',  value: pick(taskObj, ['Người thực hiện', 'Người xử lý', 'Assignee', 'Thực hiện']) },
      { label: 'Hạn xử lý',    value: pick(taskObj, ['Thời hạn', 'Hạn xử lý', 'Deadline', 'Hạn']) },
      { label: 'Phối hợp',     value: pick(taskObj, ['Người phối hợp', 'Phối hợp', 'Stakeholders', 'Đơn vị phối hợp']) },
      { label: 'Ưu tiên',      value: inferPriority(taskObj, raw) },
    ];
  }

  // Chuẩn bị dữ liệu hiển thị: single vs multi
  const view = useMemo(() => {
    if (!data) return { type: 'none', content: [] };

    // Nếu API trả danh sách: data.tasks là mảng
    if (Array.isArray(data.tasks)) {
      const list = data.tasks.map((t, idx) => ({
        title: `Nhiệm vụ #${idx + 1}`,
        lines: taskToLines(t || {}, payload?.rawContent || '')
      }));
      return { type: 'multi', content: list };
    }

    // Object đơn như cũ
    return { type: 'single', content: taskToLines(data, payload?.rawContent || '') };
  }, [data, payload]);

  return (
    <div style={styles.wrap}>
      <h1>Task Analyzer (Frontend)</h1>

      {/* 1 textarea + 1 nút */}
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

      {/* Kết quả: object đơn */}
      {view.type === 'single' && view.content.length > 0 && (
        <div style={styles.card}>
          <h2 style={{marginTop: 0}}>Kết quả phân tích</h2>
          {view.content.map((item) => (
            <div key={item.label} style={{margin: '6px 0'}}>
              <b>{item.label}:</b> {item.value}
            </div>
          ))}
        </div>
      )}

      {/* Kết quả: nhiều nhiệm vụ */}
      {view.type === 'multi' && view.content.length > 0 && (
        <div style={styles.card}>
          <h2 style={{marginTop: 0}}>Kết quả phân tích (nhiều nhiệm vụ)</h2>
          {view.content.map((task, i) => (
            <div key={i} style={styles.taskBox}>
              <div style={styles.taskTitle}>{task.title}</div>
              {task.lines.map((item) => (
                <div key={item.label} style={{margin: '6px 0'}}>
                  <b>{item.label}:</b> {item.value}
                </div>
              ))}
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
  // ↓ xếp dọc: textarea trên, nút dưới
  row: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 10, resize: 'vertical' },
  // (tuỳ chọn) nếu muốn căn phải, dùng alignSelf: 'flex-end'
  button: { padding: '12px 18px', fontWeight: 700, cursor: 'pointer', borderRadius: 10, alignSelf: 'flex-start' },
  error: { marginTop: 12, color: '#b00020' },
  card: { marginTop: 16, background: '#f7f7f7', border: '1px solid #ddd', padding: 18, borderRadius: 12 },
  taskBox: { padding: 12, borderRadius: 10, border: '1px dashed #bbb', marginTop: 10, background: '#fff' },
  taskTitle: { fontWeight: 700, marginBottom: 6 },
  pre: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }
};
