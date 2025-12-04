using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CompanyDashboard.ViewModels;

namespace CompanyDashboard.Views;

public partial class DashboardView : UserControl
{
    public DashboardView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}

