import axios from 'axios';

const API_BASE = '/api';

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  // If ISO or YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // If contains time T
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  // Try bg format dd.MM.yyyy (optionally with " г.")
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  return dateStr; // fallback
};

const formatTs = (dateStr, timeFallback = '00:00:00') => {
  const d = normalizeDate(dateStr);
  if (!d) return null;
  return `${d} ${timeFallback}`;
};

const PromotionService = {
  createPromotion: async ({ itemDbId, itemId, promoPrice, startDate, endDate }) => {
    const token = localStorage.getItem('token');
    const startAt = formatTs(startDate, '00:00:00');
    const endAt = formatTs(endDate, '23:59:59');
    const body = { itemDbId, itemId, promoPrice, startAt, endAt };
    console.log('PromotionService.createPromotion body:', body);
    const resp = await axios.post(`${API_BASE}/admin/promotions`, body, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.data;
  }
  ,
  getActivePromotions: async () => {
    const token = localStorage.getItem('token');
    const resp = await axios.get(`${API_BASE}/admin/promotions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.data;
  },
  deletePromotion: async (id) => {
    const token = localStorage.getItem('token');
    const resp = await axios.delete(`${API_BASE}/admin/promotions/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.data;
  }
};

export default PromotionService;


