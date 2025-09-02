-- Project Persistence System Migration
-- Development Database: jmfkzfmripuzfspijndq ONLY

-- Create Project table
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stage" TEXT NOT NULL DEFAULT 'initial',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Create ProjectSession table
CREATE TABLE IF NOT EXISTS "public"."project_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "conversationId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'initial',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "sessionData" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sessions_pkey" PRIMARY KEY ("id")
);

-- Create ConversationSummary table
CREATE TABLE IF NOT EXISTS "public"."conversation_summaries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "messageRange" TEXT NOT NULL,
    "originalTokens" INTEGER NOT NULL,
    "summaryTokens" INTEGER NOT NULL,
    "compressionRatio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- Create ProjectFile table
CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- Add projectId columns to existing tables
ALTER TABLE "public"."documents" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "public"."conversations" ADD COLUMN IF NOT EXISTS "projectId" TEXT;  
ALTER TABLE "public"."research_requests" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Add foreign key constraints
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."project_sessions" ADD CONSTRAINT "project_sessions_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."conversation_summaries" ADD CONSTRAINT "conversation_summaries_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."project_files" ADD CONSTRAINT "project_files_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for existing tables (only if columns were added successfully)
DO $$
BEGIN
    -- Add foreign key for documents.projectId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'documents_projectId_fkey'
    ) THEN
        ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add foreign key for conversations.projectId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_projectId_fkey'
    ) THEN
        ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add foreign key for research_requests.projectId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'research_requests_projectId_fkey'
    ) THEN
        ALTER TABLE "public"."research_requests" ADD CONSTRAINT "research_requests_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "project_sessions_projectId_conversationId_key" 
    ON "public"."project_sessions"("projectId", "conversationId");

-- Success message
SELECT 'Project Persistence System tables created successfully!' as status;