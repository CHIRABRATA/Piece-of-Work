import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../conf/firebase";
import { useAuth } from "../context/mainContext";
import { Clock, Users, ShieldCheck } from "lucide-react";

const ClubHub = () => {
  const [activities, setActivities] = useState([]);
  const { user, userData } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "activities"), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleVolunteer = async (activityId) => {
    const ref = doc(db, "activities", activityId);
    await updateDoc(ref, {
      volunteer_list: arrayUnion(user.uid)
    });
    alert("Onboarded as Volunteer! Check the activity chat.");
  };

  return (
    <div className="p-6 text-white min-h-screen">
      <h1 className="text-3xl font-black mb-6 text-blue-400">Club Activities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activities.map((act) => (
          <div key={act.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {act.club_name}
              </span>
              <div className="flex items-center gap-2 text-pink-500 text-sm">
                <Clock size={16} /> <span>1h Left</span>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">{act.event_title}</h2>
            <p className="text-slate-400 text-sm mb-6">{act.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Users size={16} /> <span>{act.volunteer_list?.length || 0} Tracking</span>
              </div>
              <button 
                onClick={() => handleVolunteer(act.id)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                Volunteer Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClubHub;