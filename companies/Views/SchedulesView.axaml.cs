using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Models;

namespace CompanyDashboard.Views;

public partial class SchedulesView : UserControl
{
    public SchedulesView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private async void OnRouteChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (DataContext is SchedulesViewModel vm && sender is ComboBox cb && cb.SelectedItem is Route route)
        {
            vm.SelectedRoute = route;
            await vm.RouteChangedCommand.ExecuteAsync(null);
        }
    }

    private void OnEditSchedule(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is SchedulesViewModel vm && sender is Button btn && btn.DataContext is Schedule schedule)
        {
            vm.EditScheduleCommand.Execute(schedule);
        }
    }

    private async void OnDeleteSchedule(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is SchedulesViewModel vm && sender is Button btn && btn.DataContext is Schedule schedule)
        {
            await vm.DeleteScheduleCommand.ExecuteAsync(schedule);
        }
    }
}

