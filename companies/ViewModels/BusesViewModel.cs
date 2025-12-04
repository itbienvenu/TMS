using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class BusesViewModel : ViewModelBase
{
    private readonly BusService _busService;
    private readonly RouteService _routeService;

    [ObservableProperty]
    private ObservableCollection<Bus> _buses = new();

    [ObservableProperty]
    private ObservableCollection<Route> _routes = new();

    [ObservableProperty]
    private Bus? _selectedBus;

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private bool _isEditMode = false;

    [ObservableProperty]
    private string _plateNumber = string.Empty;

    [ObservableProperty]
    private int _capacity;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public BusesViewModel()
    {
        var token = TokenStorage.AccessToken;
        _busService = new BusService(token);
        _routeService = new RouteService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Buses = new ObservableCollection<Bus>(await _busService.GetAllBusesAsync());
            Routes = new ObservableCollection<Route>(await _routeService.GetAllRoutesAsync());
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error loading data: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void NewBus()
    {
        SelectedBus = null;
        PlateNumber = string.Empty;
        Capacity = 0;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private void EditBus(Bus bus)
    {
        SelectedBus = bus;
        PlateNumber = bus.PlateNumber;
        Capacity = bus.Capacity;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task SaveBusAsync()
    {
        if (string.IsNullOrWhiteSpace(PlateNumber) || Capacity <= 0)
        {
            ErrorMessage = "Please fill in all required fields";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            if (SelectedBus == null)
            {
                // Create new
                var newBus = new BusCreate
                {
                    PlateNumber = PlateNumber,
                    Capacity = Capacity
                };
                await _busService.CreateBusAsync(newBus);
            }
            else
            {
                // Update existing
                var update = new BusUpdate
                {
                    PlateNumber = PlateNumber,
                    Capacity = Capacity
                };
                await _busService.UpdateBusAsync(SelectedBus.Id, update);
            }

            IsEditMode = false;
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error saving bus: {ex.Message}";
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
        SelectedBus = null;
        PlateNumber = string.Empty;
        Capacity = 0;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task DeleteBusAsync(Bus bus)
    {
        IsLoading = true;
        try
        {
            await _busService.DeleteBusAsync(bus.Id);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error deleting bus: {ex.Message}";
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

