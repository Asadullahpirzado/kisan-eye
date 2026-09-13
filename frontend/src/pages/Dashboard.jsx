import { useEffect, useState } from "react";
import { getDashboard, fileUrl } from "../api.js";
import StatCard from "../components/StatCard.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons not showing in React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 text-forest/50">Loading your farm overview...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest">Farm overview</h1>
          <p className="text-forest/60">A quick look at everything KISAN EYE has checked so far.</p>
        </div>
        <button
          onClick={() => onNavigate("analyze")}
          className="rounded-full bg-forest text-canvas px-6 py-3 font-semibold hover:bg-leaf transition-colors"
        >
          Analyze a crop
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Crop analyses" value={data.total} />
        <StatCard label="Healthy" value={data.healthy} accent="text-leaf" />
        <StatCard label="Needs monitoring" value={data.monitoring} accent="text-amber" />
        <StatCard label="High risk" value={data.high_risk} accent="text-danger" />
      </div>

      <div className="mb-10 rounded-2xl overflow-hidden border border-forest/10 shadow-sm relative z-0">
        <div className="bg-forest text-white px-5 py-3 flex justify-between items-center">
          <h2 className="font-semibold">Disease Radar Map</h2>
          <span className="text-xs bg-danger px-2 py-1 rounded-full animate-pulse">LIVE TRACKING</span>
        </div>
        <div style={{ height: "400px", width: "100%" }}>
          <MapContainer center={[23.0, 79.0]} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {data.recent_cases.map(item => item.lat && item.lng && (
              <Circle 
                key={item.id} 
                center={[item.lat, item.lng]} 
                radius={20000} 
                pathOptions={{ color: item.risk_level === 'HIGH' ? 'red' : item.risk_level === 'MEDIUM' ? 'orange' : 'green', fillColor: item.risk_level === 'HIGH' ? 'red' : item.risk_level === 'MEDIUM' ? 'orange' : 'green' }}
              >
                <Popup>
                  <strong>{item.crop}</strong><br/>
                  {item.prediction}<br/>
                  Risk: {item.risk_level}
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-forest mb-4">My crops</h2>
          {data.crops.length === 0 && (
            <p className="text-sm text-forest/50">Nothing tracked yet. Analyze a crop to get started.</p>
          )}
          <div className="space-y-3">
            {data.crops.map((crop) => (
              <div key={crop.crop} className="rounded-2xl bg-white border border-forest/10 p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-forest capitalize">{crop.crop}</p>
                  <p className="text-sm text-forest/50">
                    {crop.case_count} case{crop.case_count === 1 ? "" : "s"} · last: {crop.latest_prediction}
                  </p>
                </div>
                <RiskBadge level={crop.latest_risk} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-forest mb-4">Recent analyses</h2>
          <div className="space-y-3">
            {data.recent_cases.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white border border-forest/10 p-3 flex items-center gap-3">
                <img src={fileUrl(item.image_path)} className="h-12 w-12 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest capitalize truncate">
                    {item.crop} · {item.prediction}
                  </p>
                  <p className="text-xs text-forest/50">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <RiskBadge level={item.risk_level} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
