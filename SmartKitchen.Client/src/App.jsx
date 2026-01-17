import { useEffect, useState, useMemo, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { 
  ChefHat, Utensils, Clock, Send, CheckCircle, 
  PlayCircle, TrendingUp, Smartphone, LayoutDashboard, 
  Wifi, WifiOff, Volume2 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './App.css';

// සද්දයක් දාන්න පොඩි MP3 ලින්ක් එකක්
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // Connected, Reconnecting, Disconnected
  
  // Initial State එක LocalStorage එකෙන් ගන්නවා (Refresh කළාට මැකෙන්නේ නෑ)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("kds_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNo, setTableNo] = useState("");
  const [foodItem, setFoodItem] = useState("");

  const isKitchen = new URLSearchParams(window.location.search).get('view') === 'kitchen';
  const BACKEND_URL = "http://localhost:5215/orderHub"; 
  
  // Audio Player එක Reference එකක් විදියට
  const audioPlayer = useRef(new Audio(NOTIFICATION_SOUND));

  // --- 2. DATA PERSISTENCE (LocalStorage Sync) ---
  // Orders වෙනස් වෙන හැම වෙලාවෙම LocalStorage එකට Save කරනවා
  useEffect(() => {
    localStorage.setItem("kds_orders", JSON.stringify(orders));
  }, [orders]);

  // --- 3. CONNECTION LOGIC (Resiliency) ---
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(BACKEND_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // කැඩුනොත් තත්පර 0, 2, 5, 10 කින් ආයේ try කරනවා
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log("Connected!");
          setConnectionStatus("connected");

          connection.on("ReceiveOrder", (orderId, table, food) => {
            const newOrder = { 
              id: orderId, table, food, status: 'pending', 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            
            setOrders(prev => [...prev, newOrder]);
            
            // කුස්සියට විතරක් සද්දේ ඇහෙන්න ඕන
            if (isKitchen) {
              audioPlayer.current.play().catch(e => console.log("Audio blocked:", e));
            }
          });

          connection.on("ReceiveStatusUpdate", (orderId, status) => {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
          });
        })
        .catch(e => {
          console.log("Failed: ", e);
          setConnectionStatus("error");
        });

      // Connection කැඩුනම අල්ලගන්න Events (Engineering Deep Dive)
      connection.onreconnecting(() => setConnectionStatus("reconnecting"));
      connection.onreconnected(() => setConnectionStatus("connected"));
      connection.onclose(() => setConnectionStatus("disconnected"));
    }
  }, [connection, isKitchen]);

  const sendOrder = async () => {
    if (connectionStatus === "connected" && tableNo && foodItem) {
      const orderId = generateId();
      try {
        await connection.invoke("SendOrderToKitchen", orderId, tableNo, foodItem);
        setTableNo(""); setFoodItem("");
      } catch (err) {
        alert("Failed to send order. Check internet!");
      }
    } else {
      alert("System Offline! Please wait.");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    if (connectionStatus === "connected") await connection.invoke("UpdateOrderStatus", orderId, newStatus);
  };

  const clearHistory = () => {
    if(confirm("Clear all order history?")) {
      setOrders([]);
      localStorage.removeItem("kds_orders");
    }
  }

  // --- ANALYTICS ---
  const chartData = useMemo(() => {
    const counts = {};
    orders.forEach(o => { counts[o.food] = (counts[o.food] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  // --- CONNECTION STATUS BADGE ---
  const ConnectionBadge = () => (
    <div className={`conn-badge ${connectionStatus}`}>
      {connectionStatus === 'connected' && <><Wifi size={14}/> Online</>}
      {connectionStatus === 'reconnecting' && <><WifiOff size={14}/> Reconnecting...</>}
      {connectionStatus === 'disconnected' && <><WifiOff size={14}/> Offline</>}
    </div>
  );

  // ================= KITCHEN VIEW =================
  if (isKitchen) {
    const activeOrders = orders.filter(o => o.status !== 'ready');
    const completed = orders.filter(o => o.status === 'ready');

    return (
      <div className="kitchen-container">
        <header className="kitchen-header">
          <div className="brand-section">
            <ChefHat size={40} className="gold-icon" />
            <div>
              <h1>MASTER CHEF KDS</h1>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <p>Live Operations</p>
                <ConnectionBadge />
              </div>
            </div>
          </div>
          <div className="k-stats">
            <div className="stat-card">
              <span className="label">Pending</span>
              <span className="value gold">{activeOrders.length}</span>
            </div>
            <div className="stat-card">
              <span className="label">Completed</span>
              <span className="value green">{completed.length}</span>
            </div>
            <button className="btn-clear" onClick={clearHistory}>Clear All</button>
          </div>
        </header>

        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className={`kitchen-card status-${order.status}`}>
              <div className="card-header">
                <span className="order-id">#{order.id.substring(0, 4)}</span>
                <span className="order-time"><Clock size={14}/> {order.time}</span>
              </div>
              <div className="card-body">
                <div className="table-tag">Table {order.table}</div>
                <h2 className="food-title">{order.food}</h2>
              </div>
              <div className="card-footer">
                {order.status === 'pending' && (
                  <button className="btn-action start" onClick={() => updateStatus(order.id, 'cooking')}>
                    <PlayCircle size={18}/> Start <Volume2 size={14} style={{marginLeft:5, opacity:0.7}}/>
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button className="btn-action ready" onClick={() => updateStatus(order.id, 'ready')}>
                    <CheckCircle size={18}/> Ready
                  </button>
                )}
                {order.status === 'ready' && <div className="served-badge">SERVED</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= WAITER VIEW =================
  return (
    <div className="waiter-layout">
      <div className="waiter-sidebar">
        <div className="w-brand">
          <Utensils size={32} color="#d4af37" />
          <h1>DINO <br/><span>POS</span></h1>
        </div>
        <div className="w-menu">
          <button className="active"><LayoutDashboard size={20}/> Dashboard</button>
          <div style={{marginTop: 'auto', padding: 10}}>
            <ConnectionBadge />
          </div>
        </div>
      </div>

      <div className="waiter-main">
        <div className="dashboard-top">
          <div className="input-panel">
            <h2><Send size={20}/> New Order</h2>
            <div className="input-row">
              <div className="input-wrapper">
                <label>Table No</label>
                <input type="number" value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="05" />
              </div>
              <div className="input-wrapper">
                <label>Item Name</label>
                <input type="text" value={foodItem} onChange={e => setFoodItem(e.target.value)} placeholder="Pizza" />
              </div>
            </div>
            <button className="btn-submit" onClick={sendOrder} disabled={connectionStatus !== 'connected'}>
              {connectionStatus === 'connected' ? 'Send to Kitchen' : 'System Offline'}
            </button>
          </div>

          <div className="analytics-panel">
            <h2><TrendingUp size={20}/> Top Items</h2>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}}/>
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#d4af37' : '#1a1f2e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="recent-orders-section">
          <h3>Recent Activity</h3>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Table</th>
                  <th>Item</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].reverse().map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.substring(0,4)}</td>
                    <td><b>T-{order.table}</b></td>
                    <td>{order.food}</td>
                    <td>{order.time}</td>
                    <td>
                      <span className={`status-pill ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;