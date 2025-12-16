[Setup]
AppName=Ticketing System Company Dashboard
AppVersion=1.0
DefaultDirName={autopf}\TicketingDashboard
DefaultGroupName=Ticketing System
OutputDir=Output
OutputBaseFilename=CompanyDashboardInstaller
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "dist\win-x64\CompanyDashboard.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\win-x64\*.dll"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Company Dashboard"; Filename: "{app}\CompanyDashboard.exe"
Name: "{commondesktop}\Company Dashboard"; Filename: "{app}\CompanyDashboard.exe"
