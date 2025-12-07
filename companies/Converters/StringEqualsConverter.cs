using System;
using System.Globalization;
using Avalonia.Data.Converters;

namespace CompanyDashboard.Converters
{
    public class StringEqualsConverter : IValueConverter
    {
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value == null || parameter == null)
                return false;
            
            return value.ToString()?.Trim().Equals(parameter.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase) == true;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    public class StringNotEqualsConverter : IValueConverter
    {
         public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value == null || parameter == null)
                return true;
            
            return value.ToString()?.Trim().Equals(parameter.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase) == false;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
