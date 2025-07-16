-- Добавление поля ObjectName в таблицу ExternalConnections
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExternalConnections' AND COLUMN_NAME = 'ObjectName')
BEGIN
    ALTER TABLE ExternalConnections ADD ObjectName NVARCHAR(255) NULL;
    PRINT 'Поле ObjectName добавлено в таблицу ExternalConnections';
END
ELSE
BEGIN
    PRINT 'Поле ObjectName уже существует в таблице ExternalConnections';
END 