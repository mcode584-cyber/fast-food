import React, { useState, useEffect } from 'react';

function Dashboard() {

    const API_BASE_URL = 'https://fast-food-3idt.onrender.com/api';


    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [loginError, setLoginError] = useState('');


    const [currentTab, setCurrentTab] = useState('orders');


    const [orders, setOrders] = useState([]);
    const [orderFilter, setOrderFilter] = useState('All');


    const [foods, setFoods] = useState([]);
    const [menuFilter, setMenuFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFood, setEditingFood] = useState(null);


    const [name, setName] = useState('');
    const [category, setCategory] = useState('Burgers');
    const [price, setPrice] = useState('');
    const [cal, setCal] = useState('');
    const [desc, setDesc] = useState('');
    const [tag, setTag] = useState('');
    const [image, setImage] = useState('');

    const categories = ['All', 'Burgers', 'Sides', 'Wraps', 'Pizza', 'Drinks'];

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const res = await fetch(`${API_BASE_URL}/verify-code/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inputCode })
            });

            const data = await res.json();

            if (res.ok && data.authenticated) {
                setIsAdminAuthenticated(true);
                setLoginError('');
            } else {
                setLoginError(data.error || 'Invalid access code. Please try again.');
            }
        } catch (err) {
            console.error("Security Terminal Connection Error:", err);
            setLoginError('Could not connect to backend server. Make sure Django is running.');
        }
    };
    const handleClearCancelled = async () => {
        if (!window.confirm("هل أنت متأكد من حذف جميع الطلبات الملغاة نهائياً؟")) return;

        try {
            // 1. تصفية الطلبات الملغاة
            const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

            // 2. حذف كل طلب من السيرفر
            await Promise.all(cancelledOrders.map(order =>
                fetch(`${API_BASE_URL}/orders/${order.id}/`, { method: 'DELETE' })
            ));

            // 3. تحديث الحالة في الواجهة
            setOrders(prev => prev.filter(o => o.status !== 'Cancelled'));

        } catch (err) {
            console.error("خطأ أثناء حذف الطلبات:", err);
            alert("حدث خطأ أثناء محاولة الحذف.");
        }
    };
    const handleDeleteOrder = async (id) => {
        if (!window.confirm('هل أنت متأكد؟')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            // تحقق من أن الحالة بين 200 و 299
            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== id));
            } else {
                console.error("فشل الحذف، الحالة:", res.status);
            }
        } catch (err) {
            console.error("خطأ في الاتصال:", err);
        }
    };

    const fetchOrders = async () => {
        if (!isAdminAuthenticated) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders/`);
            if (res.ok) {
                const data = await res.json();
                const extractedOrders = data.results ? data.results : data;
                setOrders(Array.isArray(extractedOrders) ? extractedOrders : []);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        }
    };

    const fetchFoods = async () => {
        if (!isAdminAuthenticated) return;
        try {
            const res = await fetch(`${API_BASE_URL}/foods/`);
            if (res.ok) {
                const data = await res.json();
                const extractedFoods = data.results ? data.results : data;
                setFoods(Array.isArray(extractedFoods) ? extractedFoods : []);
            }
        } catch (err) {
            console.error("Error fetching food items:", err);
            setFoods([]);
        }
    };

    useEffect(() => {
        if (isAdminAuthenticated) {
            fetchOrders();
            fetchFoods();


            const interval = setInterval(fetchOrders, 5000);
            return () => clearInterval(interval);
        }
    }, [isAdminAuthenticated]);


    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const targetOrder = orders.find(o => o.id === orderId);
            if (!targetOrder) return;

            const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...targetOrder, status: newStatus })
            });

            if (res.ok) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    };


    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const finalImage = image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500';

        const productData = {
            name,
            category,
            price: parseFloat(price),
            cal: cal ? (cal.includes('cal') ? cal : `${cal} cal`) : "350 cal",
            desc: desc || "",
            tag: tag || null,
            image: finalImage,
            available: editingFood ? editingFood.available : true
        };

        try {
            let res;
            if (editingFood) {
                res = await fetch(`${API_BASE_URL}/foods/${editingFood.id}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                res = await fetch(`${API_BASE_URL}/foods/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }

            if (res.ok) {
                fetchFoods();
                closeModal();
            }
        } catch (err) {
            console.error("Error save product:", err);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Delete this product from server?')) {
            try {
                const res = await fetch(`${API_BASE_URL}/foods/${id}/`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setFoods(foods.filter(f => f.id !== id));
                }
            } catch (err) {
                console.error("Error deleting product:", err);
            }
        }
    };

    const toggleAvailability = async (food) => {
        try {
            const res = await fetch(`${API_BASE_URL}/foods/${food.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...food, available: !food.available })
            });
            if (res.ok) {
                setFoods(foods.map(f => f.id === food.id ? { ...f, available: !f.available } : f));
            }
        } catch (err) {
            console.error("Error toggling availability:", err);
        }
    };

    const openModal = (food = null) => {
        if (food) {
            setEditingFood(food); setName(food.name); setCategory(food.category); setPrice(food.price); setCal(food.cal ? food.cal.replace(' cal', '') : ''); setDesc(food.desc || ''); setImage(food.image || ''); setTag(food.tag || '');
        } else {
            setEditingFood(null); setName(''); setCategory('Burgers'); setPrice(''); setCal(''); setDesc(''); setImage(''); setTag('');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingFood(null); };


    const activeOrdersCount = Array.isArray(orders)
        ? orders.filter(o => o.status === 'New' || o.status === 'Preparing').length
        : 0;

    const totalRevenue = Array.isArray(orders)
        ? orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)
        : "0.00";

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-600 text-white border-blue-500';
            case 'Preparing': return 'bg-amber-500 text-neutral-900 border-amber-400 font-bold';
            case 'Ready': return 'bg-emerald-600 text-white border-emerald-500';
            case 'Delivered': return 'bg-zinc-700 text-zinc-300 border-zinc-600';
            case 'Cancelled': return 'bg-rose-600 text-white border-rose-500';
            default: return 'bg-zinc-800 text-white';
        }
    };


    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center font-sans p-4">
                <div className="bg-[#1c1c1e] border border-zinc-800 w-full max-w-md rounded-2xl p-8 shadow-2xl text-center">
                    <div className="bg-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-4 text-white shadow-lg shadow-rose-900/30">
                        FF
                    </div>
                    <h2 className="text-xl font-black tracking-tight">FASTFUEL CONTROL PANEL</h2>
                    <p className="text-xs text-zinc-500 mt-1 mb-6 uppercase tracking-wider font-bold">Authorized Personnel Only</p>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="text-left">
                            <label className="text-[10px] text-zinc-400 font-black tracking-wider uppercase pl-1 block mb-1.5">Enter Admin Security Code</label>
                            <input
                                type="password"
                                required
                                maxLength={6}
                                placeholder="••••"
                                value={inputCode}
                                onChange={e => setInputCode(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-rose-600 transition-colors"
                            />
                        </div>

                        {loginError && (
                            <p className="text-rose-500 text-xs font-semibold bg-rose-950/30 border border-rose-900/50 py-2 rounded-xl">
                                ⚠️ {loginError}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-[0.98]"
                        >
                            UNlOCK DASHBOARD →
                        </button>
                    </form>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans antialiased flex">


            <aside className="w-64 bg-[#1c1c1e] border-r border-zinc-800 flex flex-col justify-between hidden md:flex shrink-0">
                <div className="p-6">
                    <div className="flex items-center space-x-2 mb-8 border-b border-zinc-800 pb-4">
                        <div className="bg-[#e11d48] text-white p-2 rounded-lg font-black text-md">FF</div>
                        <div>
                            <h1 className="text-md font-black tracking-tight">FASTFUEL</h1>
                            <p className="text-[9px] text-zinc-500 font-bold">CONTROL PANEL</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setCurrentTab('orders')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${currentTab === 'orders' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        >
                            <div className="flex items-center space-x-2.5"><span>📄</span><span>Live Orders</span></div>
                            {activeOrdersCount > 0 && <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{activeOrdersCount}</span>}
                        </button>

                        <button
                            onClick={() => setCurrentTab('menu')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2.5 cursor-pointer transition-colors ${currentTab === 'menu' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        >
                            <span>🍔</span><span>Product Menu</span>
                        </button>


                        <button
                            onClick={() => { setIsAdminAuthenticated(false); setInputCode(''); }}
                            className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2.5 cursor-pointer text-zinc-600 hover:bg-rose-950/20 hover:text-rose-400 transition-colors pt-8"
                        >
                            <span>🔒</span><span>Lock Terminal</span>
                        </button>
                    </nav>
                </div>
                <div className="p-6 border-t border-zinc-800 text-[10px] text-zinc-500 font-medium">
                    Dashboard flex-auth v2.2 (2026)
                </div>
            </aside>


            <div className="flex-grow p-6 overflow-y-auto">


                {currentTab === 'orders' && (
                    <div>
                        <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                            <div>
                                <h2 className="text-xl font-black">Live Orders Management ⏱️</h2>
                                <p className="text-xs text-zinc-500">Monitor and manage ongoing client table requests.</p>
                            </div>
                            <div className="bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-emerald-400 font-bold flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>LIVE FEED</span>
                            </div>
                        </header>


                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-zinc-800/80">
                                <h4 className="text-2xl font-black text-[#facc15]">${totalRevenue}</h4>
                                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">Today's Revenue</p>
                            </div>
                            <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-zinc-800/80">
                                <h4 className="text-2xl font-black text-white">{Array.isArray(orders) ? orders.length : 0}</h4>
                                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">Total Processed Orders</p>
                            </div>
                            <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-zinc-800/80">
                                <h4 className="text-2xl font-black text-orange-500">{activeOrdersCount}</h4>
                                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">Active Kitchen Tasks</p>
                            </div>
                        </section>

                        {/* فلترة الحالات */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex flex-wrap gap-1.5">
                                {['All', 'New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setOrderFilter(t)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${orderFilter === t ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* الربط الصحيح بالدالة */}
                            {orderFilter === 'Cancelled' && (
                                <button
                                    onClick={handleClearCancelled}
                                    className="text-[10px] bg-rose-950/30 text-rose-500 px-3 py-1 rounded-lg border border-rose-900/50 hover:bg-rose-900 cursor-pointer font-bold"
                                >
                                    🗑️ Clear Cancelled
                                </button>
                            )}
                        </div>


                        <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-800 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/50 text-[10px] text-zinc-500 font-bold tracking-wider uppercase border-b border-zinc-800">
                                    <tr>
                                        <th className="py-3 px-5">ID</th>
                                        <th className="py-3 px-5">TABLE</th>
                                        <th className="py-3 px-5">ITEMS</th>
                                        <th className="py-3 px-5 text-right">TOTAL</th>
                                        <th className="py-3 px-5 text-center">ACTION STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40">
                                    {Array.isArray(orders) && orders
                                        .filter(o => orderFilter === 'All' || (o.status && o.status.toLowerCase() === orderFilter.toLowerCase()))
                                        .map(order => (
                                            <tr key={order.id} className="hover:bg-zinc-800/20">
                                                <td className="py-3 px-5 font-bold text-[#facc15]">{order.order_id || `#${order.id}`}</td>
                                                <td className="py-3 px-5 font-extrabold text-white">{order.table && order.table.toString().startsWith('Table') ? order.table : `Table ${order.table}`}</td>
                                                <td className="py-3 px-5 text-xs text-zinc-300">
                                                    {Array.isArray(order.items) ? order.items.map((it, idx) => <div key={idx}>{it.name} <span className="text-zinc-500">x{it.quantity}</span></div>) : "No items"}
                                                </td>
                                                <td className="py-3 px-5 text-right font-black text-white">${parseFloat(order.total || 0).toFixed(2)}</td>
                                                <td className="py-3 px-5 text-center">
                                                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className={`text-xs font-bold px-2 py-1 rounded-md focus:outline-none cursor-pointer border ${getStatusColor(order.status)}`}>
                                                        {['New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(st => <option key={st} value={st} className="bg-zinc-900 text-white">{st}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {(!Array.isArray(orders) || orders.length === 0) && (
                                <div className="text-center py-8 text-zinc-500 text-xs">No orders available right now.</div>
                            )}
                        </div>
                    </div>
                )}


                {currentTab === 'menu' && (
                    <div>
                        <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                            <div>
                                <h2 className="text-xl font-black">Food Menu Customization 🍔</h2>
                                <p className="text-xs text-zinc-500">Create, rewrite, or deactivate dishes from the database.</p>
                            </div>
                            <button onClick={() => openModal()} className="bg-[#facc15] hover:bg-yellow-400 text-black font-black text-xs px-4 py-2 rounded-full cursor-pointer transition-transform active:scale-95">
                                + ADD PRODUCT
                            </button>
                        </header>

                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {categories.map(c => (
                                <button key={c} onClick={() => setMenuFilter(c)} className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${menuFilter === c ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.isArray(foods) && foods.filter(f => menuFilter === 'All' || f.category === menuFilter).map(food => (
                                <div key={food.id} className={`bg-[#1c1c1e] rounded-2xl border overflow-hidden flex flex-col ${food.available ? 'border-zinc-800' : 'opacity-50 border-zinc-900'}`}>
                                    <div className="h-36 bg-zinc-900 relative">
                                        <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                        <button onClick={() => toggleAvailability(food)} className={`absolute top-2.5 right-2.5 text-[8px] font-black px-2 py-0.5 rounded-full border ${food.available ? 'bg-emerald-600 border-emerald-400' : 'bg-zinc-800 border-zinc-700'}`}>
                                            {food.available ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h4 className="text-sm font-bold">{food.name}</h4>
                                        <span className="text-[#facc15] text-xs font-black mt-1">${parseFloat(food.price || 0).toFixed(2)}</span>
                                        <div className="flex justify-end space-x-1.5 mt-auto border-t border-zinc-800/50 pt-2.5">
                                            <button onClick={() => openModal(food)} className="bg-zinc-800 hover:bg-zinc-700 text-xs p-1.5 rounded cursor-pointer">✏️</button>
                                            <button onClick={() => handleDeleteProduct(food.id)} className="bg-zinc-800 hover:bg-rose-950 text-xs p-1.5 rounded text-rose-400 cursor-pointer">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>


            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1c1c1e] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl">
                        <h3 className="text-md font-black mb-4 text-[#facc15]">{editingFood ? '📝 Update Dish Parameters' : '🍔 Introduce New Dish'}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-3.5">
                            <input type="text" required placeholder="Name (e.g. Smash Patty)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-600" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none">
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="number" step="0.01" required placeholder="Price ($)" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] text-zinc-500 file:bg-rose-600 file:text-white file:border-0 file:rounded file:px-2 file:py-0.5 file:mr-2 file:cursor-pointer" />
                            <div className="flex space-x-2 pt-2 border-t border-zinc-800">
                                <button type="button" onClick={closeModal} className="flex-1 bg-zinc-800 text-xs py-2 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 bg-rose-600 text-xs font-bold py-2 rounded-xl">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Dashboard;