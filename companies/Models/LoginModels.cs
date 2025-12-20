using System.Text.Json.Serialization;

namespace CompanyDashboard.Models;

public class CompanyLoginStartRequest
{
    [JsonPropertyName("email")]
    public string LoginEmail { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

public class CompanyLoginStartResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public class CompanyLoginVerifyRequest
{
    [JsonPropertyName("login_email")]
    public string LoginEmail { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;
}

public class CompanyLoginVerifyResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;
}

public class ApiErrorResponse
{
    [JsonPropertyName("detail")]
    public string Detail { get; set; } = string.Empty;
}

