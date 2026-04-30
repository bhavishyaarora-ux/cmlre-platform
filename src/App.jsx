import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import axios from 'axios';
import { Activity, Droplets, Map as MapIcon, Menu, Search, Fish, Dna, Camera, Upload, ScanLine } from 'lucide-react';

const STATIONS = [
  { id: '9414290', name: 'San Francisco, CA', lat: 37.806, lng: -122.465 },
  { id: '8454000', name: 'Providence, RI', lat: 41.807, lng: -71.401 },
  { id: '8518750', name: 'The Battery, NY', lat: 40.700, lng: -74.014 },
  { id: '8724580', name: 'Key West, FL', lat: 24.555, lng: -81.808 }
];

const customMarker = divIcon({
  className: 'bg-cyan-400 rounded-full border-2 border-white shadow-lg w-4 h-4',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [stationData, setStationData] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);

  const [speciesData, setSpeciesData] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);

  // NEW STATE: For the AI Lab Tab
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const imageRef = useRef(null);

  // Map Data Fetch
  useEffect(() => {
    const fetchNOAAData = async () => {
      try {
        const promises = STATIONS.map(async (station) => {
          const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=${station.id}&product=water_temperature&datum=STND&time_zone=gmt&units=metric&application=CMLRE_Project&format=json`;
          const response = await axios.get(url);
          const temp = response.data?.data?.[0]?.v || 'Data Unavailable';
          return { ...station, temperature: temp };
        });
        const results = await Promise.all(promises);
        setStationData(results);
        setLoadingMap(false);
      } catch (error) {
        console.error("Error fetching NOAA data:", error);
        setLoadingMap(false);
      }
    };
    fetchNOAAData();
  }, []);

  // Taxonomy Fetch
  useEffect(() => {
    const fetchTaxonomy = async () => {
      if (activeTab === 'taxonomy' && speciesData.length === 0) {
        setLoadingTaxonomy(true);
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/species`);
          setSpeciesData(response.data);
        } catch (error) {
          console.error("Error fetching taxonomy from backend:", error);
        } finally {
          setLoadingTaxonomy(false);
        }
      }
    };
    fetchTaxonomy();
  }, [activeTab, speciesData.length]);

  // Ledger Fetch
  useEffect(() => {
    if (activeTab === 'taxonomy') {
      axios.get(`${import.meta.env.VITE_API_URL}/api/edna`)
        .then(res => setLedgerData(res.data))
        .catch(err => console.error(err));
    }
  }, [activeTab]);

  // Database Save
  const handleQuery = async () => {
    if (!searchQuery) return alert("Please enter a sequence first.");
    setIsSearching(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/edna/analyze`, { sequence: searchQuery });
      setLedgerData([response.data.record, ...ledgerData]);
      setSearchQuery('');
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  // NEW FUNCTION: Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      setScanResults(null); // Reset previous results
    }
  };

  // NEW FUNCTION: Simulate AI Scan
  const runAIScan = () => {
    if (!uploadedImage) return;
    setIsScanning(true);

    // Simulate a 2.5 second AI processing delay
    setTimeout(() => {
      setIsScanning(false);
      setScanResults({
        species: "Sardinella longiceps (Predicted)",
        confidence: "94.2%",
        length: "14.2 cm",
        ageEstimate: "1.5 Years (Otolith Morphometrics)",
        health: "Normal"
      });
    }, 2500);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">

      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-10">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <Droplets className="text-cyan-400" />
          <h1 className="text-xl font-bold tracking-wider">CMLRE <span className="text-cyan-400">Hub</span></h1>
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            <li onClick={() => setActiveTab('map')} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${activeTab === 'map' ? 'bg-slate-700 text-cyan-400 shadow-md' : 'hover:bg-slate-700/50'}`}>
              <MapIcon size={20} /> Real-Time Map
            </li>
            <li onClick={() => setActiveTab('taxonomy')} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${activeTab === 'taxonomy' ? 'bg-slate-700 text-cyan-400 shadow-md' : 'hover:bg-slate-700/50'}`}>
              <Activity size={20} /> Taxonomy Lab
            </li>
            {/* NEW TAB BUTTON */}
            <li onClick={() => setActiveTab('lab')} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${activeTab === 'lab' ? 'bg-slate-700 text-cyan-400 shadow-md' : 'hover:bg-slate-700/50'}`}>
              <Camera size={20} /> Image AI Lab
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-0">
        <header className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8 z-10">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'map' ? 'Live Oceanographic Telemetry' : activeTab === 'taxonomy' ? 'Marine Species Database' : 'Computer Vision & Otolith Lab'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <span className={`w-2 h-2 rounded-full ${activeTab === 'lab' ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`}></span>
              {activeTab === 'lab' ? 'YOLOv8 Model Active' : 'Database Connected'}
            </span>
            <Menu className="cursor-pointer text-slate-400 hover:text-white" />
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">

          {/* MAP VIEW */}
          {activeTab === 'map' && (
            <div className="p-8 grid grid-cols-3 gap-8 h-full">
              <div className="col-span-1 space-y-6 overflow-y-auto pr-4">
                {/* Station Data Code... */}
                {loadingMap ? <p>Loading...</p> : stationData.map((s, i) => <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg"><h4 className="font-bold">{s.name}</h4><div className="mt-4"><span className="text-slate-400 text-sm">Water Temp:</span> <span className="text-2xl text-cyan-400">{s.temperature}°C</span></div></div>)}
              </div>
              <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative z-0">
                <MapContainer center={[39.0, -98.0]} zoom={4} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  {stationData.map((s, i) => <Marker key={i} position={[s.lat, s.lng]} icon={customMarker}><Popup>{s.name}</Popup></Marker>)}
                </MapContainer>
              </div>
            </div>
          )}

          {/* TAXONOMY VIEW (Code omitted for brevity in response, it remains the same as before) */}
          {/* TAXONOMY LAB VIEW */}
          {activeTab === 'taxonomy' && (
            <div className="p-8 h-full overflow-y-auto">

              {/* Search Bar UI */}
              <div className="mb-8 flex gap-4">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center px-4 py-3 shadow-sm focus-within:border-cyan-500 transition">
                  <Search className="text-slate-400 mr-3" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by scientific name or input eDNA FASTA sequence..."
                    className="bg-transparent border-none outline-none w-full text-slate-200 placeholder-slate-500 font-mono text-sm"
                  />
                </div>
                <button
                  onClick={handleQuery}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
                >
                  {isSearching ? <span className="animate-pulse">Analyzing...</span> : <>Query Database</>}
                </button>
              </div>

              {/* Species Cards */}
              {loadingTaxonomy ? (
                <div className="text-center text-slate-400 mt-20 animate-pulse">Fetching records from CMLRE servers...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                  {speciesData.map((species) => (
                    <div key={species.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-cyan-500 transition shadow-lg group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-cyan-900/30 transition">
                          <Fish className="text-cyan-400" size={28} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${species.status === 'Vulnerable' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            species.status === 'Least Concern' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                          {species.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold italic text-slate-200">{species.name}</h3>
                      <p className="text-slate-400 mb-4">{species.commonName}</p>
                      <div className="pt-4 border-t border-slate-700 flex justify-between text-sm">
                        <span className="text-slate-500">Known Depth Range:</span>
                        <span className="text-cyan-300 font-mono">{species.depth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Digital eDNA Ledger Table */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg mt-8">
                <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Dna className="text-emerald-400" size={24} />
                    <h3 className="text-lg font-bold text-slate-200">Digital eDNA Ledger</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-md border border-slate-700">Live Database</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium border-b border-slate-700">Sequence ID</th>
                        <th className="p-4 font-medium border-b border-slate-700">Sample Location</th>
                        <th className="p-4 font-medium border-b border-slate-700">Matched Taxonomy</th>
                        <th className="p-4 font-medium border-b border-slate-700">AI Confidence</th>
                        <th className="p-4 font-medium border-b border-slate-700">Date Logged</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {ledgerData.map((record, index) => (
                        <tr key={index} className="hover:bg-slate-700/30 transition border-b border-slate-700/50 last:border-0">
                          <td className="p-4 font-mono text-cyan-400">{record.sequenceId}</td>
                          <td className="p-4 text-slate-300">{record.sampleLoc}</td>
                          <td className="p-4 italic font-medium text-slate-200">{record.match}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${parseFloat(record.confidence) > 90 ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                              {record.confidence}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-mono">{new Date(record.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Show this if the database is completely empty */}
                  {ledgerData.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic">
                      No sequences have been logged to the database yet. Try querying a sequence!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* NEW: IMAGE AI LAB VIEW */}
          {activeTab === 'lab' && (
            <div className="p-8 h-full flex gap-8">

              {/* Left Column: Uploader & Image View */}
              <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2"><ScanLine className="text-purple-400" /> Specimen Scanner</h3>
                  <label className="bg-slate-700 hover:bg-slate-600 cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                    <Upload size={16} /> Upload Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="flex-1 bg-slate-900 rounded-lg border-2 border-dashed border-slate-700 relative flex items-center justify-center overflow-hidden">
                  {!uploadedImage ? (
                    <div className="text-slate-500 text-center">
                      <Camera size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Select a fish specimen or otolith image to begin.</p>
                    </div>
                  ) : (
                    <>
                      <img ref={imageRef} src={uploadedImage} alt="Uploaded specimen" className="max-h-full max-w-full object-contain" />

                      {/* Simulated AI Scanning Overlay */}
                      {isScanning && (
                        <div className="absolute inset-0 bg-cyan-900/20">
                          <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-cyan-400 rounded-lg bg-cyan-400/10 flex items-end p-2">
                            <span className="bg-cyan-400 text-slate-900 text-xs font-bold px-1 rounded animate-pulse">Analyzing...</span>
                          </div>
                        </div>
                      )}

                      {/* Simulated AI Result Box */}
                      {scanResults && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-emerald-400 rounded-lg bg-emerald-400/10 flex items-end p-2">
                          <span className="bg-emerald-400 text-slate-900 text-xs font-bold px-1 rounded">{scanResults.confidence} Match</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={runAIScan}
                  disabled={!uploadedImage || isScanning}
                  className={`mt-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${!uploadedImage || isScanning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'}`}
                >
                  {isScanning ? 'Processing via YOLOv8 Model...' : 'Run Computer Vision Analysis'}
                </button>
              </div>

              {/* Right Column: Morphometric Data */}
              <div className="w-96 space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg h-full">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-4 mb-4">Morphometric Results</h3>

                  {!scanResults ? (
                    <p className="text-slate-500 text-sm italic">Upload an image and run the scanner to generate morphological parameters and otolith age estimates.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Detected Species</span>
                        <span className="text-emerald-400 font-bold italic">{scanResults.species}</span>
                      </div>

                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Standard Length (SL)</span>
                        <span className="text-slate-200 font-mono">{scanResults.length}</span>
                      </div>

                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Growth / Age Estimate</span>
                        <span className="text-purple-400 font-mono">{scanResults.ageEstimate}</span>
                      </div>

                      <button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm text-cyan-300 border border-slate-600 transition">
                        Save to Database
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}