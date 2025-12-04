using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class RouteSegmentService : ApiService
{
    public RouteSegmentService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<RouteSegment>> GetSegmentsByRouteAsync(string routeId)
    {
        return await GetListAsync<RouteSegment>($"route_segments/?route_id={routeId}");
    }

    public async Task<RouteSegment> CreateSegmentAsync(RouteSegmentCreate segment)
    {
        return await PostAsync<RouteSegment>("route_segments/", segment) ?? throw new Exception("Failed to create segment");
    }

    public async Task<RouteSegment> UpdateSegmentAsync(string id, RouteSegmentCreate segment)
    {
        return await PutAsync<RouteSegment>($"route_segments/{id}", segment) ?? throw new Exception("Failed to update segment");
    }

    public async Task DeleteSegmentAsync(string id)
    {
        await DeleteAsync($"route_segments/{id}");
    }
}

