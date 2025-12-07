import { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Plus,
    Trash2,
    Calculator,
    Briefcase,
    ChefHat
} from 'lucide-react';

// --- Types ---

type FoodCostIngredient = {
    id: string;
    name: string;
    purchasePrice: number;
    unitSize: number;
    yieldPercent: number;
    quantityUsed: number;
};

type RecipeCostIngredient = {
    id: string;
    name: string;
    quantity: number;
    unitCost: number;
};

// --- Helper Components ---

const LightCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm ${className}`}>
        {children}
    </div>
);

const LightInput = ({ ...props }) => (
    <input
        {...props}
        className={`bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all ${props.className || ''}`}
    />
);

// --- Modules ---

// MODULE 1: Food-Cost Calculator
const FoodCostModule = () => {
    const [ingredients, setIngredients] = useState<FoodCostIngredient[]>([
        { id: '1', name: 'Raw Chicken', purchasePrice: 50, unitSize: 1, yieldPercent: 80, quantityUsed: 0.200 }
    ]);
    const [sellingPrice, setSellingPrice] = useState(25);
    const [targetCostPercent, setTargetCostPercent] = useState(30);

    const addIngredient = () => {
        setIngredients([...ingredients, {
            id: Math.random().toString(),
            name: '',
            purchasePrice: 0,
            unitSize: 1,
            yieldPercent: 100,
            quantityUsed: 0
        }]);
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.id !== id));
    };

    const updateIngredient = (id: string, field: keyof FoodCostIngredient, value: string | number) => {
        setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    // Calculations
    const totalFoodCost = ingredients.reduce((sum, ing) => {
        const usableCost = ing.purchasePrice / (ing.yieldPercent / 100);
        const cost = ing.quantityUsed * usableCost;
        return sum + cost;
    }, 0);

    const foodCostPercent = (totalFoodCost / sellingPrice) * 100;
    const variance = foodCostPercent - targetCostPercent;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <LightCard className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ChefHat className="text-emerald-500" /> Ingredients Calculation
                        </h3>
                        <button onClick={addIngredient} className="flex items-center gap-1 text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors">
                            <Plus size={16} /> ADD ITEM
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <th className="py-2 px-2">Ingredient</th>
                                    <th className="py-2 px-2">Purchase $</th>
                                    <th className="py-2 px-2">Unit Size</th>
                                    <th className="py-2 px-2">Yield %</th>
                                    <th className="py-2 px-2">Qty Used</th>
                                    <th className="py-2 px-2 text-right text-emerald-600">Actual Cost</th>
                                    <th className="py-2 px-2 w-[40px]"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {ingredients.map(ing => {
                                    const usableCost = ing.purchasePrice / (ing.yieldPercent / 100);
                                    const finalCost = ing.quantityUsed * usableCost;
                                    return (
                                        <tr key={ing.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="p-2">
                                                <LightInput
                                                    value={ing.name}
                                                    onChange={(e: any) => updateIngredient(ing.id, 'name', e.target.value)}
                                                    placeholder="Item Name"
                                                    className="w-full"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <LightInput
                                                    type="number"
                                                    value={ing.purchasePrice}
                                                    onChange={(e: any) => updateIngredient(ing.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <LightInput
                                                    type="number"
                                                    value={ing.unitSize}
                                                    onChange={(e: any) => updateIngredient(ing.id, 'unitSize', parseFloat(e.target.value) || 1)}
                                                    className="w-16"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1">
                                                    <LightInput
                                                        type="number"
                                                        value={ing.yieldPercent}
                                                        onChange={(e: any) => updateIngredient(ing.id, 'yieldPercent', parseFloat(e.target.value) || 100)}
                                                        className="w-16 text-center"
                                                    />
                                                    <span className="text-gray-400">%</span>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <LightInput
                                                    type="number"
                                                    value={ing.quantityUsed}
                                                    onChange={(e: any) => updateIngredient(ing.id, 'quantityUsed', parseFloat(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-bold text-emerald-600">
                                                ${finalCost.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => removeIngredient(ing.id)} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </LightCard>

                <div className="space-y-6">
                    <LightCard>
                        <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Metrics</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Selling Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                                    <LightInput
                                        type="number"
                                        value={sellingPrice}
                                        onChange={(e: any) => setSellingPrice(parseFloat(e.target.value) || 1)}
                                        className="w-full pl-6 font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Target Cost %</label>
                                <div className="relative">
                                    <LightInput
                                        type="number"
                                        value={targetCostPercent}
                                        onChange={(e: any) => setTargetCostPercent(parseFloat(e.target.value) || 1)}
                                        className="w-full pr-6 font-semibold"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-400">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Total Food Cost</span>
                                <span className="text-xl font-bold text-gray-900">${totalFoodCost.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Food Cost %</span>
                                <span className={`text-xl font-bold ${foodCostPercent > targetCostPercent ? 'text-red-500' : 'text-blue-600'}`}>
                                    {foodCostPercent.toFixed(1)}%
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-gray-600 text-sm">Variance</span>
                                <span className={`text-sm font-bold ${variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </LightCard>
                </div>
            </div>
        </div>
    );
};


