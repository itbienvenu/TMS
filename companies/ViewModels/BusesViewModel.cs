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
    private readonly DriverService _driverService;
    
    // --- Collections ---
    [ObservableProperty]
    private ObservableCollection<Bus> _buses = new();

    [ObservableProperty]
    private ObservableCollection<Route> _routes = new();

    [ObservableProperty]
    private ObservableCollection<Driver> _allDrivers = new();

    // Drivers assigned to the currently selected bus
    [ObservableProperty]
    private ObservableCollection<Driver> _assignedDrivers = new();

    // Available drivers (not assigned to any bus) or just all drivers for search? 
    // User wants to filter/search. Let's show filtered list for assignment.
    [ObservableProperty]
    private ObservableCollection<Driver> _availableDrivers = new();

    [ObservableProperty]
    private string _driverSearchQuery = string.Empty;

    // --- Selections ---
    [ObservableProperty]
    private Bus? _selectedBus;

    [ObservableProperty]
    private Driver? _selectedDriverToAssign;

    // --- UI State ---
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

    protected override void OnPropertyChanged(System.ComponentModel.PropertyChangedEventArgs e)
    {
        base.OnPropertyChanged(e);
        
        if (e.PropertyName == nameof(SelectedBus))
        {
            UpdateDriverLists();
        }
        else if (e.PropertyName == nameof(DriverSearchQuery))
        {
            UpdateAvailableDriversFilter();
        }
    }

    public BusesViewModel()
    {
        var token = TokenStorage.AccessToken;
        _busService = new BusService(token);
        _routeService = new RouteService(token);
        _driverService = new DriverService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var busTask = _busService.GetAllBusesAsync();
            var routeTask = _routeService.GetAllRoutesAsync();
            var driverTask = _driverService.GetAllDriversAsync();
            
            await Task.WhenAll(busTask, routeTask, driverTask);

            Buses = new ObservableCollection<Bus>(await busTask);
            Routes = new ObservableCollection<Route>(await routeTask);
            AllDrivers = new ObservableCollection<Driver>(await driverTask);
            
            UpdateDriverLists();
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
    
    private void UpdateDriverLists()
    {
        if (SelectedBus == null) 
        {
            AssignedDrivers.Clear();
            AvailableDrivers.Clear();
            return;
        }

        // Assigned: Drivers where BusId == SelectedBus.Id
        var assigned = AllDrivers.Where(d => d.BusId == SelectedBus.Id).ToList();
        AssignedDrivers = new ObservableCollection<Driver>(assigned);
        
        UpdateAvailableDriversFilter();
    }
    
    private void UpdateAvailableDriversFilter()
    {
        // Available: Drivers where BusId check? 
        // User asked: "remove driver from a bus".
        // Also "assign driver... search... filter".
        // Typically we list drivers that are NOT assigned to THIS bus. 
        // Or strictly drivers with BusId == null ?
        // Usually you can steal a driver from another bus, but safer to only show free drivers.
        // Let's assume we can only pick drivers who are currently free (BusId is null/empty).
        
        var query = DriverSearchQuery?.ToLower() ?? "";
        
        var available = AllDrivers
            .Where(d => string.IsNullOrEmpty(d.BusId) || d.BusId != SelectedBus?.Id) // Don't show already assigned
            .Where(d => string.IsNullOrEmpty(d.BusId)) // Strict: only unassigned
            .Where(d => string.IsNullOrEmpty(query) || 
                        d.FullName.ToLower().Contains(query) || 
                        d.Email.ToLower().Contains(query) ||
                        (d.LicenseNumber != null && d.LicenseNumber.ToLower().Contains(query)) ||
                        (d.PhoneNumber != null && d.PhoneNumber.Contains(query)))
            .ToList();
            
        AvailableDrivers = new ObservableCollection<Driver>(available);
    }

    [RelayCommand]
    private void NewBus()
    {
        SelectedBus = null;
        PlateNumber = string.Empty;
        Capacity = 0;
        IsEditMode = true;
        ErrorMessage = string.Empty;
        
        // When creating new bus, we can't assign drivers yet because Bus ID doesn't exist.
        // We could handle it, but simplistically, create bus first, then edit to add drivers.
        AssignedDrivers.Clear();
        AvailableDrivers.Clear();
    }
    
    [RelayCommand]
    private void EditBus(Bus bus)
    {
        SelectedBus = bus;
        PlateNumber = bus.PlateNumber;
        Capacity = bus.Capacity;
        IsEditMode = true;
        ErrorMessage = string.Empty;
        
        // Trigger list update
        UpdateDriverLists();
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
                var createdBus = await _busService.CreateBusAsync(newBus);
                
                // If successful, maybe select it and stay in edit mode to allow adding drivers?
                // Or just close. Let's just close for now.
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
    private async Task AssignDriverAsync(Driver driver)
    {
        if (SelectedBus == null || driver == null) return;
        
        IsLoading = true;
        try
        {
            var update = new DriverUpdate { BusId = SelectedBus.Id };
            await _driverService.UpdateDriverAsync(driver.Id, update); // Needs UpdateDriverAsync method in service
            
            // Refresh local state without full reload if possible, but full reload is safer
            driver.BusId = SelectedBus.Id;
            UpdateDriverLists();
        }
        catch (Exception ex)
        {
             ErrorMessage = $"Failed to assign driver: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task UnassignDriverAsync(Driver driver)
    {
        IsLoading = true;
        try
        {
            // Set BusId to empty string to unassign (handled by backend logic we wrote)
            var update = new DriverUpdate { BusId = "" }; 
            await _driverService.UpdateDriverAsync(driver.Id, update);

            driver.BusId = null;
            UpdateDriverLists();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to unassign driver: {ex.Message}";
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

