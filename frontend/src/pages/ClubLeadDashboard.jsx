import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, arrayUnion } from "firebase/firestore";
import { db } from "../conf/firebase";
import { useAuth } from "../context/mainContext";
import { PlusCircle, Users, CheckCircle, Clock } from "lucide-react";

const ClubLeadDashboard = () => {
    const { user, userData } = useAuth();
    const [myActivities, setMyActivities] = useState([]);
    const [showPostForm, setShowPostForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", desc: "" });

    // 1. Fetch activities belonging ONLY to this Lead's club
    useEffect(() => {
        if (!userData?.managed_club) return;
        
        const q = query(collection(db, "activities"), where("club_name", "==", userData.managed_club));
        const unsub = onSnapshot(q, (snap) => {
            setMyActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [userData]);

    // 2. Post a new activity to the community
    const handlePostEvent = async (e) => {
        e.preventDefault();
        
        // Debugging: See what the app actually sees in your profile
        console.log("Current User Data:", userData);

        // Verify the field name matches EXACTLY what is in image_23fe23.png
        const clubIdentifier = userData?.clubs || userData?.managed_club;

        if (!clubIdentifier) {
            alert("Verification Error: No club assigned to your profile in the database.");
            return;
        }

        try {
            await addDoc(collection(db, "activities"), {
                club_name: clubIdentifier,          // Uses "GDG" from your DB
                event_title: newEvent.title.trim(), // From "IIC HULT PRICE"
                description: newEvent.desc.trim(),  // From "NEED VALENTINES"
                timer_end: Date.now() + 3600000,    // 1-hour window
                volunteer_list: []                  // Initialized tracking
            });
            
            setShowPostForm(false);
            setNewEvent({ title: "", desc: "" });
            alert("Success! Your activity is now live on the Discovery Stack.");
        } catch (err) {
            console.error("Firestore Write Error:", err);
        }
    };

    if (userData?.role !== "club_lead") return <div className="p-20 text-white">Access Restricted to Club Heads.</div>;

    return (
        <div className="p-6 text-white bg-slate-950 min-h-screen">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-blue-400 uppercase italic">Club Control: {userData.managed_club}</h1>
                    <p className="text-slate-400">Manage your events and track your verified volunteers.</p>
                </div>
                <button 
                    onClick={() => setShowPostForm(!showPostForm)}
                    className="bg-blue-600 hover:bg-blue-500 p-3 rounded-2xl flex items-center gap-2 font-bold transition-all"
                >
                    <PlusCircle size={20} /> Create Activity
                </button>
            </div>

            {/* FORM TO POST EVENT */}
            {showPostForm && (
                <form onSubmit={handlePostEvent} className="mb-10 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <input 
                        className="w-full bg-black/50 p-4 rounded-xl border border-white/10 outline-none focus:border-blue-400"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        required
                    />
                    <textarea 
                        className="w-full bg-black/50 p-4 rounded-xl border border-white/10 outline-none focus:border-blue-400 h-32"
                        placeholder="Event Description & Volunteer Requirements"
                        value={newEvent.desc}
                        onChange={(e) => setNewEvent({...newEvent, desc: e.target.value})}
                        required
                    />
                    <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-bold">Post to Discovery Stack</button>
                </form>
            )}

            {/* ACTIVITY TRACKING LIST */}
            <div className="grid grid-cols-1 gap-6">
                {myActivities.map(act => (
                    <div key={act.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{act.event_title}</h2>
                            <div className="flex items-center gap-2 text-pink-500 text-xs font-bold uppercase">
                                <Clock size={14} /> 1H Window Active
                            </div>
                        </div>
                        
                        <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                            <Users size={16} /> Applicants ({act.volunteer_list?.length || 0})
                        </h3>
                        
                        <div className="flex flex-wrap gap-3">
                            {act.volunteer_list?.map((vUID, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                                    <span className="text-xs font-medium text-blue-300">Student ID: {vUID.slice(0,5)}...</span>
                                    <button className="text-emerald-400 hover:text-emerald-300"><CheckCircle size={18} /></button>
                                </div>
                            ))}
                            {act.volunteer_list?.length === 0 && <p className="text-xs text-slate-600">Waiting for swipes on the Discovery Page...</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClubLeadDashboard;