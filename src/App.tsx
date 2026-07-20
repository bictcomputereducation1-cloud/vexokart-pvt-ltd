import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CartProvider } from './CartContext';
import { AuthProvider } from './AuthContext';
import { LocationProvider } from './LocationContext';
import { ProtectedRoute } from './ProtectedRoute';
import FallbackSkeleton from './components/FallbackSkeleton';

// Lazy static routes
const Splash = lazy(() => import('./pages/Splash'));
const Home = lazy(() => import('./pages/Home'));
const Categories = lazy(() => import('./pages/Categories'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const Search = lazy(() => import('./pages/Search'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Lazy admin routes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminSubcategories = lazy(() => import('./pages/AdminSubcategories'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminVendors = lazy(() => import('./pages/AdminVendors'));
const AdminDeliveryBoys = lazy(() => import('./pages/AdminDeliveryBoys'));
const AdminAreas = lazy(() => import('./pages/AdminAreas'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminPayouts = lazy(() => import('./pages/AdminPayouts'));

// Lazy vendor routes
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorProductUpload = lazy(() => import('./pages/VendorProductUpload'));
const VendorPrintLabel = lazy(() => import('./pages/VendorPrintLabel'));

// Lazy delivery routes
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));

import { AdminLayout } from './components/AdminLayout';
import { VendorLayout } from './components/VendorLayout';
import { DeliveryLayout } from './components/DeliveryLayout';

export default function App() {
  React.useEffect(() => {
    // Silence unnecessary verbose devlogs
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Router>
            <Layout>
              <Suspense fallback={<FallbackSkeleton />}>
                <Routes>
                  <Route path="/" element={<Splash />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/category/:pointer" element={<CategoryProducts />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/vendors" element={<ProtectedRoute adminOnly><AdminLayout><AdminVendors /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/delivery-boys" element={<ProtectedRoute adminOnly><AdminLayout><AdminDeliveryBoys /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/areas" element={<ProtectedRoute adminOnly><AdminLayout><AdminAreas /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/banners" element={<ProtectedRoute adminOnly><AdminLayout><AdminBanners /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute adminOnly><AdminLayout><AdminCategories /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/subcategories" element={<ProtectedRoute adminOnly><AdminLayout><AdminSubcategories /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/coupons" element={<ProtectedRoute adminOnly><AdminLayout><AdminCoupons /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/payouts" element={<ProtectedRoute adminOnly><AdminLayout><AdminPayouts /></AdminLayout></ProtectedRoute>} />
                  
                  {/* Vendor Routes */}
                  <Route path="/vendor" element={<ProtectedRoute vendorOnly><VendorLayout><VendorDashboard /></VendorLayout></ProtectedRoute>} />
                  <Route path="/vendor/dashboard" element={<ProtectedRoute vendorOnly><VendorLayout><VendorDashboard /></VendorLayout></ProtectedRoute>} />
                  <Route path="/vendor/products/new" element={<ProtectedRoute vendorOnly><VendorProductUpload /></ProtectedRoute>} />
                  <Route path="/vendor/print/:id" element={<ProtectedRoute vendorOnly><VendorPrintLabel /></ProtectedRoute>} />
                  
                  {/* Delivery Route */}
                  <Route path="/delivery" element={<ProtectedRoute deliveryOnly><DeliveryLayout><DeliveryDashboard /></DeliveryLayout></ProtectedRoute>} />
                  <Route path="/delivery/dashboard" element={<ProtectedRoute deliveryOnly><DeliveryLayout><DeliveryDashboard /></DeliveryLayout></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
