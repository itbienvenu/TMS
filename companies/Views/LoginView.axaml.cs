using Avalonia.Controls;
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
        mainWindow.Show();
        this.Close();
    }
}

