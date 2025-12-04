using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class StationsViewModel : ViewModelBase
{
    private readonly StationService _stationService;

    [ObservableProperty]
    private ObservableCollection<BusStation> _stations = new();

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private bool _isEditMode = false;

    [ObservableProperty]
    private string _stationName = string.Empty;

    [ObservableProperty]
    private string _location = string.Empty;

    [ObservableProperty]
    private BusStation? _selectedStation;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public StationsViewModel()
    {
        var token = TokenStorage.AccessToken;
        _stationService = new StationService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Stations = new ObservableCollection<BusStation>(await _stationService.GetAllStationsAsync());
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error loading stations: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void NewStation()
    {
        SelectedStation = null;
        StationName = string.Empty;
        Location = string.Empty;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task SaveStationAsync()
    {
        if (string.IsNullOrWhiteSpace(StationName))
        {
            ErrorMessage = "Please enter a station name";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            var newStation = new BusStationCreate
            {
                Name = StationName,
                Location = Location
            };
            await _stationService.CreateStationAsync(newStation);
            IsEditMode = false;
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error saving station: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void CancelEdit()
    {
        IsEditMode = false;
        SelectedStation = null;
        StationName = string.Empty;
        Location = string.Empty;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task DeleteStationAsync(BusStation station)
    {
        IsLoading = true;
        try
        {
            await _stationService.DeleteStationAsync(station.Id);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error deleting station: {ex.Message}";
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

