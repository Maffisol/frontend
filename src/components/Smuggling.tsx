import React, { useEffect, useState } from 'react';

const PLAYER_API_URL = import.meta.env.VITE_PLAYER_API_URL;


interface SmugglingProps {
    walletAddress: string | undefined;
}

interface InventoryItem {
    itemName: string;
    quantity: number;
    value: number;
    xp: number;
}

const Smuggling: React.FC<SmugglingProps> = ({ walletAddress }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!walletAddress) {
            setError("Wallet address is missing.");
            setLoading(false);
            return;
        }

        async function fetchInventory() {
            try {
                setLoading(true);
                const response = await fetch(`${PLAYER_API_URL}/inventory/${walletAddress}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch inventory");
                }
                const data = await response.json();
                setInventory(data.inventory);

                // Initialize selected quantities
                const initialQuantities = data.inventory.reduce(
                    (acc: Record<string, number>, item: InventoryItem) => ({
                        ...acc,
                        [item.itemName]: 1,
                    }),
                    {}
                );
                setSelectedQuantities(initialQuantities);
            } catch (err) {
                console.error("Error fetching inventory:", err);
                setError("Failed to load inventory. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchInventory();
    }, [walletAddress]);

    const updateQuantity = (itemName: string, increment: boolean) => {
        setSelectedQuantities((prev) => ({
            ...prev,
            [itemName]: Math.max(
                1,
                Math.min(
                    inventory.find((item) => item.itemName === itemName)?.quantity || 1,
                    prev[itemName] + (increment ? 1 : -1)
                )
            ),
        }));
    };

    const sellItem = async (itemName: string) => {
        if (!walletAddress) return;

        const quantityToSell = selectedQuantities[itemName] || 1;

        try {
            const response = await fetch(`${PLAYER_API_URL}/sell-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, itemName, quantity: quantityToSell }),
            });
            if (!response.ok) {
                throw new Error("Failed to sell item");
            }
            const data = await response.json();
            setInventory(data.inventory);

            // Update selected quantities for remaining items
            const updatedQuantities = { ...selectedQuantities };
            if (data.inventory.find((item: InventoryItem) => item.itemName === itemName)) {
                updatedQuantities[itemName] = Math.min(
                    updatedQuantities[itemName],
                    data.inventory.find((item: InventoryItem) => item.itemName === itemName).quantity
                );
            } else {
                delete updatedQuantities[itemName];
            }
            setSelectedQuantities(updatedQuantities);
        } catch (error) {
            console.error("Error selling item:", error);
            setError("Failed to sell item. Please try again.");
        }
    };

    const calculateTotals = () => {
        let totalMoney = 0;
        let totalXp = 0;

        inventory.forEach((item) => {
            const selectedQuantity = selectedQuantities[item.itemName] || 0;
            totalMoney += selectedQuantity * item.value;
            totalXp += selectedQuantity * item.xp;
        });

        return { totalMoney, totalXp };
    };

    const { totalMoney, totalXp } = calculateTotals();

    if (loading) {
        return <div className="text-yellow-300 text-center">Loading inventory...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-lg mx-auto text-white">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Smuggling Inventory</h2>

            {/* Total Rewards Section */}
            <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg text-center">
                <h3 className="text-yellow-400 font-bold text-lg">Total Rewards</h3>
                <p className="text-green-400">Total Money: ${totalMoney}</p>
                <p className="text-blue-400">Total XP: {totalXp}</p>
            </div>

            {inventory.length > 0 ? (
                <ul className="space-y-4">
                    {inventory.map((item) => {
                        const selectedQuantity = selectedQuantities[item.itemName] || 1;
                        const totalValue = selectedQuantity * item.value;
                        const totalXp = selectedQuantity * item.xp;

                        return (
                            <li
                            key={item.itemName}
                            className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-300">{item.itemName}</h3>
                                <p className="text-gray-400">
                                    Quantity: <span className="text-white">{item.quantity}</span> | Selected:{" "}
                                    <span className="text-white">{selectedQuantity}</span>
                                </p>
                                <p className="text-gray-400">
                                    Total Value: <span className="text-green-400">${totalValue}</span> | Total XP:{" "}
                                    <span className="text-blue-400">{totalXp}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => updateQuantity(item.itemName, false)}
                                    className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                                >
                                    -
                                </button>
                                <span className="text-white">{selectedQuantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.itemName, true)}
                                    className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                                >
                                    +
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded shadow-md transition duration-300"
                                    onClick={() => sellItem(item.itemName)}
                                >
                                    Sell
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            ) : (
                <p className="text-center text-gray-300">No items in inventory to sell.</p>
            )}
        </div>
    );
};

export default Smuggling;
