import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { PLATFORMS, Product, PlatformId, PriceInfo } from '../constants/platforms';

export type SearchResult = {
  query: string;
  pincode: string;
  products: Product[];
  timeTaken: number;
};

export async function searchProducts(query: string, pincode: string): Promise<SearchResult> {
  const response = await axios.get(`${API_BASE_URL}/api/search`, {
    params: { q: query, pincode },
    timeout: 60000,
  });

  const { results, timeTaken } = response.data;

  // Transform: from per-platform arrays to per-product rows
  // Collect all unique product names across all platforms
  const allProducts: Product[] = [];
  const nameIndex: Record<string, Product> = {};

  results.forEach(({ platform, products }: { platform: PlatformId; products: any[] }) => {
    products.forEach((p: any) => {
      const key = p.name.toLowerCase().trim().slice(0, 30);
      if (!nameIndex[key]) {
        nameIndex[key] = {
          name: p.name,
          brand: p.brand || '',
          prices: { zepto: null, blinkit: null, bigbasket: null, instamart: null, flipkart: null },
        };
        allProducts.push(nameIndex[key]);
      }
      nameIndex[key].prices[platform] = { price: p.price, mrp: p.mrp, imageUrl: p.imageUrl };
    });
  });

  return { query, pincode, products: allProducts, timeTaken };
}