// MODULE 2: Recipe-Costing Tool
const RecipeCostModule = () => {
    const [ingredients, setIngredients] = useState<RecipeCostIngredient[]>([
        { id: '1', name: 'Flour', quantity: 1, unitCost: 1.50 },
        { id: '2', name: 'Sugar', quantity: 0.5, unitCost: 2.00 },
    ]);
    const [batchSize, setBatchSize] = useState(10);
    const [desiredServings, setDesiredServings] = useState(50); // For scaling

    const addIngredient = () => {
        setIngredients([...ingredients, { id: Math.random().toString(), name: '', quantity: 0, unitCost: 0 }]);
    };

    const updateIngredient = (id: string, field: keyof RecipeCostIngredient, value: string | number) => {
        setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.id !== id));
    };

    const recipeCost = ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.unitCost), 0);
    const costPerPortion = recipeCost / batchSize;
    const scalingFactor = desiredServings / batchSize;
    const scaledRecipeCost = recipeCost * scalingFactor;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LightCard>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Recipe Ingredients</h3>
                    <button onClick={addIngredient} className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors">+ Add Row</button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {ingredients.map(ing => (
                        <div key={ing.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="col-span-5">
                                <LightInput
                                    value={ing.name}
                                    onChange={(e: any) => updateIngredient(ing.id, 'name', e.target.value)}
                                    placeholder="Ingredient"
                                />
                            </div>
                            <div className="col-span-3">
                                <LightInput
                                    type="number"
                                    value={ing.quantity}
                                    onChange={(e: any) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    placeholder="Qty"
                                />
                            </div>
                            <div className="col-span-3">
                                <LightInput
                                    type="number"
                                    value={ing.unitCost}
                                    onChange={(e: any) => updateIngredient(ing.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                    placeholder="Cost"
                                />
                            </div>
                            <div className="col-span-1 text-center">
                                <button onClick={() => removeIngredient(ing.id)} className="text-gray-400 hover:text-red-500">x</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500">Batch Size (Servings)</label>
                        <LightInput
                            type="number"
                            value={batchSize}
                            onChange={(e: any) => setBatchSize(parseFloat(e.target.value) || 1)}
                            className="bg-gray-50"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total Recipe Cost</p>
                        <p className="text-2xl font-bold text-gray-900">${recipeCost.toFixed(2)}</p>
                        <p className="text-sm text-emerald-600">${costPerPortion.toFixed(2)} / portion</p>
                    </div>
                </div>
            </LightCard>

            <LightCard className="flex flex-col justify-center bg-gray-50 border-blue-200">
                <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2">
                    <TrendingUp /> Scaling Forecast
                </h3>

                <div className="bg-white p-6 rounded-2xl border border-blue-100 space-y-6 shadow-sm">
                    <div>
                        <label className="text-sm text-gray-500 font-bold uppercase mb-2 block">Desired Servings</label>
                        <div className="flex items-center gap-4">
                            <LightInput
                                type="number"
                                value={desiredServings}
                                onChange={(e: any) => setDesiredServings(parseFloat(e.target.value) || 0)}
                                className="text-3xl font-bold text-center h-16 w-32 border-blue-300 bg-blue-50 text-blue-900"
                            />
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm">Scaling Factor</p>
                                <p className="text-blue-600 font-bold text-xl">{scalingFactor.toFixed(2)}x</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-gray-500 text-sm mb-1">Projected Cost for {desiredServings} servings:</p>
                        <p className="text-4xl font-bold text-gray-900">${scaledRecipeCost.toFixed(2)}</p>
                    </div>
                </div>
            </LightCard>
        </div>
    );
}

// MODULE 3: Full-Cost Accounting
const FullCostModule = () => {
    // Inputs
    const [baseRecipeCost, setBaseRecipeCost] = useState(150);
    const [batchSize, setBatchSize] = useState(50);
    const [sellingPrice, setSellingPrice] = useState(12);

    const [labourRate, setLabourRate] = useState(15);
    const [labourHours, setLabourHours] = useState(4);
    const [utilityCost, setUtilityCost] = useState(5);
    const [packagingCost, setPackagingCost] = useState(15);
    const [equipmentDepreciation, setEquipmentDepreciation] = useState(2);
    const [overheadPercent, setOverheadPercent] = useState(10); // % of recipe cost

    // Calculations
    const labourCost = labourRate * labourHours;
    const overheadCost = (baseRecipeCost * overheadPercent) / 100;

    const fullCost = baseRecipeCost + labourCost + utilityCost + packagingCost + equipmentDepreciation + overheadCost;
    const finalCostPerPortion = fullCost / batchSize;

    const profitMargin = sellingPrice - finalCostPerPortion;
    const profitMarginPercent = (profitMargin / sellingPrice) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LightCard>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Calculator className="text-amber-500" /> Cost Variables
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div>
                            <label className="text-xs text-gray-500">Base Recipe Cost ($)</label>
                            <LightInput
                                type="number"
                                value={baseRecipeCost}
                                onChange={(e: any) => setBaseRecipeCost(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Batch Size</label>
                            <LightInput
                                type="number"
                                value={batchSize}
                                onChange={(e: any) => setBatchSize(parseFloat(e.target.value) || 1)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="col-span-2 text-blue-600 font-bold text-xs uppercase tracking-widest mt-2">Labour</div>
                        <div>
                            <label className="text-[10px] text-gray-500">Hourly Rate ($)</label>
                            <LightInput type="number" value={labourRate} onChange={(e: any) => setLabourRate(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">Hours Spend</label>
                            <LightInput type="number" value={labourHours} onChange={(e: any) => setLabourHours(parseFloat(e.target.value))} />
                        </div>

                        <div className="col-span-2 text-blue-600 font-bold text-xs uppercase tracking-widest mt-2">Overhead & Ops</div>
                        <div>
                            <label className="text-[10px] text-gray-500">Utilities ($/batch)</label>
                            <LightInput type="number" value={utilityCost} onChange={(e: any) => setUtilityCost(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">Packaging ($/batch)</label>
                            <LightInput type="number" value={packagingCost} onChange={(e: any) => setPackagingCost(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">Equip. Depr. ($)</label>
                            <LightInput type="number" value={equipmentDepreciation} onChange={(e: any) => setEquipmentDepreciation(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">Overhead (%)</label>
                            <div className="relative">
                                <LightInput type="number" value={overheadPercent} onChange={(e: any) => setOverheadPercent(parseFloat(e.target.value))} className="pr-6" />
                                <span className="absolute right-3 top-2 text-gray-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </LightCard>

            <div className="space-y-6">
                <LightCard className="bg-gray-900 border-none text-white shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Analysis</h3>

                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Base Recipe Cost</span>
                            <span className="text-white">${baseRecipeCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">+ Labour</span>
                            <span className="text-white">${labourCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">+ Overheads & util</span>
                            <span className="text-white">${(utilityCost + packagingCost + equipmentDepreciation + overheadCost).toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-gray-700 my-2" />
                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-blue-400">Full Batch Cost</span>
                            <span className="text-white">${fullCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="text-emerald-400">Final Cost / Portion</span>
                            <span className="text-white">${finalCostPerPortion.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Target Selling Price</label>
                        <div className="relative mb-2">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={sellingPrice}
                                onChange={(e: any) => setSellingPrice(parseFloat(e.target.value) || 0)}
                                className="pl-6 w-full text-lg font-bold bg-gray-700 border-gray-600 rounded-lg py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <p className="text-xs text-gray-400">Profit Margin ($)</p>
                                <p className={`font-bold text-lg ${profitMargin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profitMargin.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Margin %</p>
                                <p className={`font-bold text-2xl ${profitMarginPercent > 20 ? 'text-emerald-400' : 'text-orange-400'}`}>{profitMarginPercent.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </LightCard>
            </div>
        </div>
    );
};


export default function CostingDashboard() {
    const [activeModule, setActiveModule] = useState<1 | 2 | 3>(1);

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-gray-900 pb-32">

            <div className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2">
                    Accounting & Costing
                </h1>
                <p className="text-gray-500">Professional financial tools for the modern kitchen.</p>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={() => setActiveModule(1)}
                        className={`px-6 py-3 rounded-xl border font-bold transition-all flex items-center gap-2 shadow-sm ${activeModule === 1
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <DollarSign size={18} /> Food-Cost Calc
                    </button>
                    <button
                        onClick={() => setActiveModule(2)}
                        className={`px-6 py-3 rounded-xl border font-bold transition-all flex items-center gap-2 shadow-sm ${activeModule === 2
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ChefHat size={18} /> Recipe Costing
                    </button>
                    <button
                        onClick={() => setActiveModule(3)}
                        className={`px-6 py-3 rounded-xl border font-bold transition-all flex items-center gap-2 shadow-sm ${activeModule === 3
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Briefcase size={18} /> Full Accounting
                    </button>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeModule === 1 && <FoodCostModule />}
                    {activeModule === 2 && <RecipeCostModule />}
                    {activeModule === 3 && <FullCostModule />}
                </div>
            </div>

        </div>
    );
}
