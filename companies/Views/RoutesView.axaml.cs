using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Models;

namespace CompanyDashboard.Views;

public partial class RoutesView : UserControl
{
    public RoutesView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private void OnEditRoute(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is RoutesViewModel vm && sender is Button btn && btn.DataContext is Route route)
        {
            vm.EditRouteCommand.Execute(route);
        }
    }

    private async void OnDeleteRoute(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is RoutesViewModel vm && sender is Button btn && btn.DataContext is Route route)
        {
            await vm.DeleteRouteCommand.ExecuteAsync(route);
        }
    }

    private async void OnManageSegments(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is RoutesViewModel vm && sender is Button btn && btn.DataContext is Route route)
        {
            await vm.ManageSegmentsCommand.ExecuteAsync(route);
        }
    }

    private async void OnDeleteSegment(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
         if (DataContext is RoutesViewModel vm && sender is Button btn && btn.DataContext is RouteSegment segment)
         {
             await vm.DeleteSegmentCommand.ExecuteAsync(segment);
         }
    }
}

