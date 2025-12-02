using Avalonia.Controls;
using CompanyDashboard.ViewModels;

namespace CompanyDashboard.Views;

public partial class LoginView : Window
{
    public LoginView()
    {
        InitializeComponent();
        DataContext = new LoginViewModel();
    }
}

