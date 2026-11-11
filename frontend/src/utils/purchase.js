const Url = import.meta.env.VITE_API_URL;

export const purchaseHeaders = [
  { title: 'STT', key: 'line_no', width: '56px', sortable: false },
  { title: 'MPN', key: 'mpn', width: '190px' },
  { title: 'NSX', key: 'manufacturer', width: '150px' },
  { title: 'Description', key: 'description', width: '280px' },
  { title: 'Ảnh', key: 'image_url', width: '56px', sortable: false },
  { title: 'QTY', key: 'quantity', width: '90px', align: 'end' },
  { title: 'SL mua', key: 'purchase_qty', width: '90px', align: 'end' },
  { title: 'Đơn giá', key: 'unit_price', width: '120px', align: 'end' },
  {
    title: 'Giá DigiKey',
    key: 'digikey_unit_price_usd',
    width: '120px',
    align: 'end',
  },
  {
    title: 'Thành tiền DigiKey',
    key: 'digikey_extended_price_usd',
    width: '150px',
    align: 'end',
  },
  {
    title: 'Tồn kho DigiKey',
    key: 'availability',
    width: '120px',
    align: 'end',
  },
  { title: 'Nguồn', key: 'sources', width: '180px' },
  { title: 'Trạng thái', key: 'status', width: '150px' },
];

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
});

export function formatUsd(value) {
  return usdFormatter.format(Number(value) || 0);
}

export function formatMoney(value) {
  return `${numberFormatter.format(Number(value) || 0)} đ`;
}

export function formatQty(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '';
  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
}

export function statusLabel(status) {
  return (
    {
      MATCHED: 'Có giá DigiKey',
      MOQ_APPLIED: 'Áp dụng MOQ',
      QUOTE_ONLY: 'Chỉ có giá BG',
      REFERENCE_PRICE: 'Giá tham khảo',
      NO_PRICE: 'Chưa có giá',
      NO_MATCH: 'Chưa có trong MyLists',
      UNMATCHED: 'Không khớp',
      MISSING_IN_LIST: 'Thiếu trong MyLists',
      DUPLICATE: 'Trùng MPN',
      NO_MPN: 'Thiếu MPN',
      BOM: 'Từ BOM',
      Draft: 'Nháp',
      Priced: 'Đã lấy giá',
    }[status] ||
    status ||
    '—'
  );
}

export function statusColor(status) {
  return (
    {
      MATCHED: 'success',
      MOQ_APPLIED: 'warning',
      QUOTE_ONLY: 'info',
      REFERENCE_PRICE: 'info',
      NO_PRICE: 'error',
      NO_MATCH: 'grey',
      UNMATCHED: 'warning',
      MISSING_IN_LIST: 'grey',
      DUPLICATE: 'warning',
      NO_MPN: 'error',
      BOM: 'primary',
      Draft: 'grey',
      Priced: 'success',
    }[status] || 'grey'
  );
}

export function sourceLabel(sourceType) {
  return sourceType === 'quote' ? 'Mã báo giá' : 'File BOM';
}

export function componentImageUrl(row) {
  const raw = row?.image_url || row?.thumbnail_url || '';
  if (!raw) return '';
  return `${Url}/DigiKey/image?inline=1&url=${encodeURIComponent(raw)}`;
}

export function sourcesText(row) {
  const sources = Array.isArray(row?.sources) ? row.sources : [];
  return sources.length ? sources.join(', ') : '—';
}
