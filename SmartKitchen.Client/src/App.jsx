import './App.css';
import { useKitchenSystem } from './hooks/useKitchenSystem';
import KitchenDashboard from './pages/KitchenDashboard';
import WaiterPOS from './pages/WaiterPOS';

function App() {
  // 1. URL එකෙන් View එක හොයාගන්නවා
  const isKitchen = new URLSearchParams(window.location.search).get('view') === 'kitchen';

  // 2. අපේ Custom Hook එකෙන් Logic ඔක්කොම එලියට ගන්නවා
  const { 
    orders, 
    connectionStatus, 
    sendOrder, 
    updateStatus, 
    clearHistory, 
    chartData 
  } = useKitchenSystem(isKitchen);

  // 3. අදාල Page එක පෙන්නනවා (Logic මුකුත් මෙතන නෑ, පාස් කරනවා විතරයි)
  if (isKitchen) {
    return (
      <KitchenDashboard 
        orders={orders} 
        connectionStatus={connectionStatus} 
        updateStatus={updateStatus} 
        clearHistory={clearHistory}
      />
    );
  }

  return (
    <WaiterPOS 
      orders={orders} 
      connectionStatus={connectionStatus} 
      sendOrder={sendOrder} 
      chartData={chartData}
      clearHistory={clearHistory}
    />
  );
}

export default App;