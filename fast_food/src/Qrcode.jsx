import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FoodMenu() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [foods, setFoods] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [loading, setLoading] = useState(true);


    const API_BASE_URL = 'https://fast-food-3idt.onrender.com/api';
    const categories = [
        { id: 'All', name: 'All', emoji: '🍟' },
        { id: 'Burgers', name: 'Burgers', emoji: '🍔' },
        { id: 'Sides', name: 'Sides', emoji: '🍟' },
        { id: 'Wraps', name: 'Wraps', emoji: '🌯' },
        { id: 'Pizza', name: 'Pizza', emoji: '🍕' },
        { id: 'Drinks', name: 'Drinks', emoji: '🥤' },
    ];


    const fetchMenuData = async () => {
        try {
            setLoading(true);

            const response = await axios.get(`${API_BASE_URL}/foods/`);
            setFoods(response.data);
        } catch (error) {
            console.error("حدث خطأ أثناء جلب قائمة الطعام:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuData();


        const handleStorageUpdate = (e) => {
            if (!e.key || e.key === 'fastfood_menu_updated') {
                fetchMenuData();
            }
        };

        window.addEventListener('storage', handleStorageUpdate);
        return () => window.removeEventListener('storage', handleStorageUpdate);
    }, []);

    const addToCart = (food) => {
        setCart((prevCart) => {
            const exists = prevCart.find((item) => item.id === food.id);
            if (exists) {
                return prevCart.map((item) =>
                    item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...food, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart((prevCart) => {
            const item = prevCart.find((item) => item.id === id);
            if (item.quantity === 1) {
                return prevCart.filter((item) => item.id !== id);
            }
            return prevCart.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);


    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        if (!tableNumber.trim()) return;


        const orderData = {
            table: tableNumber,
            items: cart,
            total: parseFloat(cartTotal),
            status: 'New'
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/orders/`, orderData);

            if (response.status === 201 || response.status === 200) {
                alert(`🎉 Your order for table number has been successfully confirmed${tableNumber}!`);

                setCart([]);
                setTableNumber('');
                setIsModalOpen(false);
                setIsCartOpen(false);

                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: 'fastfood_orders_updated',
                        newValue: Date.now().toString(),
                    })
                );
            }
        } catch (error) {

            console.error("تفاصيل الخطأ من السيرفر:", error.response?.data);
            alert("❌ حدث خطأ: " + JSON.stringify(error.response?.data));
        }
    };

    const filteredFoods = foods
        .filter(item => item.available !== false)
        .filter(item => activeCategory === 'All' || item.category === activeCategory);

    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans antialiased relative">
            {/* Top Navigation */}
            <header className="bg-[#e11d48] px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <div className="bg-[#facc15] text-[#121212] p-2 rounded-full font-black text-xl">⚡</div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter leading-none">FASTFUEL</h1>
                        <span className="text-[10px] text-rose-200 font-bold tracking-widest">FAST FOOD & MORE</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsCartOpen(true)}
                    className="bg-[#facc15] hover:bg-yellow-400 text-[#121212] font-extrabold px-5 py-2 rounded-full flex items-center space-x-2 text-sm shadow-md cursor-pointer transition-transform active:scale-95"
                >
                    <span>🛒</span>
                    <span>ITEMS: {cartCount}</span>
                </button>
            </header>

            {/* Welcome Banner */}
            <section className="relative bg-gradient-to-b from-[#222] to-[#181818] px-6 py-12 border-b border-zinc-800">
                <div className="max-w-xl">
                    <div className="flex items-center space-x-1 text-[#facc15] text-xs font-bold tracking-wider uppercase mb-2">
                        <span>🔥</span><span>Today's Special</span>
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight">
                        Smash Burgers <br />
                        <span className="text-[#facc15]">Done Right.</span>
                    </h2>
                </div>
            </section>

            {/* Category Ribbon */}
            <section className="bg-[#181818] px-6 py-4 sticky top-[56px] z-40 overflow-x-auto flex space-x-3 border-b border-zinc-800">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeCategory === cat.id ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </section>

            {/* Product Grid */}
            <main className="px-6 py-8">
                {loading ? (
                    <div className="text-center py-12 text-zinc-400">
                        <span className="animate-spin text-3xl block mb-2">⏳</span>
                        <p className="text-sm">Loading the list from the server...</p>
                    </div>
                ) : filteredFoods.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        <span className="text-3xl block mb-2">🍽️</span>

                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredFoods.map((food) => (
                            <div key={food.id} className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-zinc-800 flex flex-col group">
                                <div className="h-44 overflow-hidden relative bg-zinc-900">
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    {food.tag && <span className="absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-md text-white bg-rose-600">🔥 {food.tag}</span>}
                                    <span className="absolute bottom-3 right-3 bg-black/70 text-[10px] px-2 py-0.5 rounded-md text-zinc-300">{food.cal || '350 cal'}</span>
                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-sm font-bold text-white mb-1">{food.name}</h3>
                                    <p className="text-zinc-500 text-xs mb-4 flex-grow line-clamp-2">{food.desc}</p>

                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="text-md font-black text-[#facc15]">${parseFloat(food.price).toFixed(2)}</span>
                                        <button
                                            onClick={() => addToCart(food)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-lg active:scale-95 transition-all cursor-pointer"
                                        >
                                            + ADD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Sidebar Cart Drawer Backdrop */}
            {isCartOpen && <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />}

            {/* Sidebar Cart Drawer */}
            <aside className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#18181b] z-50 shadow-2xl border-l border-zinc-800 p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <h2 className="text-xl font-black border-b border-zinc-800 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span>Your Order 🛒</span>
                        <span className="bg-rose-600 text-xs px-2.5 py-0.5 rounded-full text-white font-bold">{cartCount}</span>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-lg text-xs font-bold cursor-pointer">✕ Close</button>
                </h2>

                <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                            <span className="text-4xl">🛒</span>

                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-[#242427] p-3 rounded-xl border border-zinc-800">
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                                    <span className="text-xs text-[#facc15] font-black">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => removeFromCart(item.id)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-2 py-1 rounded">-</button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-400 font-bold">Total:</span>
                        <span className="text-2xl font-black text-[#facc15]">${cartTotal}</span>
                    </div>
                    <button
                        disabled={cart.length === 0}
                        onClick={() => setIsModalOpen(true)}
                        className={`w-full py-3 rounded-xl font-black text-sm text-center tracking-wide transition-all ${cart.length === 0 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#e11d48] hover:bg-rose-700 text-white cursor-pointer active:scale-95'}`}
                    >
                        CONFIRM ORDER 🚀
                    </button>
                </div>
            </aside>

            {/* Table Number Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1c1c1e] border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-black mb-2 flex items-center space-x-2">
                            <span>🍽️</span> <span>Table Selection</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4">Please enter the table number to complete the order.</p>

                        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                            <input
                                type="number"
                                required
                                min="1"
                                placeholder="Enter the table number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-rose-600 placeholder-zinc-600 text-center"
                            />

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-3 rounded-xl">cancellation</button>
                                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-rose-900/40"> Confirm and send</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FoodMenu;