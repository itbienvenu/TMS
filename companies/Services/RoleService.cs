using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CompanyDashboard.Models;

namespace CompanyDashboard.Services;

public class RoleService : ApiService
{
    public RoleService(string? token = null) : base()
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthToken(token);
    }

    public async Task<List<Role>> GetAllRolesAsync()
    {
        return await GetListAsync<Role>("roles/all_roles");
    }

    public async Task<Role> CreateRoleAsync(RoleCreate role)
    {
        // The API returns a wrapped response {"message":..., "role":...} or just the object?
        // Checking roles_router.py line 43: returns {"message": "...", "role": {...}}
        // My ApiService.PostAsync expects T.
        // If T is Role, and response is {message, role}, deserialization might fail or I need a wrapper.
        // Ideally I should update ApiService or use a wrapper class.
        // For simplicity, I'll use a dynamic or object and extract, OR create a response wrapper.
        // Let's creating a wrapper manually here or adjusting the API call.
        // Actually, let's create a generic wrapper class in Models if needed, but for now I'll assume I can parse it.
        // Wait, ApiService.PostAsync uses ReadFromJsonAsync<T>.
        
        // Let's define a specific response class inside this method or file for deserialization.
        var wrapper = await PostAsync<RoleResponseWrapper>("roles/create_role", role);
        return wrapper?.Role ?? throw new Exception("Failed to create role");
    }

    public async Task DeleteRoleAsync(string id)
    {
        await DeleteAsync($"roles/delete_role/{id}");
    }
}

public class RoleResponseWrapper
{
    [System.Text.Json.Serialization.JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("role")]
    public Role Role { get; set; } = new();
}
