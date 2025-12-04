using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class TicketsViewModel : ViewModelBase
{
    private readonly TicketService _ticketService;

    [ObservableProperty]
    private ObservableCollection<Ticket> _tickets = new();

    [ObservableProperty]
    private Ticket? _selectedTicket;

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private string _qrCodeInput = string.Empty;

    [ObservableProperty]
    private string _verificationResult = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public TicketsViewModel()
    {
        var token = TokenStorage.AccessToken;
        _ticketService = new TicketService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Tickets = new ObservableCollection<Ticket>(await _ticketService.GetAllTicketsAsync());
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error loading tickets: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task VerifyQrCodeAsync()
    {
        if (string.IsNullOrWhiteSpace(QrCodeInput))
        {
            ErrorMessage = "Please enter a QR code";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;
        VerificationResult = string.Empty;

        try
        {
            await _ticketService.VerifyQrCodeAsync(QrCodeInput);
            VerificationResult = "Ticket verified successfully!";
            QrCodeInput = string.Empty;
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Verification failed: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    public async Task UpdateTicketStatusAsync(string status)
    {
        if (SelectedTicket == null) return;
        
        IsLoading = true;
        try
        {
            await _ticketService.UpdateTicketStatusAsync(SelectedTicket.Id, status);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error updating ticket: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteTicketAsync(Ticket ticket)
    {
        IsLoading = true;
        try
        {
            await _ticketService.DeleteTicketAsync(ticket.Id);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error deleting ticket: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        await LoadDataAsync();
    }
}

