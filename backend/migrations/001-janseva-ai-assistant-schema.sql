-- JanSeva AI Assistant Database Schema
-- Migration: Create tables for voice assistant functionality

-- ============================================
-- USER LANGUAGE PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_language_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en-IN' CHECK (preferred_language IN ('en-IN', 'te-IN', 'ta-IN', 'kn-IN')),
    speech_language VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    tts_language VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    accessibility_enabled BOOLEAN DEFAULT FALSE,
    large_text_mode BOOLEAN DEFAULT FALSE,
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    screen_reader_enabled BOOLEAN DEFAULT FALSE,
    voice_only_mode BOOLEAN DEFAULT FALSE,
    consent_voice BOOLEAN DEFAULT FALSE,
    consent_location BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- VOICE CONVERSATION SESSION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_conversation_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    language VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    intent VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    device_type VARCHAR(50),
    platform VARCHAR(50),
    browser_info TEXT,
    ip_address VARCHAR(45),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_turns INTEGER DEFAULT 0,
    voice_input_count INTEGER DEFAULT 0,
    text_input_count INTEGER DEFAULT 0,
    voice_output_count INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    session_metadata JSONB,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VOICE CONVERSATION TURNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_conversation_turns (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES voice_conversation_sessions(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    user_input_type VARCHAR(20) CHECK (user_input_type IN ('voice', 'text', 'button')),
    user_input_raw TEXT,
    user_input_processed TEXT,
    user_input_language VARCHAR(10),
    speech_confidence DECIMAL(5, 3),
    detected_intent VARCHAR(50),
    intent_confidence DECIMAL(5, 3),
    assistant_response TEXT,
    response_language VARCHAR(10),
    response_type VARCHAR(20) CHECK (response_type IN ('text', 'voice', 'combined', 'action')),
    tts_generated BOOLEAN DEFAULT FALSE,
    tts_duration_ms INTEGER,
    user_action VARCHAR(100),
    ai_service_used VARCHAR(50),
    ai_processing_time_ms INTEGER,
    user_satisfaction SMALLINT CHECK (user_satisfaction >= -1 AND user_satisfaction <= 5),
    error_occurred BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    turn_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI ASSISTANT WORKFLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_assistant_workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN ('RAISE_COMPLAINT', 'TRACK_COMPLAINT', 'GOVERNMENT_UPDATES', 'EMERGENCY_HELP')),
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'abandoned', 'error')),
    language VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    session_id INTEGER REFERENCES voice_conversation_sessions(id) ON DELETE SET NULL,
    
    -- Raise Complaint specific fields
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    image_path TEXT,
    image_analysis_pending BOOLEAN DEFAULT FALSE,
    detected_department VARCHAR(100),
    detected_category VARCHAR(100),
    detected_severity VARCHAR(20),
    department_confidence DECIMAL(5, 3),
    category_confidence DECIMAL(5, 3),
    severity_confidence DECIMAL(5, 3),
    ai_suggestions JSONB,
    
    -- Track Complaint specific fields
    complaint_number_provided VARCHAR(20),
    complaint_number_voice_input BOOLEAN DEFAULT FALSE,
    
    -- Government Updates specific fields
    filter_state VARCHAR(100),
    filter_district VARCHAR(100),
    filter_department VARCHAR(100),
    
    -- Emergency Help specific fields
    emergency_type VARCHAR(50),
    
    workflow_metadata JSONB,
    completed_steps JSONB,
    current_step VARCHAR(100),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VOICE COMMAND LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_command_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES voice_conversation_sessions(id) ON DELETE CASCADE,
    command_type VARCHAR(50),
    command_raw_text TEXT,
    command_recognized_text TEXT,
    command_intent VARCHAR(50),
    confidence_score DECIMAL(5, 3),
    matched_action VARCHAR(100),
    action_executed BOOLEAN DEFAULT FALSE,
    action_result TEXT,
    execution_time_ms INTEGER,
    language_detected VARCHAR(10),
    speech_duration_ms INTEGER,
    audio_quality_score DECIMAL(5, 3),
    error_details TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI PREDICTION AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_prediction_audits (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES ai_assistant_workflows(id) ON DELETE SET NULL,
    prediction_type VARCHAR(50) CHECK (prediction_type IN ('department', 'category', 'severity', 'duplicate_detection')),
    input_data JSONB,
    predicted_value VARCHAR(255),
    confidence_score DECIMAL(5, 3),
    user_acceptance BOOLEAN,
    user_correction_provided VARCHAR(255),
    ai_model_version VARCHAR(50),
    processing_time_ms INTEGER,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DUPLICATE COMPLAINT DETECTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS duplicate_complaint_checks (
    id SERIAL PRIMARY KEY,
    new_complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    similar_complaint_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    image_similarity_scores DECIMAL(5, 3)[] DEFAULT ARRAY[]::DECIMAL(5, 3)[],
    description_similarity_scores DECIMAL(5, 3)[] DEFAULT ARRAY[]::DECIMAL(5, 3)[],
    location_proximity_scores DECIMAL(5, 3)[] DEFAULT ARRAY[]::DECIMAL(5, 3)[],
    duplicate_detected BOOLEAN DEFAULT FALSE,
    user_action VARCHAR(20) CHECK (user_action IN ('create_new', 'join_existing', 'pending')),
    selected_complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    check_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VOICE INTERACTION ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_interaction_analytics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES voice_conversation_sessions(id) ON DELETE CASCADE,
    metric_type VARCHAR(50),
    metric_value DECIMAL(10, 3),
    metric_unit VARCHAR(50),
    device_type VARCHAR(50),
    browser_type VARCHAR(50),
    success BOOLEAN,
    duration_ms INTEGER,
    error_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_user_language_preferences_user_id ON user_language_preferences(user_id);
CREATE INDEX idx_voice_sessions_user_id ON voice_conversation_sessions(user_id);
CREATE INDEX idx_voice_sessions_status ON voice_conversation_sessions(status);
CREATE INDEX idx_voice_sessions_created_at ON voice_conversation_sessions(created_at);
CREATE INDEX idx_voice_turns_session_id ON voice_conversation_turns(session_id);
CREATE INDEX idx_ai_workflows_user_id ON ai_assistant_workflows(user_id);
CREATE INDEX idx_ai_workflows_type_status ON ai_assistant_workflows(workflow_type, status);
CREATE INDEX idx_ai_workflows_complaint_id ON ai_assistant_workflows(complaint_id);
CREATE INDEX idx_voice_command_logs_session_id ON voice_command_logs(session_id);
CREATE INDEX idx_ai_prediction_audits_workflow_id ON ai_prediction_audits(workflow_id);
CREATE INDEX idx_duplicate_checks_complaint_id ON duplicate_complaint_checks(new_complaint_id);
CREATE INDEX idx_voice_analytics_session_id ON voice_interaction_analytics(session_id);
CREATE INDEX idx_voice_analytics_created_at ON voice_interaction_analytics(created_at);

-- ============================================
-- CONSTRAINTS AND TRIGGERS
-- ============================================
-- Update updated_at timestamp on user_language_preferences
CREATE OR REPLACE FUNCTION update_user_language_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_language_preferences_timestamp
BEFORE UPDATE ON user_language_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_language_preferences_timestamp();

-- Update updated_at timestamp on voice_conversation_sessions
CREATE OR REPLACE FUNCTION update_voice_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voice_sessions_timestamp
BEFORE UPDATE ON voice_conversation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_voice_sessions_timestamp();

-- Update updated_at timestamp on ai_assistant_workflows
CREATE OR REPLACE FUNCTION update_ai_workflows_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_workflows_timestamp
BEFORE UPDATE ON ai_assistant_workflows
FOR EACH ROW
EXECUTE FUNCTION update_ai_workflows_timestamp();

-- Update updated_at timestamp on duplicate_complaint_checks
CREATE OR REPLACE FUNCTION update_duplicate_checks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_duplicate_checks_timestamp
BEFORE UPDATE ON duplicate_complaint_checks
FOR EACH ROW
EXECUTE FUNCTION update_duplicate_checks_timestamp();

-- Insert default language preferences for new users
CREATE OR REPLACE FUNCTION create_default_language_preference()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_language_preferences (user_id, preferred_language)
    VALUES (NEW.id, 'en-IN')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_language_preference
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_language_preference();
