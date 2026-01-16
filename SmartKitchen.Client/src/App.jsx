import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { 
  ChefHat, Utensils, Clock, Send, CheckCircle, 
  PlayCircle, Timer, AlertCircle, Smartphone 
} from 'lucide-react'; // අලුත් Icons
import './App.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [connection, setConnection] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [foodItem, setFoodItem] = useState("");

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
              id: orderId, table, food, status: 'pending', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
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

  // --- KITCHEN DASHBOARD (DARK MODE) ---
  if (isKitchen) {
    const activeOrders = orders.filter(o => o.status !== 'ready');
    const completedOrders = orders.filter(o => o.status === 'ready');

    return (
      <div className="kitchen-container">
        <div className="kitchen-header">
          <div className="header-left">
            <ChefHat size={32} color="#ffcc00" />
            <h1>Kitchen Display System</h1>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span>Pending</span>
              <strong>{activeOrders.length}</strong>
            </div>
            <div className="stat-box completed">
              <span>Completed</span>
              <strong>{completedOrders.length}</strong>
            </div>
          </div>
        </div>
        
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className={`kitchen-card status-${order.status}`}>
              <div className="card-top">
                <span className="order-id">#{order.id.substring(0, 4)}</span>
                <span className="order-time"><Clock size={14}/> {order.time}</span>
              </div>
              
              <div className="card-content">
                <div className="table-badge">Table {order.table}</div>
                <h3 className="food-name">{order.food}</h3>
              </div>
              
              <div className="card-actions">
                {order.status === 'pending' && (
                  <button className="btn-action btn-start" onClick={() => updateStatus(order.id, 'cooking')}>
                    <PlayCircle size={18} /> Start Cooking
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button className="btn-action btn-finish" onClick={() => updateStatus(order.id, 'ready')}>
                    <CheckCircle size={18} /> Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                   <div className="status-done"><CheckCircle size={20}/> SERVED</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- WAITER APP (MODERN MOBILE UI) ---
  return (
    <div className="waiter-container">
      <div className="mobile-app">
        <header className="app-header">
          <div className="brand">
            <Utensils color="#ff4500" />
            <span>QuickBite POS</span>
          </div>
          <div className="user-icon"><Smartphone size={20}/></div>
        </header>

        <div className="input-section">
          <h2>New Order</h2>
          <div className="form-group">
            <label>Table Number</label>
            <input type="number" value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="e.g. 5" />
          </div>
          <div className="form-group">
            <label>Food Item</label>
            <input type="text" value={foodItem} onChange={e => setFoodItem(e.target.value)} placeholder="e.g. Pizza" />
          </div>
          <button className="btn-send" onClick={sendOrder}>
            <Send size={18} /> Send to Kitchen
          </button>
        </div>

        <div className="live-status-section">
          <h3><AlertCircle size={16}/> Live Status</h3>
          <div className="status-list">
            {[...orders].reverse().map(order => (
              <div key={order.id} className={`status-item s-${order.status}`}>
                <div className="item-info">
                  <span className="t-num">T-{order.table}</span>
                  <span className="f-name">{order.food}</span>
                </div>
                <div className="item-status">
                  {order.status === 'pending' && <span className="pill p-pending"><Timer size={12}/> Pending</span>}
                  {order.status === 'cooking' && <span className="pill p-cooking"><ChefHat size={12}/> Cooking</span>}
                  {order.status === 'ready' && <span className="pill p-ready"><CheckCircle size={12}/> Ready</span>}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="empty-state">No active orders</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;