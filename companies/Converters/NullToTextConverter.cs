using System;
using System.Globalization;
using Avalonia.Data.Converters;

namespace CompanyDashboard.Converters;

public class NullToTextConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var paramStr = parameter as string;
        if (string.IsNullOrEmpty(paramStr))
            return value == null ? "Null" : "Not Null";

        var parts = paramStr.Split(':');
        if (parts.Length != 2)
            return value == null ? paramStr : paramStr;

        // format: "NotNullText:NullText"
        // If value is NOT null, use first part. If value IS null, use second part.
        return value != null ? parts[0] : parts[1];
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
