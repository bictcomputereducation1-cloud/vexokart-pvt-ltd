import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { User, Mail, Shield, Calendar, LogOut, ChevronRight, MapPin, Bell, CreditCard, HelpCircle, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { AddressSelector } from '../components/AddressSelector';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { profile, user, signOut, isAdmin } = useAuth();
  const [showAddresses, setShowAddresses] = useState(false);

  if (!user) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-6 text-center px-4">
      <div className="bg-slate-50 p-10 rounded-full border border-slate-100">
        <User className="h-16 w-16 text-slate-300" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Account Access</h2>
        <p className="text-slate-400 font-medium max-w-xs mx-auto">Please login to view your profile and manage orders.</p>
      </div>
      <button onClick={() => window.location.href = '/login'} className="bg-primary text-black font-black italic px-10 py-3 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-tighter">
        Login Now
      </button>
    </div>
  );

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', sub: 'Order History & Status', path: '/orders' },
    { icon: CreditCard, label: 'Payments', sub: 'Saved Cards, UPI' },
    { icon: Bell, label: 'Notifications', sub: 'Offers, Order Updates' },
    { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs, Contact' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-8 mb-4 border-b border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="h-24 w-24 rounded-3xl bg-primary/20 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
             {profile?.image_url ? (
               <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
             ) : (
               <User className="h-12 w-12 text-black" />
             )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">{profile?.name || 'Vexokart User'}</h1>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <Mail className="h-3 w-3" /> {user.email}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50 rounded-full -ml-12 -mb-12 blur-2xl" />
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-6">
        {isAdmin && (
          <Link to="/admin">
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-widest italic">Admin Console</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manage Orders & Products</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Addresses Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setShowAddresses(!showAddresses)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <MapPin className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">My Addresses</p>
                <p className="text-[10px] font-bold text-slate-400 tracking-tight">Manage delivery locations</p>
              </div>
            </div>
            <ChevronRight className={`h-5 w-5 text-slate-300 transition-transform ${showAddresses ? 'rotate-90' : ''}`} />
          </button>
          
          {showAddresses && (
            <div className="px-6 pb-6 animate-in slide-in-from-top duration-300">
              <AddressSelector onSelect={() => {}} />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {menuItems.map((item, idx) => {
            const Content = (
              <div className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <item.icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            );

            return item.path ? (
              <Link key={idx} to={item.path}>{Content}</Link>
            ) : (
              <div key={idx}>{Content}</div>
            );
          })}
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Account Information</h2>
           </div>
           <div className="divide-y divide-slate-50">
              <div className="p-5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                       <Shield className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">Account Security</p>
                       <p className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">Verified Profile</p>
                    </div>
                 </div>
                 <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>

              <div className="p-5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                       <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">Member Since</p>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{new Date(profile?.created_at || '').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Logout Button */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="w-full bg-red-50 text-red-600 font-black italic uppercase tracking-widest py-4 rounded-3xl border border-red-100 flex items-center justify-center gap-3 hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-5 w-5" /> Sign Out
        </motion.button>
      </div>
      
      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-12 mb-8">
        Vexokart Premium • Version 1.0.4
      </p>
    </div>
  );
}

