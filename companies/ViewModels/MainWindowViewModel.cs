using System;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Services;
using CompanyDashboard.ViewModels;

namespace CompanyDashboard.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    [ObservableProperty]
    private ViewModelBase? _currentViewModel;

    [ObservableProperty]
    private string _currentPageTitle = "Dashboard";

    public DashboardViewModel DashboardViewModel { get; }
    public BusesViewModel BusesViewModel { get; }
    public RoutesViewModel RoutesViewModel { get; }
    public StationsViewModel StationsViewModel { get; }
    public SchedulesViewModel SchedulesViewModel { get; }
    public TicketsViewModel TicketsViewModel { get; }
    public ChatViewModel ChatViewModel { get; }
    public TrackingViewModel TrackingViewModel { get; }

    public MainWindowViewModel()
    {
        DashboardViewModel = new DashboardViewModel();
        BusesViewModel = new BusesViewModel();
        RoutesViewModel = new RoutesViewModel();
        StationsViewModel = new StationsViewModel();
        SchedulesViewModel = new SchedulesViewModel();
        TicketsViewModel = new TicketsViewModel();
        ChatViewModel = new ChatViewModel();
        TrackingViewModel = new TrackingViewModel();

        CurrentViewModel = DashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = DashboardViewModel;
        CurrentPageTitle = "Dashboard";
    }

    [RelayCommand]
    private void NavigateToBuses()
    {
        CurrentViewModel = BusesViewModel;
        CurrentPageTitle = "Buses";
    }

    [RelayCommand]
    private void NavigateToRoutes()
    {
        CurrentViewModel = RoutesViewModel;
        CurrentPageTitle = "Routes";
    }

    [RelayCommand]
    private void NavigateToStations()
    {
        CurrentViewModel = StationsViewModel;
        CurrentPageTitle = "Stations";
    }

    [RelayCommand]
    private void NavigateToSchedules()
    {
        CurrentViewModel = SchedulesViewModel;
        CurrentPageTitle = "Schedules";
    }

    [RelayCommand]
    private void NavigateToTickets()
    {
        CurrentViewModel = TicketsViewModel;
        CurrentPageTitle = "Tickets";
    }

    [RelayCommand]
    private void NavigateToTeam()
    {
        CurrentViewModel = new TeamViewModel(); // Re-create to ensure fresh data
        CurrentPageTitle = "Team";
    }

    [RelayCommand]
    private void NavigateToChat()
    {
        CurrentViewModel = ChatViewModel;
        CurrentPageTitle = "AI Assistant";
    }

    [RelayCommand]
    private void NavigateToTracking()
    {
        CurrentViewModel = TrackingViewModel;
        CurrentPageTitle = "Live Tracking";
    }

    [RelayCommand]
    private void Logout()
    {
        TokenStorage.Clear();
        LogoutRequested?.Invoke();
    }

    public event Action? LogoutRequested;
}
