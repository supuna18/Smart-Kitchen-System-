import { useEffect, useState, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import { 
  ChefHat, Utensils, Clock, Send, CheckCircle, 
  PlayCircle, Activity, TrendingUp, Smartphone, LayoutDashboard 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './App.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [connection, setConnection] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [foodItem, setFoodItem] = useState("");

  // URL Query: ?view=kitchen
  const isKitchen = new URLSearchParams(window.location.search).get('view') === 'kitchen';
  const BACKEND_URL = "http://localhost:5215/orderHub"; 

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(BACKEND_URL)
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log("Connected!");
          connection.on("ReceiveOrder", (orderId, table, food) => {
            const newOrder = { 
              id: orderId, table, food, status: 'pending', 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date() // Chart sorting වලට
            };
            setOrders(prev => [...prev, newOrder]);
          });
          connection.on("ReceiveStatusUpdate", (orderId, status) => {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
          });
        })
        .catch(e => console.log("Failed: ", e));
    }
  }, [connection]);

  const sendOrder = async () => {
    if (connection && tableNo && foodItem) {
      const orderId = generateId();
      await connection.invoke("SendOrderToKitchen", orderId, tableNo, foodItem);
      setTableNo(""); setFoodItem("");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    if (connection) await connection.invoke("UpdateOrderStatus", orderId, newStatus);
  };

  // --- ANALYTICS LOGIC (Chart Data හදන තැන) ---
  const chartData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      counts[o.food] = (counts[o.food] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key]
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 Items
  }, [orders]);

  // ==========================================
  // VIEW 1: KITCHEN DISPLAY SYSTEM (Premium Dark)
  // ==========================================
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
              <p>Live Kitchen Operations</p>
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
                    <PlayCircle size={18}/> Start
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

  // ==========================================
  // VIEW 2: WAITER POS & ANALYTICS (Professional Light)
  // ==========================================
  return (
    <div className="waiter-layout">
      {/* SIDEBAR / HEADER (Responsive) */}
      <div className="waiter-sidebar">
        <div className="w-brand">
          <Utensils size={32} color="#d4af37" />
          <h1>DINO <br/><span>POS</span></h1>
        </div>
        <div className="w-menu">
          <button className="active"><LayoutDashboard size={20}/> Dashboard</button>
          <button><Activity size={20}/> History</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="waiter-main">
        
        {/* SECTION 1: TOP STATS & INPUT */}
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
            <button className="btn-submit" onClick={sendOrder}>Send to Kitchen</button>
          </div>

          {/* NEW: LIVE CHART (Innovative Part) */}
          <div className="analytics-panel">
            <h2><TrendingUp size={20}/> Top Selling Items</h2>
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
            {chartData.length === 0 && <p className="no-data">No sales data yet</p>}
          </div>
        </div>

        {/* SECTION 2: RECENT ORDERS */}
        <div className="recent-orders-section">
          <h3>Recent Activity</h3>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
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
                        {order.status === 'cooking' && <PlayCircle size={10}/>}
                        {order.status === 'ready' && <CheckCircle size={10}/>}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="empty-state">Ready for orders...</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;