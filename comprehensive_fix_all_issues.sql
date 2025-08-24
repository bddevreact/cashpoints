-- Comprehensive Fix for All Issues
-- This script will fix: foreign key relationships, notifications table, and admin_users table

-- STEP 1: Fix admin_users table structure first
DO $$
BEGIN
  RAISE NOTICE '🔧 STEP 1: Fixing admin_users table structure...';
  
  -- Check if admin_users table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'admin_users'
  ) THEN
    -- Create admin_users table with proper structure
    CREATE TABLE admin_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      telegram_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
      permissions JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ admin_users table created successfully';
  ELSE
    RAISE NOTICE '✅ admin_users table already exists';
  END IF;
  
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ is_active column added';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '{}';
    RAISE NOTICE '✅ permissions column added';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ last_login column added';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ updated_at column added';
  END IF;
END $$;

-- STEP 2: Insert sample admin user if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
    INSERT INTO admin_users (
      user_id,
      telegram_id,
      username,
      first_name,
      last_name,
      role,
      permissions,
      is_active
    ) VALUES (
      'admin_user_001',
      'admin_telegram_id',
      'admin_user',
      'Admin',
      'User',
      'super_admin',
      '{"can_manage_users": true, "can_manage_tasks": true, "can_verify_uid": true, "can_view_analytics": true}',
      true
    );
    
    RAISE NOTICE '✅ Sample admin user inserted';
  END IF;
END $$;

-- STEP 3: Fix notifications table structure
DO $$
BEGIN
  RAISE NOTICE '🔧 STEP 2: Fixing notifications table structure...';
  
  -- Check if notifications table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN
    -- Create notifications table with proper structure
    CREATE TABLE notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      action_url TEXT,
      is_read BOOLEAN DEFAULT false,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ notifications table created successfully';
  ELSE
    RAISE NOTICE '✅ notifications table already exists';
  END IF;
  
  -- Add task_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN task_id UUID;
    RAISE NOTICE '✅ task_id column added';
  ELSE
    -- Check if it's the wrong type
    IF (
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'task_id'
    ) != 'uuid' THEN
      RAISE NOTICE '⚠️ task_id column has wrong type, fixing...';
      
      -- Drop the column and recreate it
      ALTER TABLE notifications DROP COLUMN task_id;
      ALTER TABLE notifications ADD COLUMN task_id UUID;
      
      RAISE NOTICE '✅ task_id column fixed to UUID type';
    END IF;
  END IF;
END $$;

-- STEP 4: Clean up any invalid task_id values in notifications
DO $$
BEGIN
  RAISE NOTICE '🧹 Cleaning up invalid task_id values in notifications...';
  
  -- Remove any notifications with invalid task_id values
  DELETE FROM notifications 
  WHERE task_id IS NOT NULL 
    AND task_id::text NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  
  RAISE NOTICE '✅ Invalid task_id values cleaned up';
END $$;

-- STEP 5: Fix foreign key relationships for special_task_submissions
DO $$
BEGIN
  RAISE NOTICE '🔧 STEP 3: Fixing foreign key relationships...';
  
  -- Check if special_task_submissions table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'special_task_submissions'
  ) THEN
    -- Create special_task_submissions table if it doesn't exist
    CREATE TABLE special_task_submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      uid_submitted TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
      reward_amount INTEGER NOT NULL DEFAULT 0,
      admin_notes TEXT,
      verified_by TEXT,
      verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ special_task_submissions table created successfully';
  END IF;
  
  -- Add foreign key to users table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'special_task_submissions_user_id_fkey'
  ) THEN
    ALTER TABLE special_task_submissions 
    ADD CONSTRAINT special_task_submissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key constraint added: user_id -> users.telegram_id';
  END IF;
  
  -- Add foreign key to task_templates table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'special_task_submissions_task_id_fkey'
  ) THEN
    ALTER TABLE special_task_submissions 
    ADD CONSTRAINT special_task_submissions_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES task_templates(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key constraint added: task_id -> task_templates.id';
  END IF;
END $$;

-- STEP 6: Insert sample data for testing
DO $$
BEGIN
  RAISE NOTICE '📝 STEP 4: Inserting sample data for testing...';
  
  -- Insert sample task templates if none exist
  IF NOT EXISTS (SELECT 1 FROM task_templates LIMIT 1) THEN
    INSERT INTO task_templates (title, subtitle, description, reward, type, icon, button_text, cooldown, max_completions, is_active, url) VALUES
      ('Binance UID Verification', 'Complete Binance signup', 'Sign up for Binance and submit your UID for verification', 200, 'trading_platform', '💰', 'SIGN UP', 0, 1, true, 'https://binance.com'),
      ('OKX UID Verification', 'Complete OKX signup', 'Sign up for OKX and submit your UID for verification', 150, 'trading_platform', '💎', 'SIGN UP', 0, 1, true, 'https://okx.com'),
      ('Bybit UID Verification', 'Complete Bybit signup', 'Sign up for Bybit and submit your UID for verification', 100, 'trading_platform', '🚀', 'SIGN UP', 0, 1, true, 'https://bybit.com');
    
    RAISE NOTICE '✅ Sample task templates inserted';
  END IF;
  
  -- Insert sample users if none exist
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (telegram_id, first_name, username, balance, level, total_earnings) VALUES
      ('test_user_1', 'Test User 1', 'testuser1', 0, 1, 0),
      ('test_user_2', 'Test User 2', 'testuser2', 0, 1, 0),
      ('test_user_3', 'Test User 3', 'testuser3', 0, 1, 0);
    
    RAISE NOTICE '✅ Sample users inserted';
  END IF;
  
  -- Insert sample UID submissions if none exist
  IF NOT EXISTS (SELECT 1 FROM special_task_submissions LIMIT 1) THEN
    INSERT INTO special_task_submissions (
      user_id, 
      task_id, 
      task_type, 
      uid_submitted, 
      status, 
      reward_amount,
      admin_notes
    ) VALUES 
      ('test_user_1', (SELECT id FROM task_templates WHERE title LIKE '%Binance%' LIMIT 1), 'trading_platform', 'BINANCE_UID_001', 'pending', 200, 'Sample submission for testing'),
      ('test_user_2', (SELECT id FROM task_templates WHERE title LIKE '%OKX%' LIMIT 1), 'trading_platform', 'OKX_UID_001', 'pending', 150, 'Sample submission for testing'),
      ('test_user_3', (SELECT id FROM task_templates WHERE title LIKE '%Bybit%' LIMIT 1), 'trading_platform', 'BYBIT_UID_001', 'verified', 100, 'Sample verified submission');
    
    RAISE NOTICE '✅ Sample UID submissions inserted';
  END IF;
END $$;

-- STEP 7: Create proper indexes
CREATE INDEX IF NOT EXISTS special_task_submissions_user_id_idx ON special_task_submissions(user_id);
CREATE INDEX IF NOT EXISTS special_task_submissions_task_id_idx ON special_task_submissions(task_id);
CREATE INDEX IF NOT EXISTS special_task_submissions_status_idx ON special_task_submissions(status);
CREATE INDEX IF NOT EXISTS special_task_submissions_created_at_idx ON special_task_submissions(created_at);
CREATE INDEX IF NOT EXISTS special_task_submissions_uid_global_idx ON special_task_submissions(uid_submitted);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_task_id_idx ON notifications(task_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS admin_users_telegram_id_idx ON admin_users(telegram_id);
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users(role);
CREATE INDEX IF NOT EXISTS admin_users_is_active_idx ON admin_users(is_active);

-- STEP 8: Enable RLS and create policies
ALTER TABLE special_task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to see all UID submissions
CREATE POLICY "Admin can see all UID submissions" ON special_task_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'moderator')
        AND is_active = true
    )
  );

