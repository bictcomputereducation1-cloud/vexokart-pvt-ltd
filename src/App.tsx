import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CartProvider } from './CartContext';
import { AuthProvider } from './AuthContext';
import { LocationProvider } from './LocationContext';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import Home from './pages/Home';
import Categories from './pages/Categories';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Search from './pages/Search';
import CategoryProducts from './pages/CategoryProducts';
import OrderSuccess from './pages/OrderSuccess';
import Onboarding from './pages/Onboarding';
import Splash from './pages/Splash';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminSubcategories from './pages/AdminSubcategories';
import AdminCoupons from './pages/AdminCoupons';
import AdminSettings from './pages/AdminSettings';
import AdminVendors from './pages/AdminVendors';
import AdminDeliveryBoys from './pages/AdminDeliveryBoys';
import AdminAreas from './pages/AdminAreas';
import AdminBanners from './pages/AdminBanners';
import VendorDashboard from './pages/VendorDashboard';
import VendorPrintLabel from './pages/VendorPrintLabel';
import DeliveryDashboard from './pages/DeliveryDashboard';
import { AdminLayout } from './components/AdminLayout';
import { VendorLayout } from './components/VendorLayout';
import { DeliveryLayout } from './components/DeliveryLayout';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Router>
            <Layout>
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
                <Route path="/category/:identifier" element={<CategoryProducts />} />
                
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
                
                {/* Vendor Routes */}
                <Route path="/vendor" element={<ProtectedRoute vendorOnly><VendorLayout><VendorDashboard /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/dashboard" element={<ProtectedRoute vendorOnly><VendorLayout><VendorDashboard /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/print/:id" element={<ProtectedRoute vendorOnly><VendorPrintLabel /></ProtectedRoute>} />
                
                {/* Delivery Route */}
                <Route path="/delivery/dashboard" element={<ProtectedRoute><DeliveryLayout><DeliveryDashboard /></DeliveryLayout></ProtectedRoute>} />
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
