using SmartKitchen.Server.Hubs; // අර අපි හදපු Hub ෆයිල් එක මෙතනට සම්බන්ධ කරගන්නවා

var builder = WebApplication.CreateBuilder(args);

// 1. SignalR Service එක ඇඩ් කරනවා (වැදගත්ම කෑල්ල
builder.Services.AddSignalR();

// 2. CORS ප්‍රශ්නය විසඳනවා (React වෙන තැනක දුවන නිසා)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", builder =>
    {
        builder.WithOrigins("http://localhost:5173") // React දුවන Port එක (සාමාන්‍යයෙන් Vite වල 5173)
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials(); // SignalR වලට මේක අනිවාර්යයි
    });
});

// Swagger ඕන නම් තියාගමු (API Test කරන්න ලේසියි)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 3. React Policy එක ඇක්ටිව් කරනවා
app.UseCors("ReactPolicy");

// 4. අපේ Hub එකට පාර (Link එක) හදනවා
app.MapHub<OrderHub>("/orderHub");

app.Run();