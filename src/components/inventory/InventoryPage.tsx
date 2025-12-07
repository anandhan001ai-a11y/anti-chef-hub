import { ArrowRight, ExternalLink, FileSpreadsheet, List, Package, Sheet } from 'lucide-react';

export default function InventoryPage() {
    const openGoogleSheets = () => {
        // Opens Google Sheets Template Gallery which has "Inventory" templates usually at the top
        window.open('https://docs.google.com/spreadsheets/u/0/?ftv=1&tgif=d', '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-500">Track stock, suppliers, and valuations.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Main Action Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-start justify-between h-[300px]">
                        <div>
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4">
                                <FileSpreadsheet size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Google Sheets Master Inventory</h2>
                            <p className="text-gray-500 leading-relaxed">
                                Access the powerful cloud-based inventory tracker. Features auto-calculations, multi-user editing, and history tracking.
                            </p>
                        </div>

                        <button
                            onClick={openGoogleSheets}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 group"
                        >
                            Launch Google Sheets <ExternalLink size={20} className="opacity-80 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Quick Stats / Info */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <List size={18} className="text-blue-500" /> Quick Status
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 text-sm">Total Items</span>
                                    <span className="font-bold text-gray-900">142</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 text-sm">Low Stock Alerts</span>
                                    <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs">8 Items</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 text-sm">Next Audit</span>
                                    <span className="font-bold text-gray-900">Friday</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group cursor-pointer hover:bg-blue-700 transition-colors">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-1">Stocktaking Mode</h3>
                                <p className="text-blue-100 text-sm mb-4">Start a new physical count session on tablet.</p>
                                <div className="inline-flex items-center gap-2 font-bold text-sm bg-white/10 px-3 py-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                                    Start Session <ArrowRight size={16} />
                                </div>
                            </div>
                            <Package className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/20 rotate-12" />
                        </div>
                    </div>

                </div>

                {/* Embedded Preview Placeholder */}
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Sync</h3>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <span className="ml-2 text-xs text-gray-400 font-mono">kitchen_inventory_v2.xlsx</span>
                        </div>
                        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                <Sheet size={32} />
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">No local spreadsheet connected.</p>
                                <p className="text-gray-400 text-sm">Use the "Launch" button above to open the robust Google Sheets system.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
