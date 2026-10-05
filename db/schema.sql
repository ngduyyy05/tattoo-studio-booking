-- Inkline Studio: Microsoft SQL Server schema (đề cương mục 7).
-- Chạy được nhiều lần: chỉ tạo bảng còn thiếu. Ứng dụng tự chạy file này khi khởi động;
-- cũng có thể mở bằng SSMS / Azure Data Studio để xem hoặc tạo database thủ công.
-- Mỗi khối ngăn cách bằng dòng GO.

IF OBJECT_ID(N'dbo.Studios', N'U') IS NULL
CREATE TABLE dbo.Studios (
  Id          INT            NOT NULL CONSTRAINT PK_Studios PRIMARY KEY,
  Name        NVARCHAR(200)  NOT NULL,
  Logo        NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_Studios_Logo DEFAULT N'',
  Address     NVARCHAR(300)  NOT NULL,
  Phone       NVARCHAR(50)   NOT NULL,
  Email       NVARCHAR(200)  NOT NULL,
  Social      NVARCHAR(2048) NOT NULL CONSTRAINT DF_Studios_Social DEFAULT N'',
  Hours       NVARCHAR(500)  NOT NULL CONSTRAINT DF_Studios_Hours DEFAULT N'',
  HeroTitle   NVARCHAR(300)  NOT NULL,
  HeroText    NVARCHAR(2000) NOT NULL CONSTRAINT DF_Studios_HeroText DEFAULT N'',
  About       NVARCHAR(2000) NOT NULL CONSTRAINT DF_Studios_About DEFAULT N'',
  Policy      NVARCHAR(2000) NOT NULL,
  OpenTime    CHAR(5)        NOT NULL,
  CloseTime   CHAR(5)        NOT NULL,
  SlotStep    INT            NOT NULL,
  OpenDays    VARCHAR(20)    NOT NULL -- ví dụ '0,2,3,4,5,6' (0 = Chủ nhật)
);
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users (
  Id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
  Username     NVARCHAR(50)  NOT NULL CONSTRAINT UQ_Users_Username UNIQUE,
  Salt         CHAR(32)      NOT NULL,
  PasswordHash CHAR(128)     NOT NULL, -- scrypt, 64 byte hex
  Role         NVARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'admin',
  CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.Sessions', N'U') IS NULL
CREATE TABLE dbo.Sessions (
  Token     CHAR(64) NOT NULL CONSTRAINT PK_Sessions PRIMARY KEY,
  UserId    INT      NOT NULL CONSTRAINT FK_Sessions_Users REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  ExpiresAt BIGINT   NOT NULL -- epoch milliseconds
);
GO

IF OBJECT_ID(N'dbo.TattooStyles', N'U') IS NULL
CREATE TABLE dbo.TattooStyles (
  Seq         INT IDENTITY(1,1) NOT NULL,
  Id          NVARCHAR(80)   NOT NULL CONSTRAINT PK_TattooStyles PRIMARY KEY,
  Name        NVARCHAR(200)  NOT NULL,
  Description NVARCHAR(2000) NOT NULL CONSTRAINT DF_TattooStyles_Description DEFAULT N''
);
GO

IF OBJECT_ID(N'dbo.Artists', N'U') IS NULL
CREATE TABLE dbo.Artists (
  Seq       INT IDENTITY(1,1) NOT NULL,
  Id        NVARCHAR(80)   NOT NULL CONSTRAINT PK_Artists PRIMARY KEY,
  StudioId  INT            NOT NULL CONSTRAINT DF_Artists_StudioId DEFAULT 1 CONSTRAINT FK_Artists_Studios REFERENCES dbo.Studios(Id),
  Name      NVARCHAR(200)  NOT NULL,
  Specialty NVARCHAR(200)  NOT NULL,
  Years     INT            NOT NULL CONSTRAINT CK_Artists_Years CHECK (Years BETWEEN 0 AND 80),
  Bio       NVARCHAR(2000) NOT NULL CONSTRAINT DF_Artists_Bio DEFAULT N'',
  Image     NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_Artists_Image DEFAULT N'',
  WorkDays  VARCHAR(20)    NOT NULL, -- '0,1,2,3,4,5,6'
  DaysOff   NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_Artists_DaysOff DEFAULT N'', -- 'YYYY-MM-DD,YYYY-MM-DD'
  Visible   BIT            NOT NULL CONSTRAINT DF_Artists_Visible DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.ArtistStyles', N'U') IS NULL
CREATE TABLE dbo.ArtistStyles (
  ArtistId NVARCHAR(80) NOT NULL CONSTRAINT FK_ArtistStyles_Artists REFERENCES dbo.Artists(Id) ON DELETE CASCADE,
  StyleId  NVARCHAR(80) NOT NULL CONSTRAINT FK_ArtistStyles_Styles REFERENCES dbo.TattooStyles(Id),
  Position INT          NOT NULL CONSTRAINT DF_ArtistStyles_Position DEFAULT 0,
  CONSTRAINT PK_ArtistStyles PRIMARY KEY (ArtistId, StyleId)
);
GO

IF OBJECT_ID(N'dbo.PortfolioItems', N'U') IS NULL
CREATE TABLE dbo.PortfolioItems (
  Seq         INT IDENTITY(1,1) NOT NULL,
  Id          NVARCHAR(80)   NOT NULL CONSTRAINT PK_PortfolioItems PRIMARY KEY,
  ArtistId    NVARCHAR(80)   NOT NULL CONSTRAINT FK_PortfolioItems_Artists REFERENCES dbo.Artists(Id),
  StyleId     NVARCHAR(80)   NOT NULL CONSTRAINT FK_PortfolioItems_Styles REFERENCES dbo.TattooStyles(Id),
  Title       NVARCHAR(200)  NOT NULL,
  Placement   NVARCHAR(200)  NOT NULL,
  Image       NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_PortfolioItems_Image DEFAULT N'',
  Description NVARCHAR(2000) NOT NULL CONSTRAINT DF_PortfolioItems_Description DEFAULT N'',
  Gradient    NVARCHAR(200)  NOT NULL CONSTRAINT DF_PortfolioItems_Gradient DEFAULT N'',
  Visible     BIT            NOT NULL CONSTRAINT DF_PortfolioItems_Visible DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.Services', N'U') IS NULL
CREATE TABLE dbo.Services (
  Seq         INT IDENTITY(1,1) NOT NULL,
  Id          NVARCHAR(80)   NOT NULL CONSTRAINT PK_Services PRIMARY KEY,
  StudioId    INT            NOT NULL CONSTRAINT DF_Services_StudioId DEFAULT 1 CONSTRAINT FK_Services_Studios REFERENCES dbo.Studios(Id),
  Name        NVARCHAR(200)  NOT NULL,
  Price       NVARCHAR(200)  NOT NULL,
  Description NVARCHAR(2000) NOT NULL CONSTRAINT DF_Services_Description DEFAULT N'',
  Duration    INT            NOT NULL CONSTRAINT CK_Services_Duration CHECK (Duration BETWEEN 15 AND 600),
  Visible     BIT            NOT NULL CONSTRAINT DF_Services_Visible DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.Bookings', N'U') IS NULL
CREATE TABLE dbo.Bookings (
  Id           NVARCHAR(80)   NOT NULL CONSTRAINT PK_Bookings PRIMARY KEY,
  ArtistId     NVARCHAR(80)   NOT NULL CONSTRAINT FK_Bookings_Artists REFERENCES dbo.Artists(Id),
  ServiceId    NVARCHAR(80)   NOT NULL CONSTRAINT FK_Bookings_Services REFERENCES dbo.Services(Id),
  CustomerName NVARCHAR(200)  NOT NULL,
  Phone        NVARCHAR(50)   NOT NULL,
  Email        NVARCHAR(200)  NOT NULL CONSTRAINT DF_Bookings_Email DEFAULT N'',
  BookingDate  DATE           NOT NULL,
  StartTime    CHAR(5)        NOT NULL,
  Duration     INT            NOT NULL, -- phút, ghi lại lúc đặt/đổi lịch
  Placement    NVARCHAR(200)  NOT NULL,
  Size         NVARCHAR(200)  NOT NULL CONSTRAINT DF_Bookings_Size DEFAULT N'',
  Notes        NVARCHAR(2000) NOT NULL,
  Reference    NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_Bookings_Reference DEFAULT N'',
  Status       NVARCHAR(20)   NOT NULL CONSTRAINT CK_Bookings_Status CHECK (Status IN (N'Pending', N'Confirmed', N'Completed', N'Cancelled')),
  CreatedAt    DATETIME2      NOT NULL CONSTRAINT DF_Bookings_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Bookings_Artist_Date')
CREATE INDEX IX_Bookings_Artist_Date ON dbo.Bookings (ArtistId, BookingDate) INCLUDE (StartTime, Duration, Status);
GO

IF OBJECT_ID(N'dbo.BookingHistory', N'U') IS NULL
CREATE TABLE dbo.BookingHistory (
  Id        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingHistory PRIMARY KEY,
  BookingId NVARCHAR(80) NOT NULL CONSTRAINT FK_BookingHistory_Bookings REFERENCES dbo.Bookings(Id) ON DELETE CASCADE,
  Status    NVARCHAR(20) NULL,
  Action    NVARCHAR(20) NULL, -- 'reschedule' khi đổi lịch
  FromSlot  NVARCHAR(20) NULL,
  ToSlot    NVARCHAR(20) NULL,
  At        DATETIME2    NOT NULL
);
GO

IF OBJECT_ID(N'dbo.BlogPosts', N'U') IS NULL
CREATE TABLE dbo.BlogPosts (
  Seq     INT IDENTITY(1,1) NOT NULL,
  Id      NVARCHAR(80)   NOT NULL CONSTRAINT PK_BlogPosts PRIMARY KEY,
  Title   NVARCHAR(300)  NOT NULL,
  Tag     NVARCHAR(100)  NOT NULL,
  Excerpt NVARCHAR(500)  NOT NULL,
  Content NVARCHAR(MAX)  NOT NULL,
  Visible BIT            NOT NULL CONSTRAINT DF_BlogPosts_Visible DEFAULT 1
);
GO
