using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using CompanyDashboard.Config;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class AuthService
{
    private readonly HttpClient _httpClient;

    public AuthService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl)
        };
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    /// <summary>
    /// Step 1: Start company login by sending login_email and password
    /// </summary>
    public async Task<CompanyLoginStartResponse> StartLoginAsync(string loginEmail, string password)
    {
        var request = new CompanyLoginStartRequest
        {
            LoginEmail = loginEmail,
            Password = password
        };

        var response = await _httpClient.PostAsJsonAsync($"{ApiConfig.ApiBasePath}/company-login/start", request);
        
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<CompanyLoginStartResponse>();
            return result ?? new CompanyLoginStartResponse { Message = "OTP sent successfully" };
        }
        else
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            try
            {
                var error = JsonSerializer.Deserialize<ApiErrorResponse>(errorContent);
                throw new Exception(error?.Detail ?? "Login failed");
            }
            catch
            {
                throw new Exception($"Login failed: {response.StatusCode} - {errorContent}");
            }
        }
    }

    /// <summary>
    /// Step 2: Verify OTP code and get access token
    /// </summary>
    public async Task<CompanyLoginVerifyResponse> VerifyOtpAsync(string loginEmail, string code)
    {
        var request = new CompanyLoginVerifyRequest
        {
            LoginEmail = loginEmail,
            Code = code
        };

        var response = await _httpClient.PostAsJsonAsync($"{ApiConfig.ApiBasePath}/company-login/verify", request);
        
        if (response.IsSuccessStatusCode)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            var result = await response.Content.ReadFromJsonAsync<CompanyLoginVerifyResponse>(options);
            
            if (result == null)
                throw new Exception("Received empty response from server");

            if (string.IsNullOrEmpty(result.AccessToken))
            {
                // Try reading raw content to debug
                // var raw = await response.Content.ReadAsStringAsync();
                // throw new Exception($"Server returned success but no access_token. Raw: {raw}");
                throw new Exception("Server returned success but access_token is missing or empty.");
            }

            return result;
        }
        else
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var error = JsonSerializer.Deserialize<ApiErrorResponse>(errorContent, options);
                throw new Exception(error?.Detail ?? "OTP verification failed");
            }
            catch(Exception ex) when (ex.Message != "OTP verification failed") 
            {
                 throw new Exception($"OTP verification failed: {response.StatusCode} - {errorContent}");
            }
            catch
            {
                throw new Exception($"OTP verification failed: {response.StatusCode} - {errorContent}");
            }
        }
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}

