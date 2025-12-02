namespace CompanyDashboard.Config;

/// <summary>
/// Global API configuration. Modify the BaseUrl here to change the API endpoint
/// without affecting the rest of the application.
/// </summary>
public static class ApiConfig
{
    /// <summary>
    /// Base URL for the API. Change this value to point to your backend server.
    /// </summary>
    public const string BaseUrl = "http://localhost:8000";
    
    /// <summary>
    /// Full API base path including version
    /// </summary>
    public const string ApiBasePath = $"{BaseUrl}/api/v1";
}

