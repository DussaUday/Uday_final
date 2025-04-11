import React, { useState, useRef } from "react";
import { BsImage, BsX, BsCheck } from "react-icons/bs";
import { FiFilter } from "react-icons/fi";
import { RiCropLine } from "react-icons/ri";
import usePost from "../../hooks/usePost";
import UserPosts from "./UserPosts";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("none");
    const [filterIntensity, setFilterIntensity] = useState(1);
    const [crop, setCrop] = useState({
        aspect: 1 / 1,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
    });
    const [croppedMedia, setCroppedMedia] = useState(null);
    const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'filters' or 'crop'
    const mediaRef = useRef(null);
    const { createPost, loading } = usePost();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(file);
            setCroppedMedia(null);
            setActiveTab("crop");
        }
    };

    const handleRemoveMedia = () => {
        setMedia(null);
        setCroppedMedia(null);
        setSelectedFilter("none");
        setFilterIntensity(1);
        setActiveTab("upload");
    };

    const handleCropComplete = (crop) => {
        if (media && media.type.startsWith("image") && mediaRef.current) {
            const image = mediaRef.current;
            const canvas = document.createElement("canvas");
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            canvas.toBlob((blob) => {
                setCroppedMedia(blob);
            }, media.type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!media) return;
        
        try {
            const formData = new FormData();
            
            let fileToUpload;
            if (croppedMedia) {
                fileToUpload = new File([croppedMedia], "post-media.jpg", {
                    type: "image/jpeg"
                });
            } else {
                fileToUpload = media;
            }
    
            formData.append("media", fileToUpload);
            formData.append("caption", caption);
            formData.append("filter", selectedFilter);
            formData.append("filterIntensity", filterIntensity.toString());
    
            const success = await createPost(formData);
            if (success) {
                setMedia(null);
                setCroppedMedia(null);
                setCaption("");
                setSelectedFilter("none");
                setFilterIntensity(1);
                navigate("/");
            }
        } catch (error) {
            console.error("Error:", error);
            alert(`Failed to create post: ${error.message}`);
        }
    };

    const filters = [
        { name: "None", value: "none" },
        { name: "Grayscale", value: "grayscale" },
        { name: "Sepia", value: "sepia" },
        { name: "Blur", value: "blur" },
        { name: "Brightness", value: "brightness" },
        { name: "Contrast", value: "contrast" },
        { name: "Hue Rotate", value: "hue-rotate" },
        { name: "Saturate", value: "saturate" },
        { name: "Invert", value: "invert" },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 md:p-6">
                    <h1 className="text-2xl font-bold text-gray-800">Create New Post</h1>
                    <p className="text-gray-500 mt-1">Share photos and videos with your friends</p>
                </div>

                {/* Main Content */}
                <div className="p-4 md:p-6">
                    {!media ? (
                        // Upload Section
                        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <BsImage className="text-4xl text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Drag photos and videos here</h3>
                            <label className="cursor-pointer">
                                <span className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                                    Select from computer
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*, video/*"
                                />
                            </label>
                            <p className="text-gray-400 text-sm mt-3">JPEG, PNG, MP4 supported</p>
                        </div>
                    ) : (
                        // Media Editing Section
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Media Preview */}
                            <div className="flex-1">
                                <div className="relative bg-black rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                                    {media.type.startsWith("image") ? (
                                        activeTab === "crop" ? (
                                            <ReactCrop
                                                src={URL.createObjectURL(media)}
                                                crop={crop}
                                                onChange={(newCrop) => setCrop(newCrop)}
                                                onComplete={handleCropComplete}
                                                ruleOfThirds
                                                className="max-h-[500px]"
                                            >
                                                <img
                                                    ref={mediaRef}
                                                    src={URL.createObjectURL(media)}
                                                    alt="Preview"
                                                    className={`w-full h-full object-contain ${selectedFilter}`}
                                                    style={{
                                                        filter: `${selectedFilter}(${filterIntensity}${
                                                            selectedFilter === "hue-rotate" ? "deg" : 
                                                            selectedFilter === "blur" ? "px" : ""
                                                        })`,
                                                    }}
                                                />
                                            </ReactCrop>
                                        ) : (
                                            <img
                                                src={URL.createObjectURL(croppedMedia || media)}
                                                alt="Preview"
                                                className={`w-full h-full object-contain ${selectedFilter}`}
                                                style={{
                                                    filter: `${selectedFilter}(${filterIntensity}${
                                                        selectedFilter === "hue-rotate" ? "deg" : 
                                                        selectedFilter === "blur" ? "px" : ""
                                                    })`,
                                                }}
                                            />
                                        )
                                    ) : (
                                        <video
                                            src={URL.createObjectURL(media)}
                                            className="w-full h-full object-contain"
                                            controls
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-100 transition-all"
                                        onClick={handleRemoveMedia}
                                    >
                                        <BsX className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            {/* Editing Controls */}
                            <div className="md:w-80 flex flex-col">
                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 mb-4">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 font-medium text-sm ${
                                            activeTab === "crop" 
                                                ? "text-blue-500 border-b-2 border-blue-500" 
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                        onClick={() => setActiveTab("crop")}
                                    >
                                        <RiCropLine className="inline mr-2" />
                                        Crop
                                    </button>
                                    {media.type.startsWith("image") && (
                                        <button
                                            type="button"
                                            className={`flex-1 py-2 font-medium text-sm ${
                                                activeTab === "filters" 
                                                    ? "text-blue-500 border-b-2 border-blue-500" 
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                            onClick={() => setActiveTab("filters")}
                                        >
                                            <FiFilter className="inline mr-2" />
                                            Filters
                                        </button>
                                    )}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {activeTab === "crop" && (
                                        <div className="space-y-4">
                                            <h3 className="font-medium text-gray-700">Crop Settings</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { label: "Original", ratio: NaN },
                                                    { label: "1:1", ratio: 1/1 },
                                                    { label: "4:5", ratio: 4/5 },
                                                    { label: "16:9", ratio: 16/9 },
                                                    { label: "3:2", ratio: 3/2 },
                                                    { label: "2:3", ratio: 2/3 },
                                                ].map((item) => (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        className={`p-2 text-xs border rounded-md ${
                                                            isNaN(item.ratio) 
                                                                ? isNaN(crop.aspect) 
                                                                    ? "border-blue-500 bg-blue-50 text-blue-600" 
                                                                    : "border-gray-200 hover:border-gray-300"
                                                                : crop.aspect === item.ratio 
                                                                    ? "border-blue-500 bg-blue-50 text-blue-600" 
                                                                    : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                        onClick={() => setCrop(prev => ({ ...prev, aspect: item.ratio }))}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="pt-4">
                                                <button
                                                    type="button"
                                                    className="w-full py-2 bg-blue-500 text-white rounded-md flex items-center justify-center hover:bg-blue-600 transition-colors"
                                                    onClick={() => setActiveTab("filters")}
                                                >
                                                    <BsCheck className="mr-2" />
                                                    Apply Crop
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "filters" && media.type.startsWith("image") && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="font-medium text-gray-700 mb-3">Filters</h3>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {filters.map((filter) => (
                                                        <button
                                                            key={filter.value}
                                                            type="button"
                                                            className={`flex flex-col items-center p-2 rounded-md ${
                                                                selectedFilter === filter.value
                                                                    ? "bg-blue-50 border border-blue-200"
                                                                    : "hover:bg-gray-50"
                                                            }`}
                                                            onClick={() => setSelectedFilter(filter.value)}
                                                        >
                                                            <div 
                                                                className="w-16 h-16 rounded-md mb-2 overflow-hidden"
                                                                style={{
                                                                    filter: `${filter.value}(${
                                                                        filter.value === "none" ? 0 : 
                                                                        filter.value === "hue-rotate" ? "90deg" : 
                                                                        filter.value === "blur" ? "2px" : "1"
                                                                    })`,
                                                                    backgroundImage: filter.value === "none" 
                                                                        ? 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHg9IjEwIiB5PSIxMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgeD0iMTAiIHk9IjAiIGZpbGw9IiNlZWUiLz48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHg9IjAiIHk9IjEwIiBmaWxsPSIjZWVlIi8+PC9zdmc+")'
                                                                        : 'none'
                                                                }}
                                                            >
                                                                <img
                                                                    src={URL.createObjectURL(croppedMedia || media)}
                                                                    alt="Filter preview"
                                                                    className="w-full h-full object-cover"
                                                                    style={{
                                                                        filter: `${filter.value}(${
                                                                            filter.value === "none" ? 0 : 
                                                                            filter.value === "hue-rotate" ? "90deg" : 
                                                                            filter.value === "blur" ? "2px" : "1"
                                                                        })`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-700">{filter.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedFilter !== "none" && (
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-700">Intensity</span>
                                                        <span className="text-xs text-gray-500">
                                                            {filterIntensity.toFixed(1)}
                                                            {selectedFilter === "hue-rotate" ? "°" : 
                                                             selectedFilter === "blur" ? "px" : ""}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={
                                                            selectedFilter === "hue-rotate" ? "360" : 
                                                            selectedFilter === "blur" ? "10" : "2"
                                                        }
                                                        step="0.1"
                                                        value={filterIntensity}
                                                        onChange={(e) => setFilterIntensity(parseFloat(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-2">
                                                <textarea
                                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    rows="3"
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    placeholder="Write a caption..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4 border-t border-gray-200 mt-auto">
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                                        onClick={handleSubmit}
                                        disabled={loading || !media}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Posting...
                                            </>
                                        ) : (
                                            "Share Post"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Posts Section */}
            <div className="mt-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Recent Posts</h2>
                <UserPosts />
            </div>
        </div>
    );
};

export default CreatePost;