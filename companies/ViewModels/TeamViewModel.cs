using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CompanyDashboard.Models;
using CompanyDashboard.Services;

namespace CompanyDashboard.ViewModels;

public partial class TeamViewModel : ViewModelBase
{
    private readonly CompanyService _companyService;
    private readonly RoleService _roleService;
    private readonly PermissionService _permissionService;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    // --- Collections ---
    [ObservableProperty]
    private ObservableCollection<CompanyUser> _users = new();

    [ObservableProperty]
    private ObservableCollection<Role> _roles = new();

    [ObservableProperty]
    private ObservableCollection<Permission> _availablePermissions = new();

    // --- Selections ---
    [ObservableProperty]
    private Role? _selectedRole;

    [ObservableProperty]
    private Permission? _selectedPermissionToAdd; // For dropdown

    // --- User Creation Form ---
    [ObservableProperty]
    private string _newUserFullName = string.Empty;
    [ObservableProperty]
    private string _newUserEmail = string.Empty;
    [ObservableProperty]
    private string _newUserLoginEmail = string.Empty;
    [ObservableProperty]
    private string _newUserPhone = string.Empty;
    [ObservableProperty]
    private string _newUserPassword = string.Empty;
    [ObservableProperty]
    private Role? _selectedRoleForNewUser;

    // --- Role Creation Form ---
    [ObservableProperty]
    private string _newRoleName = string.Empty;

    // --- UI State ---
    [ObservableProperty]
    private bool _showUserForm;

    [ObservableProperty]
    private bool _showRoleForm;

    // --- Drivers Collection ---
    [ObservableProperty]
    private ObservableCollection<Driver> _drivers = new();
    
    // --- Driver Creation Form ---
    [ObservableProperty]
    private string _newDriverName = string.Empty;
    [ObservableProperty]
    private string _newDriverEmail = string.Empty;
    [ObservableProperty]
    private string _newDriverPhone = string.Empty;
    [ObservableProperty]
    private string _newDriverLicense = string.Empty;
    [ObservableProperty]
    private string _newDriverPassword = string.Empty;
    
    [ObservableProperty]
    private string _driverErrorMessage = string.Empty;

    private readonly DriverService _driverService;

    public TeamViewModel()
    {
        var token = TokenStorage.AccessToken;
        _companyService = new CompanyService(token);
        _roleService = new RoleService(token);
        _permissionService = new PermissionService(token);
        _driverService = new DriverService(token);

        IsLoading = true;
        LoadDataAsync().ConfigureAwait(false);
    }
    
    // Update LoadDataAsync to include drivers
    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var userTask = _companyService.GetCompanyUsersAsync();
            var roleTask = _roleService.GetAllRolesAsync();
            var permTask = _permissionService.GetAllPermissionsAsync();
            var driverTask = _driverService.GetAllDriversAsync();

            await Task.WhenAll(userTask, roleTask, permTask, driverTask);

