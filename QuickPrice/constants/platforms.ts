export const PLATFORMS = [
  { id: 'zepto',      name: 'Zepto',            shortName: 'Z',  color: '#7B2FBE', bg: '#F3E8FF' },
  { id: 'blinkit',    name: 'Blinkit',           shortName: 'B',  color: '#E8A900', bg: '#FFFBEA' },
  { id: 'bigbasket',  name: 'BigBasket',         shortName: 'BB', color: '#84C225', bg: '#F0F9E8' },
  { id: 'amazon',    name: 'Amazon',            shortName: 'A',  color: '#FF9900', bg: '#FFF4E6' },
  { id: 'flipkart',  name: 'Flipkart Minutes',  shortName: 'FM', color: '#2874F0', bg: '#E8F0FE' },
];

export type PlatformId = 'zepto' | 'blinkit' | 'bigbasket' | 'amazon' | 'flipkart';

export type PriceInfo = {
  price: number;
  mrp: number;
  imageUrl?: string;
} | null;

export type Product = {
  name: string;
  brand: string;
  prices: Record<PlatformId, PriceInfo>;
};