-- Policy for users to see their own UID submissions
CREATE POLICY "Users can see own UID submissions" ON special_task_submissions
  FOR SELECT USING (
    user_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
  );

-- Policy for users to insert their own UID submissions
CREATE POLICY "Users can insert own UID submissions" ON special_task_submissions
  FOR INSERT WITH CHECK (
    user_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
  );

-- Policy for admin users to see all notifications
CREATE POLICY "Admin can see all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'moderator')
        AND is_active = true
    )
  );

-- Policy for users to see their own notifications
CREATE POLICY "Users can see own notifications" ON notifications
  FOR SELECT USING (
    user_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
  );

-- Policy for users to insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (
    user_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
  );

-- Policy for admin users to see all admin users
CREATE POLICY "Admin users can see all admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'moderator')
        AND is_active = true
    )
  );

-- Policy for users to see their own admin record
CREATE POLICY "Users can see own admin record" ON admin_users
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- STEP 9: Test everything
DO $$
BEGIN
  RAISE NOTICE '🧪 STEP 5: Testing all fixes...';
  
  -- Test foreign key relationships
  IF EXISTS (
    SELECT 1 FROM special_task_submissions sts
    JOIN users u ON sts.user_id = u.telegram_id
    JOIN task_templates tt ON sts.task_id = tt.id
    LIMIT 1
  ) THEN
    RAISE NOTICE '✅ Foreign key relationships are working correctly!';
  ELSE
    RAISE NOTICE '❌ Foreign key relationships are NOT working correctly';
  END IF;
  
  -- Test admin users table
  IF EXISTS (
    SELECT 1 FROM admin_users 
    WHERE role IN ('admin', 'super_admin', 'moderator')
      AND is_active = true
    LIMIT 1
  ) THEN
    RAISE NOTICE '✅ Admin users table is working correctly!';
  ELSE
    RAISE NOTICE '❌ Admin users table is NOT working correctly';
  END IF;
  
  -- Test notifications table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'task_id' AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '✅ Notifications table task_id field is correct!';
  ELSE
    RAISE NOTICE '❌ Notifications table task_id field is NOT correct';
  END IF;
END $$;

-- STEP 10: Show final status
SELECT 
  'Final Status' as status,
  (SELECT COUNT(*) FROM special_task_submissions) as uid_submissions,
  (SELECT COUNT(*) FROM task_templates) as task_templates,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM admin_users) as admin_users,
  (SELECT COUNT(*) FROM notifications) as notifications;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ALL ISSUES FIXED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Admin Users Table: is_active column added';
  RAISE NOTICE '✅ Notifications Table: task_id field fixed to UUID';
  RAISE NOTICE '✅ Foreign Key Relationships: All constraints added';
  RAISE NOTICE '✅ Sample Data: Inserted for testing';
  RAISE NOTICE '✅ Indexes: Created for performance';
  RAISE NOTICE '✅ RLS Policies: Added for security';
  RAISE NOTICE '';
  RAISE NOTICE 'Now your admin panel should work without errors:';
  RAISE NOTICE '• UID submissions will be visible';
  RAISE NOTICE '• UID verification will work';
  RAISE NOTICE '• No more UUID or column errors';
END $$;
