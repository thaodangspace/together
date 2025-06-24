-- Create indexes for better query performance

-- Index for queue ordering
CREATE INDEX idx_queue_position ON queue(position);

-- Index for messages ordering
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Index for user lookups
CREATE INDEX idx_users_online ON users(is_online);

-- Index for queue by user
CREATE INDEX idx_queue_added_by ON queue(added_by); 