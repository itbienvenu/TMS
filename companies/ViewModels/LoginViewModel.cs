using System;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Services;

using CompanyDashboard.Config;

namespace CompanyDashboard.ViewModels;

public partial class LoginViewModel : ViewModelBase
{
    private readonly AuthService _authService;

    [ObservableProperty]
    private string _loginEmail = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private string _otpCode = string.Empty;

    [ObservableProperty]
    private bool _isOtpStep = false;

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private string _infoMessage = string.Empty;

    public bool HasErrorMessage => !string.IsNullOrWhiteSpace(ErrorMessage);
    
    public bool HasInfoMessage => !string.IsNullOrWhiteSpace(InfoMessage);

    public event Action? NavigateToMainWindow;

    public LoginViewModel()
    {
        _authService = new AuthService();
    }
    
    public string ApiBaseUrl => ApiConfig.BaseUrl;

    [RelayCommand]
    private async Task StartLoginAsync()
    {
        if (string.IsNullOrWhiteSpace(LoginEmail) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Please enter both login email and password";
            OnPropertyChanged(nameof(HasErrorMessage));
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;
        InfoMessage = string.Empty;

        try
        {
            var cleanEmail = LoginEmail?.Trim() ?? string.Empty;
            await _authService.StartLoginAsync(cleanEmail, Password);
            IsOtpStep = true;
            // Update the LoginEmail with cleaned version if needed, or just use it for the request
            LoginEmail = cleanEmail;
            InfoMessage = "OTP has been sent to your registered email. Please check your inbox.";
            OnPropertyChanged(nameof(HasInfoMessage));
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            OnPropertyChanged(nameof(HasErrorMessage));
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task VerifyOtpAsync()
    {
        if (string.IsNullOrWhiteSpace(OtpCode))
        {
            ErrorMessage = "Please enter the OTP code";
            OnPropertyChanged(nameof(HasErrorMessage));
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;
        InfoMessage = string.Empty;

        try
        {
            var response = await _authService.VerifyOtpAsync(LoginEmail, OtpCode);
            
            // Store the token
            TokenStorage.AccessToken = response.AccessToken;
            TokenStorage.LoginEmail = LoginEmail;
            
            if (!TokenStorage.IsAuthenticated)
            {
                throw new Exception("Authentication token could not be stored.");
            }

            InfoMessage = "Login successful! Redirecting...";
            OnPropertyChanged(nameof(HasInfoMessage));
            
            // Navigate to main window
            await Task.Delay(1500); // Increased delay slightly
            NavigateToMainWindow?.Invoke();
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            OnPropertyChanged(nameof(HasErrorMessage));
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void BackToLogin()
    {
        IsOtpStep = false;
        OtpCode = string.Empty;
        ErrorMessage = string.Empty;
        InfoMessage = string.Empty;
        OnPropertyChanged(nameof(HasErrorMessage));
        OnPropertyChanged(nameof(HasInfoMessage));
    }
}

