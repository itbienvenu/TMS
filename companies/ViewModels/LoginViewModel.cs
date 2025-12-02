using System;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Services;

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

    public LoginViewModel()
    {
        _authService = new AuthService();
    }

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
            await _authService.StartLoginAsync(LoginEmail, Password);
            IsOtpStep = true;
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
            
            // Store the token (you can use secure storage or settings)
            // For now, we'll just show a success message
            InfoMessage = $"Login successful! Token: {response.AccessToken.Substring(0, 20)}...";
            OnPropertyChanged(nameof(HasInfoMessage));
            
            // TODO: Navigate to dashboard or main window
            // You can implement navigation here
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

