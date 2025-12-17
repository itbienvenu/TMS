using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace CompanyDashboard.Views;

public partial class TrackingView : UserControl
{
    public TrackingView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}
