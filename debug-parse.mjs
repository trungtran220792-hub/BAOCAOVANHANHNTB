import fs from 'fs';
import Papa from 'papaparse';

const csvText = fs.readFileSync('../[VẬN HÀNH] BÁO CÁO VẬN HÀNH_[VÙNG] BÁO CÁO XỬ LÝ THÀNH CÔNG TRONG NGÀY_Bảng tổng hợp (1).csv', 'utf-8');
const cleaned = csvText.replace(/^\uFEFF/, '');

const result = Papa.parse(cleaned, {
  header: true, skipEmptyLines: true,
  transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
});

console.log('Rows:', result.data.length);
console.log('Headers:', Object.keys(result.data[0]));
console.log('Row 0:', result.data[0]);
console.log('Row 0 Time:', result.data[0]['Time']);

// Simulate getColumn
const COLUMN_MAP = {
  volume: ['Volume', 'Sản lượng'],
  assignRate: ['% Gán', '% Gan', 'Gán', 'Assign'],
  gtcRate: ['% GTC', 'GTC', '% Giao thành công'],
  leadtime: ['Leadtime', 'Lead time', 'Thời gian giao'],
};

function getColumn(row, field) {
  const aliases = COLUMN_MAP[field] || [field];
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
  }
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const lower = alias.toLowerCase();
    for (const k of keys) {
      if (k.trim().toLowerCase() === lower) return row[k];
    }
  }
  return '';
}

let totalVol = 0, simGtcW = 0, simGanW = 0, simLt = 0, cnt = 0;
for (const row of result.data) {
  const vol = parseInt(String(getColumn(row, 'volume')).replace(/,/g, ''), 10) || 0;
  if (vol <= 0) continue;
  const gtc = parseFloat(String(getColumn(row, 'gtcRate')).replace(/,/g, '')) || 0;
  const gan = parseFloat(String(getColumn(row, 'assignRate')).replace(/,/g, '')) || 0;
  const lt = parseFloat(String(getColumn(row, 'leadtime')).replace(/,/g, '')) || 0;
  totalVol += vol; simGtcW += gtc * vol; simGanW += gan * vol; simLt += lt; cnt++;
}
console.log('\nRecords:', cnt, 'Volume:', totalVol);
console.log('GTC:', ((simGtcW / totalVol) * 100).toFixed(1) + '%');
console.log('GAN:', ((simGanW / totalVol) * 100).toFixed(1) + '%');
console.log('Leadtime:', (simLt / cnt).toFixed(1));
