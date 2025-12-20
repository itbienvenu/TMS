using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class ScheduleService : ApiService
{
    public ScheduleService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Schedule>> GetAllSchedulesAsync(string? routeId = null)
    {
        var endpoint = routeId != null ? $"schedules/?route_id={routeId}" : "schedules/";
        return await GetListAsync<Schedule>(endpoint);
    }

    public async Task<Schedule> GetScheduleByIdAsync(string id)
    {
        return await GetAsync<Schedule>($"schedules/{id}") ?? throw new Exception("Schedule not found");
    }

    public async Task<Schedule> CreateScheduleAsync(ScheduleCreate schedule)
    {
        return await PostAsync<Schedule>("schedules/", schedule) ?? throw new Exception("Failed to create schedule");
    }

    public async Task<Schedule> UpdateScheduleAsync(string id, ScheduleUpdate schedule)
    {
        return await PutAsync<Schedule>($"schedules/{id}", schedule) ?? throw new Exception("Failed to update schedule");
    }

    public async Task DeleteScheduleAsync(string id)
    {
        await DeleteAsync($"schedules/{id}");
    }

    public async Task SwapBusAsync(string scheduleId, string newBusId)
    {
        var payload = new { new_bus_id = newBusId };
        // Assuming PostAsync handles generic object serialization for the body
        // and expecting a response we might not use, or just success.
        // We'll use PostAsync<object> to fire it.
        await PostAsync<object>($"schedules/{scheduleId}/swap-bus", payload);
    }
}

