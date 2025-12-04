using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class BusService : ApiService
{
    public BusService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Bus>> GetAllBusesAsync()
    {
        return await GetListAsync<Bus>("buses/");
    }

    public async Task<Bus> GetBusByIdAsync(string id)
    {
        return await GetAsync<Bus>($"buses/{id}") ?? throw new Exception("Bus not found");
    }

    public async Task<Bus> CreateBusAsync(BusCreate bus)
    {
        return await PostAsync<Bus>("buses/", bus) ?? throw new Exception("Failed to create bus");
    }

    public async Task<Bus> UpdateBusAsync(string id, BusUpdate bus)
    {
        return await PatchAsync<Bus>($"buses/{id}", bus) ?? throw new Exception("Failed to update bus");
    }

    public async Task DeleteBusAsync(string id)
    {
        await DeleteAsync($"buses/{id}");
    }
}

