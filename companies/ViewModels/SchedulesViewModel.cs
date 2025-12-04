using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class SchedulesViewModel : ViewModelBase
{
    private readonly ScheduleService _scheduleService;
    private readonly BusService _busService;
    private readonly RouteSegmentService _routeSegmentService;
    private readonly RouteService _routeService;

    [ObservableProperty]
    private ObservableCollection<Schedule> _schedules = new();

    [ObservableProperty]
    private ObservableCollection<Bus> _buses = new();

    [ObservableProperty]
    private ObservableCollection<RouteSegment> _routeSegments = new();

    [ObservableProperty]
    private ObservableCollection<Route> _routes = new();

    [ObservableProperty]
    private Schedule? _selectedSchedule;

    [ObservableProperty]
    private bool _isLoading = false;

    [ObservableProperty]
    private bool _isEditMode = false;

    [ObservableProperty]
    private Bus? _selectedBus;

    [ObservableProperty]
    private RouteSegment? _selectedRouteSegment;

    [ObservableProperty]
    private Route? _selectedRoute;

    [ObservableProperty]
    private string _selectedBusId = string.Empty;

    [ObservableProperty]
    private string _selectedRouteSegmentId = string.Empty;

    [ObservableProperty]
    private DateTime _departureTime = DateTime.Now;

    [ObservableProperty]
    private DateTime? _arrivalTime;

    [ObservableProperty]
    private DateTime? _departureDate;

    [ObservableProperty]
    private TimeSpan? _departureTimeSpan;

    [ObservableProperty]
    private DateTime? _arrivalDate;

    [ObservableProperty]
    private TimeSpan? _arrivalTimeSpan;

    [ObservableProperty]
    private string _selectedRouteId = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public SchedulesViewModel()
    {
        var token = TokenStorage.AccessToken;
        _scheduleService = new ScheduleService(token);
        _busService = new BusService(token);
        _routeSegmentService = new RouteSegmentService(token);
        _routeService = new RouteService(token);
        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Schedules = new ObservableCollection<Schedule>(await _scheduleService.GetAllSchedulesAsync());
            Buses = new ObservableCollection<Bus>(await _busService.GetAllBusesAsync());
            Routes = new ObservableCollection<Route>(await _routeService.GetAllRoutesAsync());
            
            if (!string.IsNullOrEmpty(SelectedRouteId))
            {
                RouteSegments = new ObservableCollection<RouteSegment>(
                    await _routeSegmentService.GetSegmentsByRouteAsync(SelectedRouteId));
            }
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

    partial void OnSelectedRouteChanged(Route? value)
    {
        if (value != null)
        {
            SelectedRouteId = value.Id;
            RouteChangedCommand.Execute(null);
        }
    }

    partial void OnSelectedBusChanged(Bus? value)
    {
        SelectedBusId = value?.Id ?? string.Empty;
    }

    partial void OnSelectedRouteSegmentChanged(RouteSegment? value)
    {
        SelectedRouteSegmentId = value?.Id ?? string.Empty;
    }

    [RelayCommand]
    private async Task RouteChangedAsync()
    {
        if (SelectedRoute != null)
        {
            try
            {
                RouteSegments = new ObservableCollection<RouteSegment>(
                    await _routeSegmentService.GetSegmentsByRouteAsync(SelectedRoute.Id));
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Error loading route segments: {ex.Message}";
            }
        }
    }

    [RelayCommand]
    private void NewSchedule()
    {
        SelectedSchedule = null;
        SelectedBus = null;
        SelectedRouteSegment = null;
        SelectedRoute = null;
        SelectedBusId = string.Empty;
        SelectedRouteSegmentId = string.Empty;
        DepartureDate = DateTime.Now.Date;
        DepartureTimeSpan = DateTime.Now.TimeOfDay;
        ArrivalDate = null;
        ArrivalTimeSpan = null;
        DepartureTime = DateTime.Now;
        ArrivalTime = null;
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task EditScheduleAsync(Schedule schedule)
    {
        SelectedSchedule = schedule;
        SelectedBusId = schedule.BusId;
        SelectedRouteSegmentId = schedule.RouteSegmentId;
        DepartureTime = schedule.DepartureTime;
        ArrivalTime = schedule.ArrivalTime;
        DepartureDate = schedule.DepartureTime.Date;
        DepartureTimeSpan = schedule.DepartureTime.TimeOfDay;
        if (schedule.ArrivalTime.HasValue)
        {
            ArrivalDate = schedule.ArrivalTime.Value.Date;
            ArrivalTimeSpan = schedule.ArrivalTime.Value.TimeOfDay;
        }
        
        // Load bus and route segment
        SelectedBus = Buses.FirstOrDefault(b => b.Id == schedule.BusId);
        SelectedRouteSegment = RouteSegments.FirstOrDefault(rs => rs.Id == schedule.RouteSegmentId);
        
        IsEditMode = true;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task SaveScheduleAsync()
    {
        if (SelectedBus == null || SelectedRouteSegment == null)
        {
            ErrorMessage = "Please select bus and route segment";
            return;
        }

        // Combine date and time for departure
        var departure = DepartureDate ?? DateTime.Now.Date;
        if (DepartureTimeSpan.HasValue)
        {
            departure = departure.Date + DepartureTimeSpan.Value;
        }

        DateTime? arrival = null;
        if (ArrivalDate.HasValue)
        {
            arrival = ArrivalDate.Value.Date;
            if (ArrivalTimeSpan.HasValue)
            {
                arrival = arrival.Value.Date + ArrivalTimeSpan.Value;
            }
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            if (SelectedSchedule == null)
            {
                // Create new
                var newSchedule = new ScheduleCreate
                {
                    BusId = SelectedBus.Id,
                    RouteSegmentId = SelectedRouteSegment.Id,
                    DepartureTime = departure,
                    ArrivalTime = arrival
                };
                await _scheduleService.CreateScheduleAsync(newSchedule);
            }
            else
            {
                // Update existing
                var update = new ScheduleUpdate
                {
                    DepartureTime = departure,
                    ArrivalTime = arrival
                };
                await _scheduleService.UpdateScheduleAsync(SelectedSchedule.Id, update);
            }

            IsEditMode = false;
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error saving schedule: {ex.Message}";
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
        SelectedSchedule = null;
        ErrorMessage = string.Empty;
    }

    [RelayCommand]
    private async Task DeleteScheduleAsync(Schedule schedule)
    {
        IsLoading = true;
        try
        {
            await _scheduleService.DeleteScheduleAsync(schedule.Id);
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error deleting schedule: {ex.Message}";
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

