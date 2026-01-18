import { ChefHat, Clock, PlayCircle, CheckCircle, Trash2, Wifi, WifiOff, Volume2 } from 'lucide-react';

export default function KitchenDashboard({ orders, connectionStatus, updateStatus, clearHistory }) {
  const activeOrders = orders.filter(o => o.status !== 'ready');
  const completed = orders.filter(o => o.status === 'ready');

  const ConnectionBadge = () => (
    <div className={`conn-badge ${connectionStatus}`}>
      {connectionStatus === 'connected' && <><Wifi size={14}/> Online</>}
      {connectionStatus !== 'connected' && <><WifiOff size={14}/> Offline</>}
    </div>
  );

  return (
    <div className="kitchen-container">
      <header className="kitchen-header">
        <div className="brand-section">
          <ChefHat size={40} className="gold-icon" />
          <div>
            <h1>MASTER CHEF KDS</h1>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <span style={{fontSize:12, color:'#888'}}>Live Kitchen Operations</span>
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
          <button className="btn-clear" onClick={() => { if(confirm("Clear?")) clearHistory() }}>
            <Trash2 size={18}/>
          </button>
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
        {orders.length === 0 && <div className="empty-state">No active orders</div>}
      </div>
    </div>
  );
}