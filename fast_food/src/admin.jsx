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

    // الدوال البرمجية (Login, Fetch, Delete, Update)
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
            } else {
                setLoginError(data.error || 'Invalid access code.');
            }
        } catch (err) {
            setLoginError('Could not connect to backend.');
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
        } catch (err) { console.error("Error:", err); }
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
        } catch (err) { console.error("Error:", err); }
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
        const targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) return;
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetOrder, status: newStatus })
        });
        if (res.ok) setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const productData = { name, category, price: parseFloat(price), cal, desc, tag, image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', available: editingFood ? editingFood.available : true };
        const method = editingFood ? 'PUT' : 'POST';
        const url = editingFood ? `${API_BASE_URL}/foods/${editingFood.id}/` : `${API_BASE_URL}/foods/`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (res.ok) { fetchFoods(); closeModal(); }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure?')) {
            const res = await fetch(`${API_BASE_URL}/foods/${id}/`, { method: 'DELETE' });
            if (res.ok) setFoods(foods.filter(f => f.id !== id));
        }
    };

    const toggleAvailability = async (food) => {
        const res = await fetch(`${API_BASE_URL}/foods/${food.id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...food, available: !food.available })
        });
        if (res.ok) setFoods(foods.map(f => f.id === food.id ? { ...f, available: !f.available } : f));
    };

    const openModal = (food = null) => {
        if (food) {
            setEditingFood(food); setName(food.name); setCategory(food.category); setPrice(food.price); setCal(food.cal); setDesc(food.desc); setImage(food.image); setTag(food.tag);
        } else {
            setEditingFood(null); setName(''); setPrice('');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingFood(null); };

    // حساب الإحصائيات
    const activeOrdersCount = Array.isArray(orders) ? orders.filter(o => o.status === 'New' || o.status === 'Preparing').length : 0;
    const totalRevenue = Array.isArray(orders) ? orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2) : "0.00";
    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-600 text-white';
            case 'Preparing': return 'bg-amber-500 text-black';
            case 'Ready': return 'bg-emerald-600 text-white';
            default: return 'bg-zinc-800 text-white';
        }
    };

    // --- عرض الواجهة (UI) ---
    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
                <div className="bg-[#1c1c1e] border border-zinc-800 w-full max-w-md rounded-2xl p-8 text-center">
                    <h2 className="text-xl font-black mb-6">FASTFUEL CONTROL</h2>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <input type="password" value={inputCode} onChange={e => setInputCode(e.target.value)} className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center" placeholder="••••" />
                        <button type="submit" className="w-full bg-rose-600 p-3 rounded-xl font-bold">UNLOCK</button>
                    </form>
                    {loginError && <p className="text-rose-500 mt-2 text-xs">{loginError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1c1c1e] p-6 border-r border-zinc-800 hidden md:flex flex-col">
                <h1 className="text-lg font-black mb-8">FASTFUEL</h1>
                <nav className="space-y-2">
                    <button onClick={() => setCurrentTab('orders')} className={`w-full p-3 rounded-xl ${currentTab === 'orders' ? 'bg-rose-600' : ''}`}>Orders</button>
                    <button onClick={() => setCurrentTab('menu')} className={`w-full p-3 rounded-xl ${currentTab === 'menu' ? 'bg-rose-600' : ''}`}>Menu</button>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="text-zinc-500 pt-10 text-xs">Lock</button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-8 overflow-y-auto">
                {currentTab === 'orders' ? (
                    <div>
                        <h2 className="text-2xl font-black mb-6">Live Orders (${totalRevenue})</h2>
                        <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-800 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-900 text-zinc-500 uppercase">
                                    <tr><th className="p-4">ID</th><th className="p-4">Table</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id} className="border-t border-zinc-800">
                                            <td className="p-4">#{order.id}</td>
                                            <td className="p-4">{order.table}</td>
                                            <td className="p-4">${order.total}</td>
                                            <td className="p-4">
                                                <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className={`p-1 rounded ${getStatusColor(order.status)}`}>
                                                    {['New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-4"><button onClick={() => { }} className="text-rose-500">Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => openModal()} className="bg-yellow-500 text-black px-4 py-2 rounded-full mb-6">+ ADD PRODUCT</button>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {foods.map(food => (
                                <div key={food.id} className="bg-[#1c1c1e] p-4 rounded-xl border border-zinc-800">
                                    <img src={food.image} className="w-full h-32 object-cover rounded-lg mb-2" alt={food.name} />
                                    <h4 className="font-bold">{food.name}</h4>
                                    <p className="text-yellow-500">${food.price}</p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => openModal(food)} className="bg-zinc-700 px-2 py-1 rounded text-xs">Edit</button>
                                        <button onClick={() => handleDeleteProduct(food.id)} className="bg-rose-900 px-2 py-1 rounded text-xs">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1c1c1e] p-6 rounded-2xl w-full max-w-sm border border-zinc-800">
                        <h3 className="font-bold mb-4">{editingFood ? 'Edit Dish' : 'New Dish'}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-3">
                            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 p-2 rounded" />
                            <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-zinc-900 p-2 rounded" />
                            <div className="flex gap-2">
                                <button type="button" onClick={closeModal} className="flex-1 bg-zinc-800 py-2 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-rose-600 py-2 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;