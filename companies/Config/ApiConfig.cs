namespace CompanyDashboard.Config;

/// <summary>
/// </summary>
public static class ApiConfig
{
    /// <summary>
    /// Base URL for the API. http://127.0.0.1:8000/Change this value to point to  backend server.
    /// </summary>
    // public const string BaseUrl = "http://3.12.248.83:8000";
    public const string BaseUrl = "http://3.12.248.83:8000";

    /// <summary>
    /// Full API base path including version
    /// </summary>
    public const string ApiBasePath = $"{BaseUrl}/api/v1";
}