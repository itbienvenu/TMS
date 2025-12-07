using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class DriverService : ApiService
{
    public DriverService(string? token = null)
    {
        if (!string.IsNullOrEmpty(token))
        {
            SetAuthToken(token);
        }
    }

    public async Task<List<Driver>> GetAllDriversAsync()
    {
        return await GetAsync<List<Driver>>("drivers/") ?? new List<Driver>();
    }

    public async Task<Driver?> CreateDriverAsync(DriverCreate driver)
    {
        return await PostAsync<Driver>("drivers/", driver);
    }

    public async Task<Driver?> UpdateDriverAsync(string id, DriverUpdate driver)
    {
        return await PatchAsync<Driver>($"drivers/{id}", driver);
    }

    public async Task DeleteDriverAsync(string id)
    {
        await DeleteAsync($"drivers/{id}");
    }
}
