import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import ProfileCard from './ProfileCard';
import ImageSlider from './ImageSlider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faArrowsAltH } from '@fortawesome/free-solid-svg-icons'; // Raster- en scroll-iconen

const Home: React.FC<{ walletAddress: string }> = ({ walletAddress }) => {
    const [activeLeaderboard, setActiveLeaderboard] = useState<'players' | 'families'>('players');
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [isGridView, setIsGridView] = useState(false);

    // Refs & States voor slepen en swipen
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const touchStartX = useRef<number>(0);

    // Muis Events
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current || isGridView) return;
        setIsDragging(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !sliderRef.current || isGridView) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll snelheid
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => {
        if (sliderRef.current && !isGridView) {
            touchStartX.current = e.touches[0].clientX;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (sliderRef.current && !isGridView) {
            const touchCurrentX = e.touches[0].clientX;
            const walk = (touchStartX.current - touchCurrentX) * 2; // Scroll snelheid
            sliderRef.current.scrollLeft += walk;
            touchStartX.current = touchCurrentX;
        }
    };

    const colors = [
        'bg-yellow-500', 'bg-purple-500', 'bg-green-500', 'bg-blue-500', 'bg-red-500', 'bg-green-700', 'bg-pink-500'
    ];

    return (
        <div className="flex flex-col items-center bg-gray-900 min-h-screen text-white mx-auto max-w-3xl">
            {/* Image Slider */}
            <div className="w-full mx-auto">
                <ImageSlider />
            </div>

            {/* Toggle View Button */}
            <div className="flex justify-end w-full px-4">
                <button
                    onClick={() => setIsGridView(!isGridView)}
                    className="bg-gray-700 text-white p-2 rounded hover:bg-gray-600 transition mb-4 flex items-center justify-center"
                >
                    <FontAwesomeIcon
                        icon={isGridView ? faArrowsAltH : faTh}
                        className="text-xl"
                        title={isGridView ? 'Switch to Scroll View' : 'Switch to Grid View'}
                    />
                </button>
            </div>

            {/* Tiles Section with Grid or Scrollable View */}
            <section
                ref={sliderRef}
                className={`w-full px-4 pb-2 ${isGridView ? 'grid grid-cols-3 sm:grid-cols-5 gap-4' : 'flex overflow-hidden space-x-4'}`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                {[
                    { path: '/business', label: 'Business', iconPath: '/assets/business-icon.png' },
                    { path: '/minigame', label: 'Mini Game', iconPath: '/assets/minigame-icon.png' },
                    { path: '/shop', label: 'Shop', iconPath: '/assets/shop-icon.png' },
                    { path: '/families', label: 'Families', iconPath: '/assets/families-icon.png' },
                    { path: '/FamilyDashboard', label: 'Family Dashboard', iconPath: '/assets/dashboard-icon.png' },
                    { path: '/smuggling', label: 'Smuggling', iconPath: '/assets/smuggling-icon.png' },
                    { path: '/steal-car', label: 'Steal a Car', iconPath: '/assets/steal-car-icon.png' },
                    { path: '/crimes', label: 'Crimes', iconPath: '/assets/crimes-icon.png' },
                    { path: '/jail', label: 'Jail', iconPath: '/assets/jail-icon.png' },
                    { path: '/kill', label: 'Kill', iconPath: '/assets/kill-icon.png' },
                ].map((tile, index) => (
                    <Link
                        key={index}
                        to={tile.path}
                        className={`${colors[index % colors.length]} hover:brightness-110 flex flex-col items-center justify-center text-white rounded-lg shadow-lg transition-transform transform hover:scale-105 ${isGridView ? 'w-full h-32' : 'w-32 h-32 flex-shrink-0'}`}
                    >
                        <img src={tile.iconPath} alt={tile.label} className="w-10 h-10 mb-1" />
                        <span className="mt-1 text-sm font-semibold">{tile.label}</span>
                    </Link>
                ))}
            </section>

            {/* Leaderboard Section */}
            <div className="flex justify-center w-full px-4">
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 w-full max-w-3xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-yellow-400">
                            {activeLeaderboard === 'players' ? 'Player Leaderboard' : 'Family Leaderboard'}
                        </h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveLeaderboard('players')}
                                className={`px-2 py-1 rounded ${activeLeaderboard === 'players' ? 'bg-yellow-500' : 'bg-gray-700 text-white'}`}
                            >
                                P
                            </button>
                            <button
                                onClick={() => setActiveLeaderboard('families')}
                                className={`px-2 py-1 rounded ${activeLeaderboard === 'families' ? 'bg-yellow-500' : 'bg-gray-700 text-white'}`}
                            >
                                F
                            </button>
                        </div>
                    </div>
                    <Leaderboard type={activeLeaderboard} />
                </div>
            </div>
            
            {/* Profile Card Modal */}
            {showProfileCard && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-md">
                        <button 
                            onClick={() => setShowProfileCard(false)} 
                            className="text-white float-right mb-2"
                        >
                            ✖
                        </button>
                        <ProfileCard walletAddress={walletAddress} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
