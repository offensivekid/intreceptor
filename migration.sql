-- Миграция: Добавление поля is_pinned в таблицу threads
-- Запусти это один раз при первом деплое новой версии

-- Добавляем is_pinned если его нет
ALTER TABLE threads ADD COLUMN is_pinned BOOLEAN DEFAULT 0;

-- Создаем индекс для оптимизации
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(is_pinned, created_at DESC);
