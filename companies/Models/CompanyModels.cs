using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CompanyDashboard.Models;

// Bus Models
public class Bus
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("plate_number")]
    public string PlateNumber { get; set; } = string.Empty;
    
    [JsonPropertyName("capacity")]
    public int Capacity { get; set; }
    
    [JsonPropertyName("available_seats")]
    public int AvailableSeats { get; set; }
    
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
    
    [JsonPropertyName("route_ids")]
    public List<string>? RouteIds { get; set; }
}

public class BusCreate
{
    [JsonPropertyName("plate_number")]
    public string PlateNumber { get; set; } = string.Empty;
    
    [JsonPropertyName("capacity")]
    public int Capacity { get; set; }
    
    [JsonPropertyName("route_ids")]
    public List<string> RouteIds { get; set; } = new();
}

public class BusUpdate
{
    [JsonPropertyName("plate_number")]
    public string? PlateNumber { get; set; }
    
    [JsonPropertyName("capacity")]
    public int? Capacity { get; set; }
    
    [JsonPropertyName("route_ids")]
    public List<string> RouteIds { get; set; } = new();
}

// Route Models
public class Route
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("origin")]
    public string? Origin { get; set; }
    
    [JsonPropertyName("destination")]
    public string? Destination { get; set; }
    
    [JsonPropertyName("price")]
    public double Price { get; set; }
    
    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
    
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}

public class RouteCreate
{
    [JsonPropertyName("origin_id")]
    public string OriginId { get; set; } = string.Empty;
    
    [JsonPropertyName("destination_id")]
    public string DestinationId { get; set; } = string.Empty;
    
    [JsonPropertyName("price")]
    public double Price { get; set; }
}

public class RouteUpdate
{
    [JsonPropertyName("origin")]
    public string? Origin { get; set; }
    
    [JsonPropertyName("destination")]
    public string? Destination { get; set; }
    
    [JsonPropertyName("price")]
    public double? Price { get; set; }
}

// Station Models
public class BusStation
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("location")]
    public string? Location { get; set; }
    
    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
    
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}

public class BusStationCreate
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("location")]
    public string? Location { get; set; }
}

// Schedule Models
public class Schedule
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("bus_id")]
    public string BusId { get; set; } = string.Empty;
    
    [JsonPropertyName("route_segment_id")]
    public string RouteSegmentId { get; set; } = string.Empty;
    
    [JsonPropertyName("departure_time")]
    public DateTime DepartureTime { get; set; }
    
    [JsonPropertyName("arrival_time")]
    public DateTime? ArrivalTime { get; set; }
    
    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
}

public class ScheduleCreate
{
    [JsonPropertyName("bus_id")]
    public string BusId { get; set; } = string.Empty;
    
    [JsonPropertyName("route_segment_id")]
    public string RouteSegmentId { get; set; } = string.Empty;
    
    [JsonPropertyName("departure_time")]
    public DateTime DepartureTime { get; set; }
    
    [JsonPropertyName("arrival_time")]
    public DateTime? ArrivalTime { get; set; }
}

public class ScheduleUpdate
{
    [JsonPropertyName("departure_time")]
    public DateTime DepartureTime { get; set; }
    
    [JsonPropertyName("arrival_time")]
    public DateTime? ArrivalTime { get; set; }
}

// Route Segment Models
public class RouteSegment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("route_id")]
    public string RouteId { get; set; } = string.Empty;
    
    [JsonPropertyName("start_station_id")]
    public string StartStationId { get; set; } = string.Empty;
    
    [JsonPropertyName("end_station_id")]
    public string EndStationId { get; set; } = string.Empty;
    
    [JsonPropertyName("price")]
    public double Price { get; set; }
    
    [JsonPropertyName("stop_order")]
    public int StopOrder { get; set; }
    
    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
}

public class RouteSegmentCreate
{
    [JsonPropertyName("route_id")]
    public string RouteId { get; set; } = string.Empty;
    
    [JsonPropertyName("start_station_id")]
    public string StartStationId { get; set; } = string.Empty;
    
    [JsonPropertyName("end_station_id")]
    public string EndStationId { get; set; } = string.Empty;
    
    [JsonPropertyName("price")]
    public double Price { get; set; }
    
    [JsonPropertyName("stop_order")]
    public int StopOrder { get; set; }
}

// Ticket Models
public class Ticket
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("user_id")]
    public string? UserId { get; set; }
    
    [JsonPropertyName("full_name")]
    public string? FullName { get; set; }
    
    [JsonPropertyName("qr_code")]
    public string QrCode { get; set; } = string.Empty;
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
    
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = string.Empty;
    
    [JsonPropertyName("route")]
    public Dictionary<string, object>? Route { get; set; }
    
    [JsonPropertyName("bus")]
    public string? Bus { get; set; }
}

// Payment Models
public class Payment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("ticket_id")]
    public string TicketId { get; set; } = string.Empty;
    
    [JsonPropertyName("user_id")]
    public string UserId { get; set; } = string.Empty;
    
    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;
    
    [JsonPropertyName("amount")]
    public double Amount { get; set; }
    
    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}

// Company User Models
public class CompanyUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    
    [JsonPropertyName("login_email")]
    public string? LoginEmail { get; set; }
    
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    
    [JsonPropertyName("role")]
    public string? Role { get; set; }
}

// User Info Model
public class UserInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    
    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
    
    [JsonPropertyName("role")]
    public string? Role { get; set; }
    
    [JsonPropertyName("roles")]
    public List<string>? Roles { get; set; }
    
    [JsonPropertyName("user_type")]
    public string UserType { get; set; } = string.Empty;
}

// Role & Permission Models
public class Permission
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class Role
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("permissions")]
    public List<Permission> Permissions { get; set; } = new();
}

public class RoleCreate
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class PermissionCreate
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class RolePermissionAssign
{
    [JsonPropertyName("role_id")]
    public string RoleId { get; set; } = string.Empty;

    [JsonPropertyName("permission_id")]
    public string PermissionId { get; set; } = string.Empty;
}

public class UserCreate
{
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("login_email")]
    public string? LoginEmail { get; set; }

    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("role_name")]
    public string RoleName { get; set; } = string.Empty;

    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }
}

