using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Services;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace CompanyDashboard.ViewModels;

public class ChatMessage
{
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
    public bool IsUser => Role == "user";
    public string BgColor => IsUser ? "#0d6efd" : "#e9ecef"; // Bootstrap-ish Primary vs Light Gray
    public string TextColor => IsUser ? "White" : "Black";
    public string Alignment => IsUser ? "Right" : "Left";
}

public partial class ChatViewModel : ViewModelBase
{
    private readonly UserService _userService;
    private readonly HttpClient _httpClient;
    private string _sessionId = string.Empty;
    private string? _companyId;

    [ObservableProperty]
    private ObservableCollection<ChatMessage> _messages = new();

    [ObservableProperty]
    private string _inputText = string.Empty;

    [ObservableProperty]
    private bool _isLoading = false;

    public ChatViewModel()
    {
        var token = TokenStorage.AccessToken;
        _userService = new UserService(token);
        _httpClient = new HttpClient(); 
        
        // Generate or retrieve session ID
        if (string.IsNullOrEmpty(_sessionId))
        {
             _sessionId = Guid.NewGuid().ToString();
        }

        Messages.Add(new ChatMessage { Role = "assistant", Content = "Hello! I can help you manage your fleet. Ask me to list your buses or suggest schedules." });
        
        InitializeAsync();
    }
    
    // Fire and forget init to get context
    private async void InitializeAsync()
    {
        try 
        {
             var user = await _userService.GetCurrentUserAsync();
             if (user != null)
             {
                 _companyId = user.CompanyId;
                 // System.Console.WriteLine($"DEBUG: Fetched Company ID: {_companyId}");
             }
        }
        catch (Exception ex)
        {
             // Log error to chat for debugging
             Messages.Add(new ChatMessage { Role = "assistant", Content = $"System Warning: Could not fetch user context ({ex.Message}). Some features may not work." });
        }
    }

    [RelayCommand]
    private async Task SendMessageAsync()
    {
        if (string.IsNullOrWhiteSpace(InputText)) return;

        var userMsg = InputText;
        InputText = string.Empty;

        Messages.Add(new ChatMessage { Role = "user", Content = userMsg });
        IsLoading = true;

        try
        {
            // Retry fetching company ID if missing
            if (string.IsNullOrEmpty(_companyId))
            {
                try 
                {
                    var user = await _userService.GetCurrentUserAsync();
                    _companyId = user?.CompanyId;
                }
                catch { /* Ignore second failure */ }
            }

            var request = new 
            {
                message = userMsg,
                role = "company_admin",
                session_id = _sessionId,
                context = new { company_id = _companyId ?? "" }
            };

            // Using local URL as requested
            var response = await _httpClient.PostAsJsonAsync("http://3.12.248.83:8000/api/v1/chat/", request);
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                if (result.TryGetProperty("response", out var respProp))
                {
                    Messages.Add(new ChatMessage { Role = "assistant", Content = respProp.GetString() ?? "" });
                }
            }
            else
            {
                Messages.Add(new ChatMessage { Role = "assistant", Content = "Sorry, I am unable to reach the AI Service." });
            }
        }
        catch (Exception ex)
        {
            Messages.Add(new ChatMessage { Role = "assistant", Content = $"System Error: {ex.Message}" });
        }
        finally
        {
            IsLoading = false;
        }
    }
}
