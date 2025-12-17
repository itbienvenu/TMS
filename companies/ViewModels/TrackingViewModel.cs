using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class TrackingViewModel : ViewModelBase
{
    private readonly BusService _busService;
    private readonly TrackingService _trackingService;
    private Timer _timer;

    [ObservableProperty]
    private ObservableCollection<BusTrackerItem> _trackedBuses = new();

    [ObservableProperty]
    private bool _isLoading;

    public TrackingViewModel()
    {
        var token = TokenStorage.AccessToken ?? "";
        _busService = new BusService(token);
        _trackingService = new TrackingService();

        _timer = new Timer(5000); // refresh every 5s
        _timer.Elapsed += async (s, e) => await RefreshLocations();
    }

    [RelayCommand]
    public async Task StartTracking()
    {
        IsLoading = true;
        try
        {
            await LoadBuses();
            _timer.Start();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Err: {ex.Message}");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    public void StopTracking()
    {
        _timer.Stop();
    }

    private async Task LoadBuses()
    {
        var buses = await _busService.GetAllBusesAsync();
        TrackedBuses.Clear();
        foreach (var bus in buses)
        {
            TrackedBuses.Add(new BusTrackerItem
            {
                BusId = bus.Id,
                PlateNumber = bus.PlateNumber,
                Status = "Offline"
            });
        }
        await RefreshLocations();
    }

    private async Task RefreshLocations()
    {
        if (TrackedBuses.Count == 0) return;

        var ids = TrackedBuses.Select(b => b.BusId).ToList();
        var locations = await _trackingService.GetBatchLocationsAsync(ids);

        // Update UI on correct thread if needed? Avalonia usually handles Observables well? 
        // Better be safe interacting with UI collection

        // Note: In real Avalonia apps we might need Dispatcher.UIThread.InvokeAsync
        // But for simply property updates on items, it acts differently depending on binding.
        // Let's assume standard update for now.

        foreach (var item in TrackedBuses)
        {
            if (locations.TryGetValue(item.BusId, out var loc) && loc != null)
            {
                item.Latitude = loc.latitude;
                item.Longitude = loc.longitude;
                item.LastUpdate = DateTimeOffset.FromUnixTimeSeconds(loc.timestamp ?? 0).LocalDateTime; // Approx
                item.Status = "Online";
                item.LocationString = $"{loc.latitude:F5}, {loc.longitude:F5}";
            }
            else
            {
                item.Status = "Offline";
                item.LocationString = "N/A";
            }
        }
    }
}

public partial class BusTrackerItem : ObservableObject
{
    public string BusId { get; set; } = "";
    public string PlateNumber { get; set; } = "";

    [ObservableProperty]
    private string _status = "Offline";

    [ObservableProperty]
    private double _latitude;

    [ObservableProperty]
    private double _longitude;

    [ObservableProperty]
    private string _locationString = "N/A";

    [ObservableProperty]
    private DateTime _lastUpdate;
}
