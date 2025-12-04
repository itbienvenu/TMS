using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Models;

namespace CompanyDashboard.Views;

public partial class StationsView : UserControl
{
    public StationsView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private async void OnDeleteStation(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is StationsViewModel vm && sender is Button btn && btn.DataContext is BusStation station)
        {
            await vm.DeleteStationCommand.ExecuteAsync(station);
        }
    }
}

