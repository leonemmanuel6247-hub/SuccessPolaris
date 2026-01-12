
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'https://esm.sh/recharts';
import { storageService } from '../services/storageService.ts';

const AdminStats: React.FC = () => {
  const stats = storageService.getAdvancedStats();

  return (
    <div className="space-y-12 animate-in py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 text-center shadow-xl">
           <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-4">Élèves de la Matrice</p>
           <p className="text-4xl font-black text-cyan-400 drop-shadow-neon">{stats.totalUniqueUsers}</p>
           <p className="text-[8px] text-white/10 uppercase mt-2">Identités Uniques</p>
        </div>
        <div className="md:col-span-2 bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 shadow-xl">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-8">Activité des Téléchargements (7j)</h4>
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px' }}
                            itemStyle={{ color: '#00d4ff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', marginBottom: '4px' }}
                        />
                        <Bar dataKey="downloads" radius={[10, 10, 0, 0]}>
                            {stats.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 1 ? '#00d4ff' : 'rgba(0,212,255,0.2)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="bg-black/40 rounded-[2.5rem] border border-white/5 p-10 shadow-2xl">
         <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-10 text-center">Top 5 Archives Consultées</h4>
         <div className="space-y-6">
            {stats.topDocs.map((doc, idx) => (
                <div key={doc.id} className="flex items-center gap-6 p-4 hover:bg-white/[0.02] rounded-2xl transition-all group">
                    <span className="text-white/10 font-black italic text-2xl w-10">0{idx + 1}</span>
                    <div className="flex-1">
                        <p className="text-white font-bold text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{doc.title}</p>
                        <p className="text-[9px] text-white/30 uppercase font-black mt-1">{doc.downloads} accès autorisés</p>
                    </div>
                    <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 shadow-neon" style={{ width: `${(doc.downloads / stats.topDocs[0].downloads) * 100}%` }}></div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AdminStats;