            Users = new ObservableCollection<CompanyUser>(await userTask);
            Roles = new ObservableCollection<Role>(await roleTask);
            AvailablePermissions = new ObservableCollection<Permission>(await permTask);
            Drivers = new ObservableCollection<Driver>(await driverTask);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error loading data: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task LoadDriversAsync()
    {
        IsLoading = true;
        try 
        {
            Drivers = new ObservableCollection<Driver>(await _driverService.GetAllDriversAsync());
        }
        catch (Exception ex)
        {
             DriverErrorMessage = $"Error loading drivers: {ex.Message}";
        }
        finally 
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CreateDriverAsync()
    {
        if (string.IsNullOrWhiteSpace(NewDriverName) || string.IsNullOrWhiteSpace(NewDriverEmail) || 
            string.IsNullOrWhiteSpace(NewDriverPassword) || string.IsNullOrWhiteSpace(NewDriverLicense))
        {
            DriverErrorMessage = "Please fill in all required fields (Name, Email, Password, License).";
            return;
        }

        IsLoading = true;
        try
        {
            var newDriver = new DriverCreate
            {
                FullName = NewDriverName,
                Email = NewDriverEmail,
                PhoneNumber = NewDriverPhone,
                LicenseNumber = NewDriverLicense,
                Password = NewDriverPassword
            };

            await _driverService.CreateDriverAsync(newDriver);
            
            // Reset form
            NewDriverName = "";
            NewDriverEmail = "";
            NewDriverPhone = "";
            NewDriverLicense = "";
            NewDriverPassword = "";
            DriverErrorMessage = "Driver created successfully.";

            // Refresh list
            await LoadDriversAsync();
        }
        catch (Exception ex)
        {
            DriverErrorMessage = $"Failed to create driver: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteDriverAsync(Driver driver)
    {
        IsLoading = true;
        try
        {
            await _driverService.DeleteDriverAsync(driver.Id);
            Drivers.Remove(driver);
        }
        catch (Exception ex)
        {
            DriverErrorMessage = $"Failed to delete driver: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void ToggleUserForm()
    {
        ShowUserForm = !ShowUserForm;
        ShowRoleForm = false;
        ErrorMessage = "";
    }

    [RelayCommand]
    private void ToggleRoleForm()
    {
        ShowRoleForm = !ShowRoleForm;
        ShowUserForm = false;
        ErrorMessage = "";
    }

    [RelayCommand]
    private async Task CreateUserAsync()
    {
        if (string.IsNullOrWhiteSpace(NewUserFullName) || string.IsNullOrWhiteSpace(NewUserEmail) || 
            string.IsNullOrWhiteSpace(NewUserPassword) || SelectedRoleForNewUser == null)
        {
            ErrorMessage = "Please fill in all required fields (Name, Email, Password, Role).";
            return;
        }

        IsLoading = true;
        try
        {
            var newUser = new UserCreate
            {
                FullName = NewUserFullName,
                Email = NewUserEmail,
                LoginEmail = string.IsNullOrWhiteSpace(NewUserLoginEmail) ? NewUserEmail : NewUserLoginEmail,
                PhoneNumber = NewUserPhone,
                Password = NewUserPassword,
                RoleName = SelectedRoleForNewUser.Name
            };

            await _companyService.CreateCompanyUserAsync(newUser);
            
            // Reset form
            NewUserFullName = "";
            NewUserEmail = "";
            NewUserLoginEmail = "";
            NewUserPhone = "";
            NewUserPassword = "";
            SelectedRoleForNewUser = null;
            ShowUserForm = false;

            // Refresh list
            Users = new ObservableCollection<CompanyUser>(await _companyService.GetCompanyUsersAsync());
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to create user: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void CreateNewRoleMode()
    {
        SelectedRole = null;
        ErrorMessage = "";
        NewRoleName = "";
    }

    [RelayCommand]
    private async Task CreateRoleAsync()
    {
        if (string.IsNullOrWhiteSpace(NewRoleName))
        {
            ErrorMessage = "Please enter role name.";
            return;
        }

        IsLoading = true;
        try
        {
            var newRole = new RoleCreate { Name = NewRoleName };
            await _roleService.CreateRoleAsync(newRole);
            
            NewRoleName = "";
            ShowRoleForm = false; // Legacy flag, harmless

            // Refresh roles
            Roles = new ObservableCollection<Role>(await _roleService.GetAllRolesAsync());
            
            // Should we select the new role? Maybe not, keep them in create mode or let them select it.
            // Let's keep them in create mode so they can create another one, or they can click the new role to edit.
            ErrorMessage = "Role created successfully.";
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to create role: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteRoleAsync(Role role)
    {
        IsLoading = true;
        try
        {
            await _roleService.DeleteRoleAsync(role.Id);
             Roles.Remove(role);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to delete role: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AssignPermissionAsync()
    {
        if (SelectedRole == null || SelectedPermissionToAdd == null)
            return;

        IsLoading = true;
        try
        {
            var assign = new RolePermissionAssign
            {
                RoleId = SelectedRole.Id,
                PermissionId = SelectedPermissionToAdd.Id
            };
            await _permissionService.AssignPermissionAsync(assign);

            // Refresh roles to update the permissions list in UI
            // Ideally we just add to the local list, but a refresh ensures consistency
            var updatedRoles = await _roleService.GetAllRolesAsync();
            Roles = new ObservableCollection<Role>(updatedRoles);
            
            // Reselect the role
            SelectedRole = Roles.FirstOrDefault(r => r.Id == assign.RoleId);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to assign permission: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }
    
    [RelayCommand]
    private async Task RefreshAsync() {
        await LoadDataAsync();
    }
}
