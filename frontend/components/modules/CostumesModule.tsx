'use client';

import React, { useState } from 'react';

export default function CostumesModule() {
  const [costumes, setCostumes] = useState([
    { _id: '1', name: 'Victorian Suit', category: 'Period', size: 'L', quantity: 3 },
    { _id: '2', name: 'Spacesuit V2', category: 'Sci-Fi', size: 'M', quantity: 2 },
    { _id: '3', name: 'Medieval Gown', category: 'Fantasy', size: 'S', quantity: 5 },
  ]);
  const [newCostumeName, setNewCostumeName] = useState('');
  const [newCostumeCategory, setNewCostumeCategory] = useState('');
  const [newCostumeSize, setNewCostumeSize] = useState('');
  const [newCostumeQty, setNewCostumeQty] = useState('');

  const handleAddCostume = (e: React.FormEvent) => {
    e.preventDefault();
    const newCostume = {
      _id: Math.random().toString(),
      name: newCostumeName,
      category: newCostumeCategory,
      size: newCostumeSize,
      quantity: Number(newCostumeQty),
    };
    setCostumes([...costumes, newCostume]);
    setNewCostumeName('');
    setNewCostumeCategory('');
    setNewCostumeSize('');
    setNewCostumeQty('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Costumes & Assets Inventory</h2>
        <p className="text-xs text-slate-400 mt-1">Manage physical costume listings, period catalogs, and item sizes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Costumes table list */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Itemized costumes catalog</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-350">
              <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {costumes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-950/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">{c.name}</td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">{c.category}</td>
                    <td className="py-3 px-4 font-mono">{c.size}</td>
                    <td className="py-3 px-4 text-slate-250 font-semibold">{c.quantity} items</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Costume Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Log Costume Asset</h3>
          
          <form onSubmit={handleAddCostume} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Costume Name</label>
              <input 
                type="text" 
                placeholder="e.g. Roman Armor Suit"
                value={newCostumeName}
                onChange={(e) => setNewCostumeName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <input 
                type="text" 
                placeholder="e.g. Period, Fantasy, Modern"
                value={newCostumeCategory}
                onChange={(e) => setNewCostumeCategory(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Size</label>
              <input 
                type="text" 
                placeholder="e.g. S, M, L, XL"
                value={newCostumeSize}
                onChange={(e) => setNewCostumeSize(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
              <input 
                type="number" 
                placeholder="e.g. 5"
                value={newCostumeQty}
                onChange={(e) => setNewCostumeQty(e.target.value)}
                required
                min={1}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
            >
              Add Costume Asset
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
