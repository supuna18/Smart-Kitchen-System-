import { useEffect, useState, useRef, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';

const BACKEND_URL = "http://localhost:5215/orderHub";
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useKitchenSystem = (isKitchenView) => {
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  
  // LocalStorage Logic
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("kds_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const audioPlayer = useRef(new Audio(NOTIFICATION_SOUND));

  // 1. Data Persistence
  useEffect(() => {
    localStorage.setItem("kds_orders", JSON.stringify(orders));
  }, [orders]);

  // 2. Offline Detection
  useEffect(() => {
    const handleOffline = () => setConnectionStatus("disconnected");
    const handleOnline = () => setConnectionStatus("reconnecting");
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 3. SignalR Connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(BACKEND_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
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
            
            // Audio Logic
            if (isKitchenView) {
              audioPlayer.current.play().catch(e => console.error("Audio blocked", e));
            }
          });

          connection.on("ReceiveStatusUpdate", (orderId, status) => {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
          });
        })
        .catch(() => setConnectionStatus("disconnected"));

      connection.onreconnecting(() => setConnectionStatus("reconnecting"));
      connection.onreconnected(() => setConnectionStatus("connected"));
      connection.onclose(() => setConnectionStatus("disconnected"));
    }
  }, [connection, isKitchenView]);

  // Actions (Functions to be used by UI)
  const sendOrder = async (tableNo, foodItem) => {
    if (connectionStatus === "connected") {
      const orderId = generateId();
      await connection.invoke("SendOrderToKitchen", orderId, tableNo, foodItem);
    } else {
      throw new Error("Offline");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    if (connectionStatus === "connected") {
      await connection.invoke("UpdateOrderStatus", orderId, newStatus);
    }
  };

  const clearHistory = () => {
    setOrders([]);
    localStorage.removeItem("kds_orders");
  };

  // Analytics Logic
  const chartData = useMemo(() => {
    const counts = {};
    orders.forEach(o => { counts[o.food] = (counts[o.food] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  return {
    orders,
    connectionStatus,
    sendOrder,
    updateStatus,
    clearHistory,
    chartData
  };
};