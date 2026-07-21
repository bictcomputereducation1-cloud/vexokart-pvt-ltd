import { Category, Subcategory, Product, Banner } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Vegetables & Fruits",
    slug: "vegetables-fruits",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Dairy, Bread & Eggs",
    slug: "dairy-bread-eggs",
    image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Cold Drinks & Juices",
    slug: "cold-drinks-juices",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Snacks & Munchies",
    slug: "snacks-munchies",
    image_url: "https://images.unsplash.com/photo-1599490659213-e2b9527ec087?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Instant & Frozen Food",
    slug: "instant-frozen-food",
    image_url: "https://images.unsplash.com/photo-1548590919-a91090013200?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Bakery & Biscuits",
    slug: "bakery-biscuits",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    name: "Atta, Rice & Dals",
    slug: "atta-rice-dals",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    name: "Personal Care",
    slug: "personal-care",
    image_url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=300",
    created_at: new Date().toISOString()
  }
];

export const MOCK_SUBCATEGORIES: Subcategory[] = [
  // Fruits & Veg
  { id: "sub-1-1", category_id: "11111111-1111-1111-1111-111111111111", name: "Fresh Vegetables", slug: "fresh-vegetables", image_url: "", created_at: "" },
  { id: "sub-1-2", category_id: "11111111-1111-1111-1111-111111111111", name: "Fresh Fruits", slug: "fresh-fruits", image_url: "", created_at: "" },
  { id: "sub-1-3", category_id: "11111111-1111-1111-1111-111111111111", name: "Herbs & Seasonings", slug: "herbs-seasonings", image_url: "", created_at: "" },
  
  // Dairy
  { id: "sub-2-1", category_id: "22222222-2222-2222-2222-222222222222", name: "Milk", slug: "milk", image_url: "", created_at: "" },
  { id: "sub-2-2", category_id: "22222222-2222-2222-2222-222222222222", name: "Bread & Pav", slug: "bread-pav", image_url: "", created_at: "" },
  { id: "sub-2-3", category_id: "22222222-2222-2222-2222-222222222222", name: "Butter & Cheese", slug: "butter-cheese", image_url: "", created_at: "" },

  // Drinks
  { id: "sub-3-1", category_id: "33333333-3333-3333-3333-333333333333", name: "Soft Drinks", slug: "soft-drinks", image_url: "", created_at: "" },
  { id: "sub-3-2", category_id: "33333333-3333-3333-3333-333333333333", name: "Juices", slug: "juices", image_url: "", created_at: "" },

  // Snacks
  { id: "sub-4-1", category_id: "44444444-4444-4444-4444-444444444444", name: "Chips & Crisps", slug: "chips-crisps", image_url: "", created_at: "" },
  { id: "sub-4-2", category_id: "44444444-4444-4444-4444-444444444444", name: "Nuts & Mixes", slug: "nuts-mixes", image_url: "", created_at: "" }
];

