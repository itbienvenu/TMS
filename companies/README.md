# Company Dashboard - Avalonia UI Application

A cross-platform desktop application for company management built with Avalonia UI and .NET 8.0.

## Features

- **Company Login**: Two-step authentication with OTP verification
- **Cross-Platform**: Runs on Windows, Linux, and macOS
- **Modern UI**: Built with Avalonia UI framework

## Configuration

### API Base URL

The API base URL is configured in `Config/ApiConfig.cs`. To change the backend server URL, modify the `BaseUrl` constant:

```csharp
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
```

Simply update the `BaseUrl` value to point to your backend server (e.g., `"https://api.example.com"` or `"http://192.168.1.100:8000"`).

## Building and Running

### Prerequisites

- .NET 8.0 SDK or later
- Avalonia UI development tools

### Build

```bash
dotnet restore
dotnet build
```

### Run

```bash
dotnet run
```

### Publish for Specific Platform

#### Windows
```bash
dotnet publish -c Release -r win-x64 --self-contained
```

#### Linux
```bash
dotnet publish -c Release -r linux-x64 --self-contained
```

#### macOS
```bash
dotnet publish -c Release -r osx-x64 --self-contained
```

## Project Structure

```
companies/
├── Config/
│   └── ApiConfig.cs          # API configuration (modify BaseUrl here)
├── Models/
│   └── LoginModels.cs        # Data models for API requests/responses
├── Services/
│   └── AuthService.cs        # Authentication service
├── ViewModels/
│   ├── LoginViewModel.cs     # Login view model
│   └── ViewModelBase.cs      # Base view model
├── Views/
│   └── LoginView.axaml       # Login UI
└── CompanyDashboard.csproj   # Project file
```

## API Endpoints Used

- `POST /api/v1/company-login/start` - Start login with email and password
- `POST /api/v1/company-login/verify` - Verify OTP and get access token

## Usage

1. Launch the application
2. Enter your company-issued login email and password
3. Click "Login" - an OTP will be sent to your registered email
4. Enter the OTP code received via email
5. Click "Verify OTP" to complete login

## Development

This project uses:
- **Avalonia UI 11.3.9** - Cross-platform UI framework
- **CommunityToolkit.Mvvm 8.2.1** - MVVM helpers
- **System.Net.Http.Json 8.0.0** - HTTP client for API calls

## License

[Your License Here]

