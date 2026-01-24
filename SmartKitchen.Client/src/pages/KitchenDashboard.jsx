import { useState } from 'react';
import { ChefHat, Clock, PlayCircle, CheckCircle, Trash2, Wifi, WifiOff, Filter, Activity, Flame } from 'lucide-react';

export default function KitchenDashboard({ orders, connectionStatus, updateStatus, clearHistory }) {
  const [filter, setFilter] = useState('all'); // all, pending, cooking, ready

  // --- STATISTICS CALCULATION ---
  const activeOrders = orders.filter(o => o.status !== 'ready');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const completed = orders.filter(o => o.status === 'ready');
  
  // Urgent Orders (විනාඩි 5ට වඩා පරණ ඒවා)
  const urgentCount = orders.filter(o => {
    if (o.status === 'ready') return false;
    const orderTime = new Date();
    // (Note: Demo logic to parse time)
    return false; // Real logic would go here
  }).length;

  // --- FILTERING LOGIC ---
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return order.status !== 'ready'; // Default: Hide completed
    if (filter === 'history') return order.status === 'ready';
    return order.status === filter;
  });

  const ConnectionBadge = () => (
    <div className={`conn-badge ${connectionStatus}`}>
      {connectionStatus === 'connected' ? <><Wifi size={14}/> Online</> : <><WifiOff size={14}/> Offline</>}
    </div>  
  );

  return (
    <div className="kitchen-container full-width-fix">
      {/* HEADER SECTION */}
      <header className="kitchen-header">
        <div className="brand-section">
          <div className="logo-wrapper">
            <ChefHat size={32} color="#1a1f2e" />
          </div>
          <div>
            <h1>Dino<span className="beta-tag"> Foods</span></h1>
            <div className="meta-info">
              <span>System Operational</span>
              <span className="dot">•</span>
              <ConnectionBadge />
            </div>
          </div>
        </div>
        
        {/* STATS DASHBOARD */}
        <div className="k-stats-group">
          <div className="stat-metric">
            <span className="label">Queue</span>
            <span className="value">{activeOrders.length}</span>
          </div>
          <div className="stat-metric warn">
            <span className="label">Cooking</span>
            <span className="value">{cookingOrders.length}</span>
          </div>
          <div className="stat-metric success">
            <span className="label">Done</span>
            <span className="value">{completed.length}</span>
          </div>
          <div className="divider"></div>
          <button className="btn-icon" onClick={() => { if(confirm("Clear All Data?")) clearHistory() }}>
            <Trash2 size={20}/>
          </button>
        </div>
      </header>

      {/* TOOLBAR (FILTERS) */}
      <div className="kitchen-toolbar">
        <div className="filter-tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <Activity size={16}/> Active Zone
          </button>
          <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            <Clock size={16}/> Pending
          </button>
          <button className={`tab ${filter === 'cooking' ? 'active' : ''}`} onClick={() => setFilter('cooking')}>
            <Flame size={16}/> Cooking
          </button>
          <button className={`tab ${filter === 'history' ? 'active' : ''}`} onClick={() => setFilter('history')}>
            <CheckCircle size={16}/> History
          </button>
        </div>
      </div>

      {/* ORDERS GRID */}
      <div className="orders-grid">
        {filteredOrders.map((order) => (
          <div key={order.id} className={`kitchen-card status-${order.status}`}>
            <div className="card-header">
              <span className="order-id">#{order.id.substring(0, 4)}</span>
              <span className="order-time"><Clock size={14}/> {order.time}</span>
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
                  <Flame size={18} className="pulse-icon"/> Finish
                </button>
              )}
              {order.status === 'ready' && <div className="served-badge">COMPLETED</div>}
            </div>
          </div>
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="empty-state-kds">
            <div className="empty-icon-bg"><CheckCircle size={48} /></div>
            <h3>No orders in this view</h3>
            <p>Waiting for new tickets...</p>
          </div>
        )}
      </div>
    </div>
  );
}