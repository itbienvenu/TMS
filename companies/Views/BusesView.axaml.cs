using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Models;

namespace CompanyDashboard.Views;

public partial class BusesView : UserControl
{
    public BusesView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private void OnEditBus(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is BusesViewModel vm && sender is Button btn && btn.DataContext is Bus bus)
        {
            vm.EditBusCommand.Execute(bus);
        }
    }

    private async void OnDeleteBus(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is BusesViewModel vm && sender is Button btn && btn.DataContext is Bus bus)
        {
            await vm.DeleteBusCommand.ExecuteAsync(bus);
        }
    }
}

