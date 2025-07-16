-- Таблица должностей
IF OBJECT_ID(N'Positions', N'U') IS NULL
BEGIN
    CREATE TABLE Positions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE
    );
END

-- Таблица кураторов
IF OBJECT_ID(N'Curators', N'U') IS NULL
BEGIN
    CREATE TABLE Curators (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE
    );
END

-- Таблица организаций
IF OBJECT_ID(N'Organizations', N'U') IS NULL
BEGIN
    CREATE TABLE Organizations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL UNIQUE,
        CreatedBy INT NULL
    );
END

-- Таблица пользователей
IF OBJECT_ID(N'Users', N'U') IS NULL
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        Password NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'user',
        FirstLogin BIT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        Position NVARCHAR(100) NULL,
        Phone NVARCHAR(20) NULL,
        LastPasswordChange DATETIME NULL
    );
END

-- Таблица записей доступа
IF OBJECT_ID(N'Records', N'U') IS NULL
BEGIN
    CREATE TABLE Records (
        RecordId INT IDENTITY(1,1) PRIMARY KEY,
        UserFullName NVARCHAR(255) NOT NULL,
        Position NVARCHAR(255) NULL,
        Email NVARCHAR(255) NULL,
        Phone NVARCHAR(20) NULL,
        OrganizationName NVARCHAR(255) NULL,
        ExternalUserName NVARCHAR(255) NULL,
        ExternalUserPosition NVARCHAR(255) NULL,
        ExternalUserEmail NVARCHAR(255) NULL,
        ExternalUserPhone NVARCHAR(20) NULL,
        ObjectName NVARCHAR(255) NOT NULL,
        WorkTypes NVARCHAR(MAX) NULL,
        AccessType NVARCHAR(50) NOT NULL,
        AccessStartDate DATETIME NOT NULL,
        AccessEndDate DATETIME NULL,
        ActualConnectionDate DATETIME NULL,
        ActualDisconnectionDate DATETIME NULL,
        Curator NVARCHAR(255) NULL,
        Executor NVARCHAR(255) NULL,
        Notes NVARCHAR(MAX) NULL
    );
END

-- Таблица внешних подключений
IF OBJECT_ID(N'ExternalConnections', N'U') IS NULL
BEGIN
    CREATE TABLE ExternalConnections (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Organization NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        Position NVARCHAR(255) NULL,
        Email NVARCHAR(255) NULL,
        Phone NVARCHAR(50) NULL,
        AccessStart DATETIME NOT NULL,
        AccessEnd DATETIME NULL
    );
END 