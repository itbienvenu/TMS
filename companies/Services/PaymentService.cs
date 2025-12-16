using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class PaymentService : ApiService
{
    public PaymentService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public Task<List<Payment>> GetAllPaymentsAsync()
    {
        // Note: This endpoint might need to be created or use a different path
        // For now, we'll try to get payments through tickets
        return Task.FromResult(new List<Payment>());
    }

    public async Task<Payment> GetPaymentByIdAsync(string id)
    {
        return await GetAsync<Payment>($"payments/{id}") ?? throw new Exception("Payment not found");
    }

    public async Task<Payment> UpdatePaymentStatusAsync(string id, string status)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"{BasePath}/payments/{id}/status")
        {
            Content = System.Net.Http.Json.JsonContent.Create(new { new_status = status })
        };
        var response = await HttpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<Payment>() ?? throw new Exception("Failed to update payment");
        }
        var errorContent = await response.Content.ReadAsStringAsync();
        throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
    }
}

