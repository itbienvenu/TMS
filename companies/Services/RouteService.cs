using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class RouteService : ApiService
{
    public RouteService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Route>> GetAllRoutesAsync()
    {
        return await GetListAsync<Route>("routes/");
    }

    public async Task<Route> GetRouteByIdAsync(string id)
    {
        return await GetAsync<Route>($"routes/{id}") ?? throw new Exception("Route not found");
    }

    public async Task<Route> CreateRouteAsync(RouteCreate route)
    {
        return await PostAsync<Route>("routes/register", route) ?? throw new Exception("Failed to create route");
    }

    public async Task<Route> UpdateRouteAsync(string id, RouteUpdate route)
    {
        return await PutAsync<Route>($"routes/{id}", route) ?? throw new Exception("Failed to update route");
    }

    public async Task DeleteRouteAsync(string id)
    {
        await DeleteAsync($"routes/{id}");
    }

    public async Task AssignBusToRouteAsync(string routeId, string busId)
    {
        await PostAsync<object>("routes/assign-bus", new { route_id = routeId, bus_id = busId });
    }
}

