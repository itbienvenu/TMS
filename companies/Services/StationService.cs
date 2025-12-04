using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class StationService : ApiService
{
    public StationService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<BusStation>> GetAllStationsAsync()
    {
        return await GetListAsync<BusStation>("stations/");
    }

    public async Task<BusStation> CreateStationAsync(BusStationCreate station)
    {
        return await PostAsync<BusStation>("stations/", station) ?? throw new Exception("Failed to create station");
    }

    public async Task DeleteStationAsync(string id)
    {
        await DeleteAsync($"stations/{id}");
    }
}

