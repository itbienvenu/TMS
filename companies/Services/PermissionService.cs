using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class PermissionService : ApiService
{
    public PermissionService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Permission>> GetAllPermissionsAsync()
    {
        return await GetListAsync<Permission>("perm/get_permissions");
    }

    public async Task AssignPermissionAsync(RolePermissionAssign assignment)
    {
        // Response is {message, role}. We can just await the post and ignore return if success.
        await PostAsync<object>("perm/assign_permissions", assignment);
    }
}
