import React from 'react';
import { useAuth } from '../AuthContext';
import { User, Mail, Shield, Calendar, LogOut, ChevronRight, MapPin, Bell, CreditCard, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile, user, signOut } = useAuth();

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
    { icon: MapPin, label: 'My Addresses', sub: 'Home, Office, Other' },
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
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-1">
              <span className="text-lg font-black italic tracking-tighter block leading-none">12</span>
              <span className="text-[10px] font-black uppercase text-slate-400">Orders</span>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-1">
              <span className="text-lg font-black italic tracking-tighter block leading-none text-emerald-600">₹450</span>
              <span className="text-[10px] font-black uppercase text-slate-400">Saved</span>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-1">
              <span className="text-lg font-black italic tracking-tighter block leading-none text-primary">Gold</span>
              <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
           </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Account Settings</h2>
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
                 <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
           </div>
        </div>

        {/* Quick Menu */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="divide-y divide-slate-50">
              {menuItems.map((item, idx) => (
                <button key={idx} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                   <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors">
                         <item.icon className="h-5 w-5 text-slate-500 group-hover:text-black transition-colors" />
                      </div>
                      <div className="text-left">
                         <p className="text-sm font-bold text-slate-800">{item.label}</p>
                         <p className="text-[10px] font-bold text-slate-400 tracking-tight">{item.sub}</p>
                      </div>
                   </div>
                   <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))}
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

