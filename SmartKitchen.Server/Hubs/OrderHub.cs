using Microsoft.AspNetCore.SignalR;

namespace SmartKitchen.Server.Hubs
{
    public class OrderHub : Hub
    {
        // 1. වේටර් Order එක දානවා
        public async Task SendOrderToKitchen(string orderId, string tableNumber, string foodItem)
        {
            await Clients.All.SendAsync("ReceiveOrder", orderId, tableNumber, foodItem);
        }

        // 2. කුස්සියෙන් Order එකේ Status එක වෙනස් කරනවා (Start Cooking / Ready)
        public async Task UpdateOrderStatus(string orderId, string status)
        {
            await Clients.All.SendAsync("ReceiveStatusUpdate", orderId, status);
        }








    }
}