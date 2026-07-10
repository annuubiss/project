export const salesSeries = [
  { label: 'Янв', revenue: 42000, orders: 320, profit: 15200, visitors: 12400 },
  { label: 'Фев', revenue: 38500, orders: 298, profit: 13800, visitors: 11800 },
  { label: 'Мар', revenue: 51200, orders: 402, profit: 19600, visitors: 14900 },
  { label: 'Апр', revenue: 47800, orders: 375, profit: 17400, visitors: 13600 },
  { label: 'Май', revenue: 62400, orders: 486, profit: 24800, visitors: 17200 },
  { label: 'Июн', revenue: 58900, orders: 451, profit: 22100, visitors: 16400 },
  { label: 'Июл', revenue: 71200, orders: 542, profit: 29800, visitors: 19800 },
  { label: 'Авг', revenue: 68400, orders: 519, profit: 27600, visitors: 18900 },
  { label: 'Сен', revenue: 79800, orders: 604, profit: 33400, visitors: 21600 },
  { label: 'Окт', revenue: 84200, orders: 641, profit: 36200, visitors: 23100 },
  { label: 'Ноя', revenue: 91600, orders: 702, profit: 40100, visitors: 25400 },
  { label: 'Дек', revenue: 98400, orders: 758, profit: 44600, visitors: 27800 },
]

export const revenueSpark = [12, 18, 15, 22, 19, 27, 24, 31, 28, 36, 34, 42].map((v, i) => ({ i, v }))
export const ordersSpark = [8, 11, 9, 14, 12, 16, 15, 19, 22, 20, 26, 28].map((v, i) => ({ i, v }))
export const customersSpark = [4, 6, 5, 9, 8, 7, 11, 10, 13, 12, 15, 18].map((v, i) => ({ i, v }))
export const profitSpark = [6, 9, 7, 12, 10, 15, 13, 18, 16, 21, 24, 27].map((v, i) => ({ i, v }))

export const paymentMethods = [
  { name: 'Карта', value: 48, color: 'var(--chart-1)' },
  { name: 'Наличные', value: 24, color: 'var(--chart-2)' },
  { name: 'Перечисление', value: 18, color: 'var(--chart-3)' },
  { name: 'Электронный кошелек', value: 10, color: 'var(--chart-5)' },
]

export const topProducts = [
  { name: 'Казан чугунный 12 л', sold: 1240, revenue: '62 000 000 UZS', trend: 12.4 },
  { name: 'Сковорода 28 см', sold: 864, revenue: '51 840 000 UZS', trend: 8.1 },
  { name: 'Набор ножей 6 предметов', sold: 742, revenue: '37 100 000 UZS', trend: -2.3 },
  { name: 'Чайник электрический 1.7 л', sold: 610, revenue: '45 750 000 UZS', trend: 5.6 },
]

export const topCategories = [
  { name: 'Казаны', share: 42 },
  { name: 'Сковороды', share: 27 },
  { name: 'Кастрюли', share: 18 },
  { name: 'Кухонные принадлежности', share: 13 },
]

export const topCustomers = [
  { name: 'Абдулла Каримов', spend: '18 420 000 UZS', orders: 42, initials: 'АК' },
  { name: 'Мадина Алиева', spend: '14 200 000 UZS', orders: 31, initials: 'МА' },
  { name: 'Хуршид Нурматов', spend: '11 860 000 UZS', orders: 28, initials: 'ХН' },
]

export const recentActivity = [
  { text: 'Новая продажа #10428: Абдулла Каримов', time: '2 мин. назад', type: 'order' },
  { text: 'Поступила оплата: 2 400 000 UZS', time: '18 мин. назад', type: 'payment' },
  { text: 'Мало остатков: Сковорода 28 см', time: '41 мин. назад', type: 'alert' },
  { text: 'Добавлен клиент: Мадина Алиева', time: '1 ч. назад', type: 'user' },
  { text: 'Счет #INV-2231 отправлен', time: '2 ч. назад', type: 'invoice' },
]

export const inventoryAlerts = [
  { name: 'Сковорода 28 см', level: 12, status: 'low' as const },
  { name: 'Набор ножей 6 предметов', level: 4, status: 'critical' as const },
  { name: 'Чайник электрический 1.7 л', level: 0, status: 'out' as const },
]

export const transactions = [
  {
    invoice: 'INV-2231',
    customer: 'Абдулла Каримов',
    amount: '2 400 000 UZS',
    time: '10:24',
    status: 'Paid' as const,
  },
  {
    invoice: 'INV-2230',
    customer: 'Мадина Алиева',
    amount: '860 000 UZS',
    time: '09:51',
    status: 'Pending' as const,
  },
  {
    invoice: 'INV-2229',
    customer: 'Хуршид Нурматов',
    amount: '1 120 000 UZS',
    time: '09:12',
    status: 'Paid' as const,
  },
  {
    invoice: 'INV-2228',
    customer: 'Розничный покупатель',
    amount: '340 000 UZS',
    time: '08:47',
    status: 'Failed' as const,
  },
]

export const warehouse = [
  { label: 'В наличии', value: 82, tone: 'success' as const },
  { label: 'Ожидается', value: 46, tone: 'primary' as const },
  { label: 'Мало остатков', value: 24, tone: 'warning' as const },
  { label: 'Нет в наличии', value: 9, tone: 'danger' as const },
]

export type OrderStatus = 'Completed' | 'Processing' | 'Shipped' | 'Cancelled'
export type PayStatus = 'Paid' | 'Pending' | 'Failed'

export const recentOrders: {
  id: string
  customer: string
  initials: string
  products: string
  status: OrderStatus
  payment: PayStatus
  date: string
  amount: string
}[] = [
  {
    id: '#ORD-10428',
    customer: 'Абдулла Каримов',
    initials: 'АК',
    products: 'Казан +2',
    status: 'Completed',
    payment: 'Paid',
    date: '6 июл. 2026',
    amount: '2 400 000 UZS',
  },
  {
    id: '#ORD-10427',
    customer: 'Мадина Алиева',
    initials: 'МА',
    products: 'Сковорода 28 см',
    status: 'Processing',
    payment: 'Pending',
    date: '6 июл. 2026',
    amount: '860 000 UZS',
  },
  {
    id: '#ORD-10426',
    customer: 'Хуршид Нурматов',
    initials: 'ХН',
    products: 'Набор ножей +1',
    status: 'Shipped',
    payment: 'Paid',
    date: '5 июл. 2026',
    amount: '1 120 000 UZS',
  },
  {
    id: '#ORD-10425',
    customer: 'Розничный покупатель',
    initials: 'РП',
    products: 'Чайник',
    status: 'Cancelled',
    payment: 'Failed',
    date: '5 июл. 2026',
    amount: '340 000 UZS',
  },
  {
    id: '#ORD-10424',
    customer: 'Саида Рахимова',
    initials: 'СР',
    products: 'Крышка 28 см',
    status: 'Completed',
    payment: 'Paid',
    date: '4 июл. 2026',
    amount: '620 000 UZS',
  },
  {
    id: '#ORD-10423',
    customer: 'Оптовый клиент',
    initials: 'ОК',
    products: 'Кастрюля +3',
    status: 'Completed',
    payment: 'Paid',
    date: '4 июл. 2026',
    amount: '3 180 000 UZS',
  },
]
