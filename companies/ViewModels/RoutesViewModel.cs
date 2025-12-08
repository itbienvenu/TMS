using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class RoutesViewModel : ViewModelBase
{
    private readonly RouteService _routeService;
    private readonly StationService _stationService;
    private readonly RouteSegmentService _segmentService;

    [ObservableProperty]
    private ObservableCollection<Route> _routes = new();

    [ObservableProperty]
    private ObservableCollection<BusStation> _stations = new();

    [ObservableProperty]
    private Route? _selectedRoute;

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private bool _isEditMode = false;

    [ObservableProperty]
    private BusStation? _selectedOriginStation;

    [ObservableProperty]
    private BusStation? _selectedDestinationStation;

    [ObservableProperty]
    private string _selectedOriginId = string.Empty;

    [ObservableProperty]
    private string _selectedDestinationId = string.Empty;

    [ObservableProperty]
    private double _price;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    // Segment Management
    [ObservableProperty]
    private bool _isManagingSegments = false;

    [ObservableProperty]
    private ObservableCollection<RouteSegment> _segments = new();

    [ObservableProperty]
    private BusStation? _newSegmentStartStation;

    [ObservableProperty]
    private BusStation? _newSegmentEndStation;

    [ObservableProperty]
    private double _newSegmentPrice;

    [ObservableProperty]
    private int _newSegmentStopOrder;


    public RoutesViewModel()
    {
        var token = TokenStorage.AccessToken;
        _routeService = new RouteService(token);
        _stationService = new StationService(token);
        _segmentService = new RouteSegmentService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Routes = new ObservableCollection<Route>(await _routeService.GetAllRoutesAsync());
            Stations = new ObservableCollection<BusStation>(await _stationService.GetAllStationsAsync());
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
    private void NewRoute()
    {
        SelectedRoute = null;
        SelectedOriginStation = null;
        SelectedDestinationStation = null;
        SelectedOriginId = string.Empty;
        SelectedDestinationId = string.Empty;
        Price = 0;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private void EditRoute(Route route)
    {
        SelectedRoute = route;
        Price = route.Price;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    partial void OnSelectedOriginStationChanged(BusStation? value)
    {
        SelectedOriginId = value?.Id ?? string.Empty;
    }

    partial void OnSelectedDestinationStationChanged(BusStation? value)
    {
        SelectedDestinationId = value?.Id ?? string.Empty;
    }

    [RelayCommand]
    private async Task SaveRouteAsync()
    {
        if (SelectedOriginStation == null || SelectedDestinationStation == null || Price <= 0)
        {
            ErrorMessage = "Please fill in all required fields";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            if (SelectedRoute == null)
            {
                // Create new
                var newRoute = new RouteCreate
                {
                    OriginId = SelectedOriginStation.Id,
                    DestinationId = SelectedDestinationStation.Id,
                    Price = Price
                };
                await _routeService.CreateRouteAsync(newRoute);
            }
            else
            {
                // Update existing
                var update = new RouteUpdate
                {
                    Price = Price
                };
                await _routeService.UpdateRouteAsync(SelectedRoute.Id, update);
            }

            IsEditMode = false;
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error saving route: {ex.Message}";
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
        SelectedRoute = null;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task DeleteRouteAsync(Route route)
    {
        IsLoading = true;
        try
        {
            await _routeService.DeleteRouteAsync(route.Id);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error deleting route: {ex.Message}";
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
    [RelayCommand]
    private async Task ManageSegmentsAsync(Route route)
    {
        SelectedRoute = route;
        IsManagingSegments = true;
        IsEditMode = false;
        await LoadSegmentsAsync();
    }

    private async Task LoadSegmentsAsync()
    {
        if (SelectedRoute == null) return;
        IsLoading = true;
        try
        {
            var segments = await _segmentService.GetSegmentsByRouteAsync(SelectedRoute.Id);
            Segments = new ObservableCollection<RouteSegment>(segments.OrderBy(s => s.StopOrder));
        }
        catch (Exception ex)
        {
             ErrorMessage = $"Error loading segments: {ex.Message}";
        }
        finally
        {
             IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AddSegmentAsync()
    {
        if (SelectedRoute == null || NewSegmentStartStation == null || NewSegmentEndStation == null || NewSegmentPrice <= 0)
        {
             ErrorMessage = "Please fill all segment fields.";
             return;
        }

        IsLoading = true;
        try
        {
            var newSegment = new RouteSegmentCreate
            {
                RouteId = SelectedRoute.Id,
                StartStationId = NewSegmentStartStation.Id,
                EndStationId = NewSegmentEndStation.Id,
                Price = NewSegmentPrice,
                StopOrder = NewSegmentStopOrder
            };

            await _segmentService.CreateSegmentAsync(newSegment);
            
            // Reset fields
            NewSegmentStartStation = null;
            NewSegmentEndStation = null;
            NewSegmentPrice = 0;
            NewSegmentStopOrder = 0;

            await LoadSegmentsAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error adding segment: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteSegmentAsync(RouteSegment segment)
    {
         IsLoading = true;
         try
         {
             await _segmentService.DeleteSegmentAsync(segment.Id);
             await LoadSegmentsAsync();
         }
         catch (Exception ex)
         {
             ErrorMessage = $"Error deleting segment: {ex.Message}";
         }
         finally
         {
             IsLoading = false;
         }
    }

    [RelayCommand]
    private void CloseSegments()
    {
        IsManagingSegments = false;
        SelectedRoute = null;
        Segments.Clear();
    }
}

