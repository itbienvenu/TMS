using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Models;

namespace CompanyDashboard.Views;

public partial class TicketsView : UserControl
{
    public TicketsView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private async void OnMarkPaid(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is TicketsViewModel vm && sender is Button btn && btn.DataContext is Ticket ticket)
        {
            vm.SelectedTicket = ticket;
            await vm.UpdateTicketStatusAsync("paid");
        }
    }

    private async void OnMarkCancelled(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is TicketsViewModel vm && sender is Button btn && btn.DataContext is Ticket ticket)
        {
            vm.SelectedTicket = ticket;
            await vm.UpdateTicketStatusAsync("cancelled");
        }
    }

    private async void OnDelete(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        if (DataContext is TicketsViewModel vm && sender is Button btn && btn.DataContext is Ticket ticket)
        {
            vm.SelectedTicket = ticket;
            await vm.DeleteTicketCommand.ExecuteAsync(ticket);
        }
    }
}

