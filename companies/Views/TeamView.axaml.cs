using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace CompanyDashboard.Views;

public partial class TeamView : UserControl
{
    public TeamView()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}
