namespace CompanyDashboard.Services;

public static class TokenStorage
{
    private static string? _accessToken;
    private static string? _loginEmail;

    public static string? AccessToken
    {
        get => _accessToken;
        set => _accessToken = value;
    }

    public static string? LoginEmail
    {
        get => _loginEmail;
        set => _loginEmail = value;
    }

    public static void Clear()
    {
        _accessToken = null;
        _loginEmail = null;
    }

    public static bool IsAuthenticated => !string.IsNullOrEmpty(_accessToken);
}

