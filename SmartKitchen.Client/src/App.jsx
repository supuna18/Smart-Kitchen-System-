import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import './App.css';
// Unique ID එකක් හදාගන්න පොඩි trick එකක් (UUID library එක නැති නිසා)
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [connection, setConnection] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [foodItem, setFoodItem] = useState("");

  const isKitchen = new URLSearchParams(window.location.search).get('view') === 'kitchen';
  const BACKEND_URL = "http://localhost:5215/orderHub"; // Port එක හරිද බලන්න

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

          // 1. අලුත් Order එකක් ආවම
          connection.on("ReceiveOrder", (orderId, table, food) => {
            const newOrder = { 
              id: orderId, 
              table, 
              food, 
              status: 'pending', // මුලින්ම පෙන්ඩිං
              time: new Date().toLocaleTimeString() 
            };
            setOrders(prev => [...prev, newOrder]);
          });

          // 2. Status Update එකක් ආවම (Pending -> Cooking -> Ready)
          connection.on("ReceiveStatusUpdate", (orderId, status) => {
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId ? { ...order, status: status } : order
              )
            );
          });

        })
        .catch(e => console.log("Failed: ", e));
    }
  }, [connection]);

  // --- WAITER FUNCTIONS ---
  const sendOrder = async () => {
    if (connection && tableNo && foodItem) {
      const orderId = generateId(); // අලුත් ID එකක් හදනවා
      await connection.invoke("SendOrderToKitchen", orderId, tableNo, foodItem);
      setTableNo("");
      setFoodItem("");
    }
  };

  // --- KITCHEN FUNCTIONS ---
  const updateStatus = async (orderId, newStatus) => {
    if (connection) {
      await connection.invoke("UpdateOrderStatus", orderId, newStatus);
    }
  };

  // --- 1. KITCHEN UI (DASHBOARD) ---
  if (isKitchen) {
    return (
      <div className="kitchen-container">
        <div className="kitchen-header">
          <h2>🔥 Smart Kitchen Display</h2>
          <span>Live Orders: {orders.filter(o => o.status !== 'ready').length}</span>
        </div>
        
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className={`kitchen-card status-${order.status}`}>
              <div className="card-header">
                <span>#{order.id.substring(0,4)}</span>
                <span>{order.time}</span>
              </div>
              <div className="card-body">
                <h3>Table {order.table}</h3>
                <h4>{order.food}</h4>
              </div>
              
              {/* Status Buttons */}
              <div className="card-actions">
                {order.status === 'pending' && (
                  <button className="action-btn btn-cook" onClick={() => updateStatus(order.id, 'cooking')}>
                    👨‍🍳 Start Cooking
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button className="action-btn btn-ready" onClick={() => updateStatus(order.id, 'ready')}>
                    ✅ Ready to Serve
                  </button>
                )}
                {order.status === 'ready' && (
                   <div style={{color: '#00ff00', fontWeight: 'bold', textAlign: 'center', width: '100%'}}>
                     SERVED
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 2. WAITER UI (MOBILE PHONE) ---
  // --- 2. WAITER UI (MOBILE PHONE) ---
  return (
    <div className="waiter-container">
      <div className="mobile-frame">
        <div className="logo-area">
          <h1>🍔 QuickBite</h1>
          <p>Waiter Companion App</p>
        </div>
        
        {/* Input Form */}
        <div className="input-group">
          <label>Table Number</label>
          <input 
            className="custom-input"
            type="number" 
            placeholder="05" 
            value={tableNo}
            onChange={e => setTableNo(e.target.value)}
          />

          <label>Food Item</label>
          <input 
            className="custom-input"
            type="text" 
            placeholder="Chicken Kottu (L)" 
            value={foodItem}
            onChange={e => setFoodItem(e.target.value)}
          />
        </div>

        <button className="send-btn" onClick={sendOrder}>
          🚀 Send Order
        </button>

        {/* --- NEW: LIVE STATUS TRACKING --- */}
        <div className="waiter-orders-area">
          <h3>🕒 Recent Orders</h3>
          <div className="waiter-orders-list">
            {/* අලුත් ඒවා උඩට එන්න reverse කරනවා */}
            {[...orders].reverse().map((order) => (
              <div key={order.id} className={`waiter-order-card st-${order.status}`}>
                <div className="w-card-left">
                  <span className="w-table">T-{order.table}</span>
                  <span className="w-food">{order.food}</span>
                </div>
                <div className="w-card-right">
                  {/* Status එක අනුව Text එක මාරු වීම */}
                  {order.status === 'pending' && <span className="badge b-pending">⏳ Pending</span>}
                  {order.status === 'cooking' && <span className="badge b-cooking">🔥 Cooking</span>}
                  {order.status === 'ready' && <span className="badge b-ready">✅ READY!</span>}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="no-orders">No active orders yet.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}


export default App;