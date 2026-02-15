#!/usr/bin/env node

/**
 * Скрипт для сброса пароля админа
 * Использование: node reset-admin-password.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const db = new Database(process.env.DB_PATH || './database.sqlite');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 СБРОС ПАРОЛЯ АДМИНА');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Получаем имя админа из .env
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  
  // Проверяем существует ли админ
  const admin = db.prepare('SELECT id, username, email, is_admin FROM users WHERE username = ?').get(adminUsername);
  
  if (!admin) {
    console.log(`❌ Админ с username "${adminUsername}" не найден в базе!`);
    console.log('');
    console.log('Возможные причины:');
    console.log('1. В .env указан другой ADMIN_USERNAME');
    console.log('2. База данных пустая или повреждена');
    console.log('3. Админ был удален');
    console.log('');
    
    const create = await question('Создать нового админа? (yes/no): ');
    
    if (create.toLowerCase() === 'yes' || create.toLowerCase() === 'y') {
      const newPassword = await question('Введи новый пароль (минимум 6 символов): ');
      
      if (newPassword.length < 6) {
        console.log('❌ Пароль слишком короткий!');
        rl.close();
        db.close();
        return;
      }
      
      const email = process.env.ADMIN_EMAIL || 'admin@offensive-forum.local';
      const hash = bcrypt.hashSync(newPassword, 12);
      
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, is_admin, has_private_access, created_at)
        VALUES (?, ?, ?, 1, 1, ?)
      `).run(adminUsername, email, hash, Date.now());
      
      console.log('');
      console.log('✅ Админ создан!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    }
    
    rl.close();
    db.close();
    return;
  }
  
  console.log(`✅ Найден админ: ${admin.username} (${admin.email})`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Админ: ${admin.is_admin ? 'Да' : 'Нет'}`);
  console.log('');
  
  const newPassword = await question('Введи НОВЫЙ пароль (минимум 6 символов): ');
  
  if (newPassword.length < 6) {
    console.log('❌ Пароль слишком короткий!');
    rl.close();
    db.close();
    return;
  }
  
  const hash = bcrypt.hashSync(newPassword, 12);
  
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ПАРОЛЬ ИЗМЕНЕН!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Username: ${admin.username}`);
  console.log(`   Новый пароль: ${newPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Теперь можешь войти с новым паролем!');
  console.log('');
  
  rl.close();
  db.close();
}

main().catch(err => {
  console.error('Ошибка:', err);
  rl.close();
  db.close();
  process.exit(1);
});
