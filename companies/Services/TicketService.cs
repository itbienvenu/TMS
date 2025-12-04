using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class TicketService : ApiService
{
    public TicketService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Ticket>> GetAllTicketsAsync()
    {
        return await GetListAsync<Ticket>("tickets/");
    }

    public async Task<Ticket> GetTicketByIdAsync(string id)
    {
        return await GetAsync<Ticket>($"tickets/{id}") ?? throw new Exception("Ticket not found");
    }

    public async Task<Ticket> UpdateTicketStatusAsync(string id, string status)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"{BasePath}/tickets/{id}/status?new_status={status}");
        var response = await HttpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<Ticket>() ?? throw new Exception("Failed to update ticket");
        }
        var errorContent = await response.Content.ReadAsStringAsync();
        throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
    }

    public async Task VerifyQrCodeAsync(string qrToken)
    {
        var jsonContent = System.Net.Http.Json.JsonContent.Create(new { qr_token = qrToken });
        var response = await HttpClient.PostAsync($"{BasePath}/tickets/verify-qr", jsonContent);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
        }
    }

    public async Task DeleteTicketAsync(string id)
    {
        await DeleteAsync($"tickets/{id}");
    }
}

