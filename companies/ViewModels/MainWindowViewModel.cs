using System;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Services;

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

    public MainWindowViewModel()
    {
        DashboardViewModel = new DashboardViewModel();
        BusesViewModel = new BusesViewModel();
        RoutesViewModel = new RoutesViewModel();
        StationsViewModel = new StationsViewModel();
        SchedulesViewModel = new SchedulesViewModel();
        TicketsViewModel = new TicketsViewModel();

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
    private void Logout()
    {
        TokenStorage.Clear();
        // Navigate back to login - this will be handled by the main window
        // The MainWindow will handle closing and showing LoginView
        LogoutRequested?.Invoke();
    }

    public event Action? LogoutRequested;
}
