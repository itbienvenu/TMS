using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using CompanyDashboard.Config;
using CompanyDashboard.Models;
using System.Net;

namespace CompanyDashboard.Services;

public class ApiService
{
    protected readonly HttpClient HttpClient;
    protected readonly string BasePath;

    public ApiService()
    {
        HttpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl)
        };
        HttpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        BasePath = ApiConfig.ApiBasePath;
    }

    protected void SetAuthToken(string token)
    {
        HttpClient.DefaultRequestHeaders.Remove("Authorization");
        HttpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
    }

    protected async Task<T?> GetAsync<T>(string endpoint)
    {
        var response = await HttpClient.GetAsync($"{BasePath}/{endpoint}");
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<T>();
        }
        throw new Exception($"API Error: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
    }

    protected async Task<List<T>> GetListAsync<T>(string endpoint)
    {
        var response = await HttpClient.GetAsync($"{BasePath}/{endpoint}");
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<List<T>>() ?? new List<T>();
        }
        throw new Exception($"API Error: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
    }

    protected async Task<T?> PostAsync<T>(string endpoint, object data)
    {
        var response = await HttpClient.PostAsJsonAsync($"{BasePath}/{endpoint}", data);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<T>();
        }
        var errorContent = await response.Content.ReadAsStringAsync();
        throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
    }

    protected async Task<T?> PutAsync<T>(string endpoint, object data)
    {
        var response = await HttpClient.PutAsJsonAsync($"{BasePath}/{endpoint}", data);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<T>();
        }
        var errorContent = await response.Content.ReadAsStringAsync();
        throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
    }

    protected async Task<T?> PatchAsync<T>(string endpoint, object data)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"{BasePath}/{endpoint}")
        {
            Content = System.Net.Http.Json.JsonContent.Create(data)
        };
        var response = await HttpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<T>();
        }
        var errorContent = await response.Content.ReadAsStringAsync();
        throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
    }

    protected async Task DeleteAsync(string endpoint)
    {
        var response = await HttpClient.DeleteAsync($"{BasePath}/{endpoint}");
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
        }
    }
}

