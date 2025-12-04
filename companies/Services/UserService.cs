using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class UserService : ApiService
{
    public UserService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<UserInfo> GetCurrentUserAsync()
    {
        return await GetAsync<UserInfo>("me") ?? throw new Exception("Failed to get user info");
    }

    public async Task<List<CompanyUser>> GetCompanyUsersAsync()
    {
        return await GetListAsync<CompanyUser>("users");
    }
}

