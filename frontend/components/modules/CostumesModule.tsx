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
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Costumes table list */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-3">Itemized costumes catalog</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 font-bold">Item Name</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Size</th>
                  <th className="py-3 px-4 font-bold">Stock Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costumes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">{c.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.size}</td>
                    <td className="py-3 px-4 text-slate-700 font-bold">{c.quantity} items</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Costume Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-3">Log Costume Asset</h3>
          
          <form onSubmit={handleAddCostume} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Costume Name</label>
              <input 
                type="text" 
                placeholder="e.g. Roman Armor Suit"
                value={newCostumeName}
                onChange={(e) => setNewCostumeName(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Category</label>
              <input 
                type="text" 
                placeholder="e.g. Period, Fantasy, Modern"
                value={newCostumeCategory}
                onChange={(e) => setNewCostumeCategory(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Size</label>
              <input 
                type="text" 
                placeholder="e.g. S, M, L, XL"
                value={newCostumeSize}
                onChange={(e) => setNewCostumeSize(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Quantity</label>
              <input 
                type="number" 
                placeholder="e.g. 5"
                value={newCostumeQty}
                onChange={(e) => setNewCostumeQty(e.target.value)}
                required
                min={1}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Add Costume Asset
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
