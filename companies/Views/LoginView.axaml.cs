using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using CompanyDashboard.ViewModels;

namespace CompanyDashboard.Views;

public partial class LoginView : Window
{
    public LoginView()
    {
        InitializeComponent();
        var viewModel = new LoginViewModel();
        viewModel.NavigateToMainWindow += OnNavigateToMainWindow;
        DataContext = viewModel;
    }

    private void OnNavigateToMainWindow()
    {
        var mainWindow = new MainWindow();
        
        if (Application.Current?.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            desktop.MainWindow = mainWindow;
        }
        
        mainWindow.Show();
        this.Close();
    }
}

