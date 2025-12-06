using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class CompanyService : ApiService
{
    public CompanyService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<CompanyUser>> GetCompanyUsersAsync()
    {
        return await GetListAsync<CompanyUser>("companies/users");
    }

    public async Task CreateCompanyUserAsync(UserCreate user)
    {
        await PostAsync<object>("companies/company-user", user);
    }
}
