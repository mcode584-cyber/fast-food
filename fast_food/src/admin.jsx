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
            setLoginError('Could not connect to server.');
        }
    };

    const fetchOrders = async () => {
        if (!isAdminAuthenticated) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders/`);
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) { console.error(err); }
    };

    const fetchFoods = async () => {
        if (!isAdminAuthenticated) return;
        try {
            const res = await fetch(`${API_BASE_URL}/foods/`);
            if (res.ok) {
                const data = await res.json();
                setFoods(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) { console.error(err); }
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
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetOrder, status: newStatus })
        });
        if (res.ok) setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const deleteOrder = async (id) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            const res = await fetch(`${API_BASE_URL}/orders/${id}/`, { method: 'DELETE' });
            if (res.ok) setOrders(orders.filter(o => o.id !== id));
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const productData = { name, category, price: parseFloat(price), cal, desc, tag, image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' };
        const method = editingFood ? 'PUT' : 'POST';
        const url = editingFood ? `${API_BASE_URL}/foods/${editingFood.id}/` : `${API_BASE_URL}/foods/`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (res.ok) { fetchFoods(); setIsModalOpen(false); }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Delete this product?')) {
            const res = await fetch(`${API_BASE_URL}/foods/${id}/`, { method: 'DELETE' });
            if (res.ok) setFoods(foods.filter(f => f.id !== id));
        }
    };

    const openModal = (food = null) => {
        if (food) {
            setEditingFood(food); setName(food.name); setCategory(food.category); setPrice(food.price);
        } else {
            setEditingFood(null); setName(''); setPrice('');
        }
        setIsModalOpen(true);
    };

    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
                <div className="bg-[#1c1c1e] p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
                    <h2 className="text-xl font-black mb-6">FASTFUEL CONTROL PANEL</h2>
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
            <aside className="w-64 bg-[#1c1c1e] p-6 border-r border-zinc-800">
                <h1 className="text-md font-black mb-8">FASTFUEL</h1>
                <nav className="space-y-2">
                    <button onClick={() => setCurrentTab('orders')} className={`w-full p-3 rounded-xl ${currentTab === 'orders' ? 'bg-rose-600' : ''}`}>Orders</button>
                    <button onClick={() => setCurrentTab('menu')} className={`w-full p-3 rounded-xl ${currentTab === 'menu' ? 'bg-rose-600' : ''}`}>Menu</button>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="text-zinc-500 pt-10 text-xs">Lock Terminal</button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-8 overflow-y-auto">
                {currentTab === 'orders' ? (
                    <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900 text-zinc-500 uppercase">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Table</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-t border-zinc-800">
                                        <td className="p-4">#{order.id}</td>
                                        <td className="p-4">{order.table}</td>
                                        <td className="p-4">${order.total}</td>
                                        <td className="p-4">
                                            <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="bg-zinc-900 p-1 rounded">
                                                {['New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => deleteOrder(order.id)} className="text-rose-500">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => openModal()} className="bg-yellow-500 text-black px-4 py-2 rounded-full mb-6">+ ADD PRODUCT</button>
                        <div className="grid grid-cols-4 gap-4">
                            {foods.map(food => (
                                <div key={food.id} className="bg-[#1c1c1e] p-4 rounded-xl border border-zinc-800">
                                    <h4 className="font-bold">{food.name}</h4>
                                    <button onClick={() => handleDeleteProduct(food.id)} className="text-rose-500 text-xs mt-2">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal remains unchanged as per your logic */}
        </div>
    );
}

export default Dashboard;