export const MOCK_PRODUCTS: Product[] = [
  // Veg/Fruit Fruits
  {
    id: "p1",
    name: "Fresh Red Apples",
    description: "Crispy and sweet red apples freshly sourced from orchard farms.",
    brand: "Orchard Fresh",
    product_type: "Fruits",
    weight: "4 pcs (approx. 500g)",
    speciality: "Organic",
    shelf_life: "7 Days",
    price: 99,
    original_price: 120,
    category_id: "11111111-1111-1111-1111-111111111111",
    subcategory_id: "sub-1-2",
    image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400",
    stock: 50,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p2",
    name: "Organic Bananas",
    description: "Naturally ripened, premium organic robust yellow bananas.",
    brand: "Grown Nature",
    product_type: "Fruits",
    weight: "1 Bunch (6 pcs)",
    speciality: "No Pesticides",
    shelf_life: "4 Days",
    price: 49,
    original_price: 60,
    category_id: "11111111-1111-1111-1111-111111111111",
    subcategory_id: "sub-1-2",
    image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400",
    stock: 75,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p3",
    name: "Fresh Hybrid Tomatoes",
    description: "Thick skinned, tangy and juicy hybrid tomatoes sourced locally.",
    brand: "Local Farms",
    product_type: "Vegetables",
    weight: "1kg",
    speciality: "Farm Fresh",
    shelf_life: "5 Days",
    price: 39,
    original_price: 55,
    category_id: "11111111-1111-1111-1111-111111111111",
    subcategory_id: "sub-1-1",
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400",
    stock: 120,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },

  // Dairy, Bread & Eggs
  {
    id: "p4",
    name: "Premium Fresh Milk",
    description: "Homogenized. Rich source of calcium and proteins.",
    brand: "Amulya Dairy",
    product_type: "Dairy",
    weight: "1L",
    speciality: "Pure Cow Milk",
    shelf_life: "2 Days",
    price: 62,
    original_price: 65,
    category_id: "22222222-2222-2222-2222-222222222222",
    subcategory_id: "sub-2-1",
    image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
    stock: 90,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p5",
    name: "Salted Cooking Butter",
    description: "Deliciously salted creamy golden butter, ideal for baking or breakfast spreading.",
    brand: "Amulya Dairy",
    product_type: "Butter",
    weight: "500g",
    speciality: "Rich Flavor",
    shelf_life: "90 Days",
    price: 250,
    original_price: 265,
    category_id: "22222222-2222-2222-2222-222222222222",
    subcategory_id: "sub-2-3",
    image_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400",
    stock: 45,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p6",
    name: "Brown Multigrain Bread",
    description: "High in fiber and nutrients, baked fresh daily with multiple grains.",
    brand: "Harvest Gold",
    product_type: "Bread",
    weight: "400g",
    speciality: "High Fiber",
    shelf_life: "3 Days",
    price: 45,
    original_price: 50,
    category_id: "22222222-2222-2222-2222-222222222222",
    subcategory_id: "sub-2-2",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    stock: 60,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },

  // Cold Drinks & Juices
  {
    id: "p7",
    name: "Classic Cola",
    description: "Ice cold fizzy carbonated classic cola drink, refreshing till the last bubble.",
    brand: "Fizzy Corp",
    product_type: "Soft Drinks",
    weight: "750ml",
    speciality: "Sparkling",
    shelf_life: "180 Days",
    price: 40,
    original_price: 45,
    category_id: "33333333-3333-3333-3333-333333333333",
    subcategory_id: "sub-3-1",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
    stock: 150,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p8",
    name: "Pure Orange Juice",
    description: "100% Squeezed citrus juice, free of added sugar and concentrates.",
    brand: "Grown Nature",
    product_type: "Juices",
    weight: "1L",
    speciality: "100% Real Juice",
    shelf_life: "30 Days",
    price: 110,
    original_price: 130,
    category_id: "33333333-3333-3333-3333-333333333333",
    subcategory_id: "sub-3-2",
    image_url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400",
    stock: 80,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },

  // Snacks & Munchies
  {
    id: "p9",
    name: "Crispy Potato Chips",
    description: "Classic salted thin sliced extra crispy potato crisps.",
    brand: "Snacko",
    product_type: "Chips & Crisps",
    weight: "120g",
    speciality: "No MSG",
    shelf_life: "120 Days",
    price: 30,
    original_price: 35,
    category_id: "44444444-4444-4444-4444-444444444444",
    subcategory_id: "sub-4-1",
    image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400",
    stock: 200,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  },
  {
    id: "p10",
    name: "Roasted Cashews",
    description: "Premium salted and oven-roasted cashews rich in heart-healthy fats.",
    brand: "Nutty Treat",
    product_type: "Nuts & Mixes",
    weight: "200g",
    speciality: "Oven Roasted",
    shelf_life: "270 Days",
    price: 180,
    original_price: 210,
    category_id: "44444444-4444-4444-4444-444444444444",
    subcategory_id: "sub-4-2",
    image_url: "https://images.unsplash.com/photo-1508061253366-f7da158b6d96?auto=format&fit=crop&q=80&w=400",
    stock: 120,
    cod_available: true,
    online_payment: true,
    created_at: new Date().toISOString()
  }
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: "b1",
    title: "Fresh Fruits & Organic Veggies!",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200",
    video_url: "https://player.vimeo.com/external/435674703.sd.mp4?s=7fdfda4d6c109727192bc585973b069d519bfae9&profile_id=165&oauth2_token_id=57447761",
    link_url: "/category/vegetables-fruits",
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "b2",
    title: "Beat the Heat with Ice Cold sodas!",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=1200",
    video_url: null,
    link_url: "/category/cold-drinks-juices",
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString()
  }
];
