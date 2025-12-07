namespace CompanyDashboard.Config;

/// <summary>
/// </summary>
public static class ApiConfig
{
    /// <summary>
    /// Base URL for the API. Change this value to point to  backend server.
    /// </summary>
    public const string BaseUrl = "http://localhost:8000";
    
    /// <summary>
    /// Full API base path including version
    /// </summary>
    public const string ApiBasePath = $"{BaseUrl}/api/v1";
}

