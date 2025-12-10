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
    
    public async Task<List<Company>> GetAllCompaniesAsync()
    {
        return await GetListAsync<Company>("companies/");
    }
    
    public async Task<Company> GetCompanyAsync(string id)
    {
        return await GetAsync<Company>($"companies/{id}");
    }
    
    public async Task CreateCompanyAsync(CompanyCreate company)
    {
        await PostAsync<object>("companies/create_company", company);
    }
    
    public async Task DeleteCompanyAsync(string id)
    {
        await DeleteAsync($"companies/{id}");
    }

    public async Task<CompanyUser> GetMyInfoAsync()
    {
        return await GetAsync<CompanyUser>("companies/me");
    }
}
