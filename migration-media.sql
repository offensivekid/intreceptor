-- Миграция: Добавление поддержки медиа файлов

-- Создаем таблицу для медиа файлов
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  thread_id INTEGER,
  reply_id INTEGER,
  uploaded_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_id) REFERENCES replies(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_thread ON attachments(thread_id);
CREATE INDEX idx_attachments_reply ON attachments(reply_id);

-- Добавляем поле для Markdown в треды (если нужно отдельно хранить)
-- ALTER TABLE threads ADD COLUMN has_attachments BOOLEAN DEFAULT 0;
-- ALTER TABLE replies ADD COLUMN has_attachments BOOLEAN DEFAULT 0;
