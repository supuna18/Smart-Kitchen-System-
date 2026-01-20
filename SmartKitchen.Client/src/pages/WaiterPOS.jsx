import { useState } from 'react';  //Import the use state hook from react library 
import { Utensils, LayoutDashboard, Send, TrendingUp, PlayCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';     //import chart components from recharts library

export default function WaiterPOS({ orders, connectionStatus, sendOrder, chartData, clearHistory }) {
  const [tableNo, setTableNo] = useState("");       //use state hook to manage table number input
  const [foodItem, setFoodItem] = useState(""); //use state hook to manage food item input

  const handleSend = async () => {
    if (tableNo && foodItem) {
      try {
        await sendOrder(tableNo, foodItem);
        setTableNo(""); setFoodItem("");
      } catch (err) { alert("System Offline!"); }
    }
  };

  const ConnectionBadge = () => (
    <div className={`conn-badge ${connectionStatus}`}>
      {connectionStatus === 'connected' && <><Wifi size={14}/> Online</>}
      {connectionStatus !== 'connected' && <><WifiOff size={14}/> Offline</>}
    </div>
  );

  return (
    <div className="waiter-layout">
      <div className="waiter-sidebar">
        <div className="w-brand">
          <Utensils size={32} color="#d4af37" />
          <h1>DINO <br/><span>POS</span></h1>
        </div>
        <div className="w-menu">
          <button className="active"><LayoutDashboard size={20}/> Dashboard</button>
          <div style={{marginTop:'auto', padding:10}}><ConnectionBadge /></div>
        </div>
      </div>

      <div className="waiter-main">
        {connectionStatus === 'disconnected' && <div className="offline-banner">⚠️ You are OFFLINE</div>}

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
            <button className="btn-submit" onClick={handleSend} disabled={connectionStatus !== 'connected'}>
              {connectionStatus === 'connected' ? 'Send to Kitchen' : 'Connecting...'}
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
                    {chartData.map((entry, index) => <Cell key={index} fill={index % 2 === 0 ? '#d4af37' : '#1a1f2e'} />)}
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
              <thead><tr><th>ID</th><th>Table</th><th>Item</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {[...orders].reverse().map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.substring(0,4)}</td><td><b>T-{order.table}</b></td><td>{order.food}</td><td>{order.time}</td>
                    <td><span className={`status-pill ${order.status}`}>{order.status}</span></td>
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