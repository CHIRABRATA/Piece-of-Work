import React, { useState, useEffect, useRef } from "react";
import { Edit3, Save, Camera, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../context/mainContext";
import { db, storage } from "../conf/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Profile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ Name: "", DEPT: "", BIO: "", photoURL: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const docRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setFormData(prev => ({ ...prev, ...snap.data() }));
      }
    });
    return () => unsub();
  }, [user]);

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.uid) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, formData, { merge: true });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const defaultPhoto = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto text-white min-h-screen">
      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 px-6 py-3 rounded-2xl flex items-center gap-2 shadow-2xl animate-bounce z-50">
          <CheckCircle size={20} /> Updated Successfully!
        </div>
      )}

      {/* Header Profile Section */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-16 shadow-xl">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div 
            onClick={handleImageClick}
            className={`relative w-32 h-32 rounded-full border-4 border-slate-950 overflow-hidden bg-slate-800 ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
          >
            <img 
              src={formData.photoURL || defaultPhoto} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {uploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
        </div>
      </div>

      <div className="text-center mt-16 space-y-6">
        {isEditing ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none"
              value={formData.Name} 
              onChange={(e) => setFormData({...formData, Name: e.target.value})}
              placeholder="Full Name"
            />
            <input 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none"
              value={formData.DEPT} 
              onChange={(e) => setFormData({...formData, DEPT: e.target.value})}
              placeholder="Department"
            />
            <textarea 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none"
              value={formData.BIO} 
              onChange={(e) => setFormData({...formData, BIO: e.target.value})}
              placeholder="Tell us about yourself..."
              rows={3}
            />
            <div className="flex gap-3">
              <button 
                onClick={handleSave} 
                disabled={saving || uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button onClick={() => setIsEditing(false)} className="px-6 bg-slate-800 hover:bg-slate-700 rounded-xl">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-4xl font-black tracking-tight">{formData.Name || "Unnamed Student"}</h1>
            <p className="text-blue-400 font-semibold tracking-widest uppercase text-sm mt-2">{formData.DEPT || "Department Not Set"}</p>
            <p className="mt-6 text-slate-400 max-w-lg mx-auto leading-relaxed italic">"{formData.BIO || "Share something about yourself here."}"</p>
            
            <button 
              onClick={() => setIsEditing(true)} 
              className="mt-8 bg-white text-black px-10 py-3 rounded-full font-bold flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
            >
              <Edit3 size={18} /> Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;