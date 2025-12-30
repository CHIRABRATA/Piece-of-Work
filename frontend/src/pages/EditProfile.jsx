import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Camera, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/mainContext";

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        regNo: "",
        photoUrl: "",
        bio: "",
        interests: "",
        year: "1st Year",
        batch: "2024",
        branch: "Computer Science",
        clubs: "",
        skills: ""
    });

    useEffect(() => {
        // Fetch current profile from local API
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    // For simplicity, we use 'default' or user.uid if available
                    const profile = data.profiles[user?.uid || 'default'];
                    if (profile) {
                        setFormData({
                            ...profile,
                            interests: Array.isArray(profile.interests) ? profile.interests.join(", ") : (profile.interests || "")
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                profiles: {
                    [user?.uid || 'default']: {
                        ...formData,
                        // Calculate stats if they don't exist
                        stats: formData.stats || { matches: 0, views: 0, likes: 0 }
                    }
                }
            };

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                navigate("/profile");
            } else {
                alert("Failed to save profile");
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Error saving profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.name) return <div className="flex items-center justify-center h-full text-white">Loading Profile...</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", height: "100%", overflowY: "auto", color: "white" }}>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold italic tracking-tighter">EDIT <span className="text-blue-400">PROFILE</span></h1>
                <button onClick={() => navigate("/profile")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div style={{
                            width: "120px", height: "120px", borderRadius: "50%",
                            backgroundImage: `url(${formData.photoUrl || 'https://via.placeholder.com/150'})`,
                            backgroundSize: "cover", backgroundPosition: "center",
                            border: "4px solid #05d9e8"
                        }} />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <Camera size={30} />
                        </div>
                    </div>
                    <input
                        type="text"
                        name="photoUrl"
                        placeholder="Image URL (e.g. Unsplash link)"
                        value={formData.photoUrl}
                        onChange={handleChange}
                        className="mt-4 bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full max-w-sm text-sm outline-none focus:border-blue-400 transition"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" />
                    <InputField label="ID / Reg No" name="regNo" value={formData.regNo} onChange={handleChange} placeholder="2024CS01" />

                    <SelectField
                        label="Branch / Department"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        options={["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical"]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            options={["1st Year", "2nd Year", "3rd Year", "4th Year"]}
                        />
                        <InputField label="Batch" name="batch" value={formData.batch} onChange={handleChange} placeholder="2024" />
                    </div>
                </div>

                <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />

                <InputField label="Interests (Comma separated)" name="interests" value={formData.interests} onChange={handleChange} placeholder="Coding, Music, Gaming..." />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Clubs & Societies" name="clubs" value={formData.clubs} onChange={handleChange} placeholder="Hacker Club, Drama Soc..." />
                    <InputField label="Tech Skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Python, Figma..." />
                </div>

                <div className="pt-8 flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> SAVE CHANGES
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="px-8 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition"
                    >
                        CANCEL
                    </button>
                </div>
            </form>
        </div>
    );
};

const InputField = ({ label, name, value, onChange, placeholder }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition"
        />
    </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition resize-none"
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition"
        >
            {options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
        </select>
    </div>
);

export default EditProfile;
