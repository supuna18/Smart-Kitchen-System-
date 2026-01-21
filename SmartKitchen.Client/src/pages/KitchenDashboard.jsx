import { useState, useEffect } from 'react';
import { ChefHat, Clock, PlayCircle, CheckCircle, Trash2, Wifi, WifiOff, AlertTriangle, Flame } from 'lucide-react';

export default function KitchenDashboard({ orders, connectionStatus, updateStatus, clearHistory }) {
  // මේකෙන් තමයි තත්පරෙන් තත්පරේ Screen එක Update කරන්නේ
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- SE ALGORITHM: Priority Calculation ---
  // Order එක දාලා කොච්චර වෙලාද කියලා බලලා, බර (Weight) එකක් දෙනවා.
  const getOrderPriority = (orderTimeStr) => {
    // String Time එක Date Object එකක් කරනවා (Note: මේක Demo එකක් නිසා අද දවස ගන්නවා)
    const orderTime = new Date();
    const [hours, minutes] = orderTimeStr.match(/(\d+):(\d+)/).slice(1);
    const isPM = orderTimeStr.includes('PM');
    orderTime.setHours(parseInt(hours) + (isPM && hours !== '12' ? 12 : 0), parseInt(minutes), 0);
    
    // දැනට ගත වුන කාලය (විනාඩි වලින්)
    const elapsedMinutes = (now - orderTime) / 60000;
    
    if (elapsedMinutes > 10) return { level: 'CRITICAL', color: '#ef4444', score: 3 }; // විනාඩි 10 පැන්නොත්
    if (elapsedMinutes > 5) return { level: 'WARNING', color: '#f59e0b', score: 2 };   // විනාඩි 5 පැන්නොත්
    return { level: 'NORMAL', color: '#10b981', score: 1 };                             // අලුත් ඒවා
  };

  // Orders ෆිල්ටර් කරලා Priority අනුව Sort කරනවා (Deep Logic)
  const sortedOrders = orders
    .filter(o => o.status !== 'ready')
    .map(order => ({ ...order, priority: getOrderPriority(order.time) }))
    .sort((a, b) => b.priority.score - a.priority.score); // Critical ඒවා උඩට

  const completed = orders.filter(o => o.status === 'ready');

  const ConnectionBadge = () => (
    <div className={`conn-badge ${connectionStatus}`}>
      {connectionStatus === 'connected' ? <><Wifi size={14}/> Online</> : <><WifiOff size={14}/> Offline</>}
    </div>
  );

  return (
    <div className="kitchen-container">
      <header className="kitchen-header">
        <div className="brand-section">
          <div className="logo-wrapper">
            <ChefHat size={32} color="#1a1f2e" />
          </div>
          <div>
            <h1>Dino Foods</h1>
            <div className="meta-info">
              <span>SLA Monitoring Active</span>
              <span className="dot">•</span>
              <ConnectionBadge />
            </div>
          </div>
        </div>
        
        <div className="k-stats">
          <div className="stat-card">
            <span className="label">Queue Load</span>
            <span className="value">{sortedOrders.length}</span>
          </div>
          <div className="stat-card">
            <span className="label">Completed</span>
            <span className="value success">{completed.length}</span>
          </div>
          <button className="btn-icon" onClick={() => { if(confirm("Clear?")) clearHistory() }}>
            <Trash2 size={20}/>
          </button>
        </div>
      </header>

      <div className="orders-grid">
        {sortedOrders.map((order) => (
          <div key={order.id} className={`kitchen-card priority-${order.priority.level.toLowerCase()} status-${order.status}`}>
            
            {/* Critical ඒවාට විශේෂ Alert එකක් */}
            {order.priority.level === 'CRITICAL' && (
              <div className="critical-banner">
                <AlertTriangle size={14} /> SLA BREACHED - RUSH ORDER
              </div>
            )}

            <div className="card-header">
              <span className="order-id">#{order.id.substring(0, 4)}</span>
              <div className="timer-badge">
                <Clock size={14}/> 
                {/* ගත වූ කාලය ගණනය කිරීම */}
                {Math.floor((now - new Date().setHours(
                    parseInt(order.time.split(':')[0]) + (order.time.includes('PM') && order.time.split(':')[0] !== '12' ? 12 : 0),
                    parseInt(order.time.split(':')[1])
                )) / 60000)} min ago
              </div>
            </div>

            <div className="card-body">
              <div className="table-badge">Table {order.table}</div>
              <h2 className="food-title">{order.food}</h2>
            </div>

            <div className="card-footer">
              {order.status === 'pending' && (
                <button className="btn-action start" onClick={() => updateStatus(order.id, 'cooking')}>
                  <PlayCircle size={18}/> Start Prep
                </button>
              )}
              {order.status === 'cooking' && (
                <button className="btn-action cooking" onClick={() => updateStatus(order.id, 'ready')}>
                  <Flame size={18} className="pulse-icon"/> Cooking...
                </button>
              )}
            </div>
          </div>
        ))}
        {sortedOrders.length === 0 && (
          <div className="empty-state-kds">
            <CheckCircle size={48} opacity={0.2}/>
            <p>All caught up! No pending orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}