using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class DashboardViewModel : ViewModelBase
{
    private BusService _busService;
    private RouteService _routeService;
    private TicketService _ticketService;
    private ScheduleService _scheduleService;
    private UserService _userService;

    [ObservableProperty]
    private bool _isLoading = true;

    [ObservableProperty]
    private int _totalBuses;

    [ObservableProperty]
    private int _totalRoutes;

    [ObservableProperty]
    private int _totalTickets;

    [ObservableProperty]
    private int _totalSchedules;

    [ObservableProperty]
    private ObservableCollection<Ticket> _recentTickets = new();

    [ObservableProperty]
    private UserInfo? _currentUser;

    public DashboardViewModel()
    {
        var token = TokenStorage.AccessToken;
        _busService = new BusService(token);
        _routeService = new RouteService(token);
        _ticketService = new TicketService(token);
        _scheduleService = new ScheduleService(token);
        _userService = new UserService(token);

        LoadDataAsync().ConfigureAwait(false);
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var token = TokenStorage.AccessToken;
            _busService = new BusService(token);
            _routeService = new RouteService(token);
            _ticketService = new TicketService(token);
            _scheduleService = new ScheduleService(token);
            _userService = new UserService(token);

            // Load user info
            CurrentUser = await _userService.GetCurrentUserAsync();

            // Load statistics
            var buses = await _busService.GetAllBusesAsync();
            TotalBuses = buses.Count;

            var routes = await _routeService.GetAllRoutesAsync();
            TotalRoutes = routes.Count;

            var tickets = await _ticketService.GetAllTicketsAsync();
            TotalTickets = tickets.Count;
            RecentTickets = new ObservableCollection<Ticket>(tickets.Take(5));

            var schedules = await _scheduleService.GetAllSchedulesAsync();
            TotalSchedules = schedules.Count;
        }
        catch (Exception ex)
        {
            // Handle error - could show a message
            System.Diagnostics.Debug.WriteLine($"Error loading dashboard: {ex.Message}");
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

