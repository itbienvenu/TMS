using Avalonia.Controls;
using CompanyDashboard.ViewModels;
using CompanyDashboard.Services;

namespace CompanyDashboard.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        
        // Check if user is authenticated
        if (!TokenStorage.IsAuthenticated)
        {
            var loginView = new LoginView();
            loginView.Show();
            this.Close();
            return;
        }
        
        var vm = new MainWindowViewModel();
        vm.LogoutRequested += OnLogoutRequested;
        DataContext = vm;
    }

    private void OnLogoutRequested()
    {
        var loginView = new LoginView();
        loginView.Show();
        this.Close();
    }
}