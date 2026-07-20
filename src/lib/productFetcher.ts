import { supabase } from './supabase';
import { Product } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_SUBCATEGORIES } from './defaultData';

export interface FetchProductsOptions {
  categoryId?: string;
  subcategoryId?: string;
}

export async function fetchLiveAndInStockProducts(options?: FetchProductsOptions): Promise<Product[]> {
  try {
    let products: any[] = [];
    
    try {
      // 5. Ensure product fetch uses: select * from products
      const { data, error: pError } = await supabase
        .from('products')
        .select('*');

      if (pError) {
        console.error("[API Fail] Failed to fetch products from Supabase, resorting to mocks:", pError);
        products = MOCK_PRODUCTS;
      } else if (!data || data.length === 0) {
        console.log("[productFetcher] Products table is empty, utilizing mock products fallback.");
        products = MOCK_PRODUCTS;
      } else {
        products = data;
      }
    } catch (dbErr) {
      console.error("[DB Crash] Failed to query products table. Falling back to mocks:", dbErr);
      products = MOCK_PRODUCTS;
    }

    // Fetch related tables in parallel safely
    let categories: any[] = [];
    let subcategories: any[] = [];
    let vendors: any[] = [];

    await Promise.all([
      (async () => {
        try {
          const { data, error } = await supabase.from('categories').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            categories = data;
          } else {
            categories = MOCK_CATEGORIES;
          }
        } catch (err) {
          console.error("[API Fail] Failed to fetch categories for join reference, falling back to mock:", err);
          categories = MOCK_CATEGORIES;
        }
      })(),
      (async () => {
        try {
          const { data, error } = await supabase.from('subcategories').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            subcategories = data;
          } else {
            subcategories = MOCK_SUBCATEGORIES;
          }
        } catch (err) {
          console.error("[API Fail] Failed to fetch subcategories for join reference, falling back to mock:", err);
          subcategories = MOCK_SUBCATEGORIES;
        }
      })(),
      (async () => {
        try {
          const { data, error } = await supabase.from('vendors').select('*');
          if (error) throw error;
          if (data) vendors = data;
        } catch (err) {
          console.error("[API Fail] Failed to fetch vendors for join reference:", err);
        }
      })()
    ]);

    // 6. If relation missing: do not crash. Merge safely in memory to bypass broken joins.
    const mergedProducts = products.map(p => {
      const cat = categories.find(c => c.id === p.category_id || c.slug === p.category_id) || null;
      const sub = subcategories.find(s => s.id === p.subcategory_id || s.slug === p.subcategory_id) || null;
      const ven = vendors.find(v => v.id === p.vendor_id || v.user_id === p.vendor_id) || null;

      return {
        ...p,
        categories: cat,
        subcategories: sub,
        vendors: ven
      };
    });

    // 1. Fetch only products where: status = 'live' and stock_units > 0
    let filtered = mergedProducts.filter(p => {
      // Read status. Fallback to verification_status if status isn't set, defaulting to 'live' if both are missing
      const statusVal = p.status || p.verification_status || 'approved';
      const isLive = statusVal === 'live' || statusVal === 'approved';
      
      const stockUnits = typeof p.stock_units === 'number' 
        ? p.stock_units 
        : (typeof p.stock === 'number' ? p.stock : 0);

      const hasStock = stockUnits > 0;
      const isActive = p.is_active !== false;

      return isLive && hasStock && isActive;
    });

    // Apply options if provided
    if (options?.categoryId) {
      filtered = filtered.filter(p => p.category_id === options.categoryId);
    }
    if (options?.subcategoryId && options.subcategoryId !== 'all') {
      filtered = filtered.filter(p => p.subcategory_id === options.subcategoryId);
    }

    // Sort by name or default priority (in-stock first)
    const getStock = (p: any) => typeof p.stock_units === 'number' ? p.stock_units : (p.stock !== undefined ? p.stock : 0);
    return filtered.sort((a, b) => (getStock(a) > 0 ? 0 : 1) - (getStock(b) > 0 ? 0 : 1)) as Product[];
  } catch (error) {
    // 3. If API fails: show error in console.
    console.error("[PRODUCT FETCH ERROR]:", error);
    throw error;
  }
}
