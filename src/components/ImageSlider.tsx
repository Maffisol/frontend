import React, { useEffect, useState } from 'react';

const images = [
    '/assets/IMG_5487.PNG',
    '/assets/IMG_5489.PNG',
    '/assets/IMG_5495.PNG',
];

const ImageSlider: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change slide every 3 seconds

        return () => clearInterval(interval); // Clear interval on component unmount
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mt-12 mb-12">
            {/* Slides */}
            <div className="relative overflow-hidden h-96"> {/* Increased height */}
                {images.map((image, index) => (
                    <img
                        key={index}
                        src={image}
                        alt={`Slide ${index + 1}`}
                        className={`w-full h-full object-cover ${
                            index === currentIndex ? 'block' : 'hidden'
                        }`}
                    />
                ))}

                {/* Navigation Dots inside the slider */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-full">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-3 w-3 rounded-full ${
                                index === currentIndex ? 'bg-yellow-500' : 'bg-gray-300'
                            } focus:outline-none`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ImageSlider;
