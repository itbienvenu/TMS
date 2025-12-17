using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

namespace CompanyDashboard.Services;

public class TrackingService
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "http://localhost:8000/api/v1/tracking";

    public TrackingService()
    {
        _httpClient = new HttpClient();
    }

    public async Task<Dictionary<string, BusLocation?>> GetBatchLocationsAsync(List<string> busIds)
    {
        try
        {
            var request = new { bus_ids = busIds };
            var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/batch", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<Dictionary<string, BusLocation?>>();
            return result ?? new Dictionary<string, BusLocation?>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching tracking data: {ex.Message}");
            return new Dictionary<string, BusLocation?>();
        }
    }
}

public class BusLocation
{
    // Adjust properties based on what Mobile App sends
    // Usually { "latitude": float, "longitude": float, "speed": float, "timestamp": ... }
    public double latitude { get; set; }
    public double longitude { get; set; }
    public double? speed { get; set; }
    public long? timestamp { get; set; }
}
