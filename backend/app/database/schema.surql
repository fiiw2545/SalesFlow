-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- TABLE: activities
-- ------------------------------

DEFINE TABLE activities TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE contact_id ON activities TYPE none | record<contacts> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON activities TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE deal_id ON activities TYPE none | record<deals> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE description ON activities TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON activities TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE performed_by ON activities TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE subject ON activities TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE type ON activities TYPE string PERMISSIONS FULL;

DEFINE INDEX activities_contact_idx ON activities FIELDS contact_id;
DEFINE INDEX activities_deal_idx ON activities FIELDS deal_id;
DEFINE INDEX activities_org_idx ON activities FIELDS organization_id;


-- ------------------------------
-- TABLE: companies
-- ------------------------------

DEFINE TABLE companies TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE address ON companies TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON companies TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_by ON companies TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE industry ON companies TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON companies TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON companies TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE phone ON companies TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON companies TYPE none | datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE website ON companies TYPE none | string PERMISSIONS FULL;

DEFINE INDEX companies_name_idx ON companies FIELDS organization_id, name;
DEFINE INDEX companies_org_idx ON companies FIELDS organization_id;


-- ------------------------------
-- TABLE: company_tags
-- ------------------------------

DEFINE TABLE company_tags TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE company_id ON company_tags TYPE record<companies> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON company_tags TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON company_tags TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE tag_id ON company_tags TYPE record<tags> PERMISSIONS FULL;

DEFINE INDEX company_tags_org_idx ON company_tags FIELDS organization_id;
DEFINE INDEX company_tags_unique ON company_tags FIELDS company_id, tag_id UNIQUE;


-- ------------------------------
-- TABLE: contact_tags
-- ------------------------------

DEFINE TABLE contact_tags TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE contact_id ON contact_tags TYPE record<contacts> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON contact_tags TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON contact_tags TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE tag_id ON contact_tags TYPE record<tags> PERMISSIONS FULL;

DEFINE INDEX contact_tags_org_idx ON contact_tags FIELDS organization_id;
DEFINE INDEX contact_tags_unique ON contact_tags FIELDS contact_id, tag_id UNIQUE;


-- ------------------------------
-- TABLE: contacts
-- ------------------------------

DEFINE TABLE contacts TYPE ANY SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE age ON contacts TYPE none | int PERMISSIONS FULL;
DEFINE FIELD OVERWRITE company_id ON contacts TYPE none | record<companies> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON contacts TYPE datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_by ON contacts TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE email ON contacts TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON contacts TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON contacts TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE phone ON contacts TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE position ON contacts TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON contacts TYPE none | datetime PERMISSIONS FULL;



-- ------------------------------
-- TABLE: deals
-- ------------------------------

DEFINE TABLE deals TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE company_id ON deals TYPE none | record<companies> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE contact_id ON deals TYPE none | record<contacts> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON deals TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE currency ON deals TYPE string DEFAULT 'THB' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE expected_close_date ON deals TYPE none | datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON deals TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE owner_id ON deals TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE stage_id ON deals TYPE record<stages> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status ON deals TYPE string DEFAULT 'OPEN' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE title ON deals TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON deals TYPE none | datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE `value` ON deals TYPE decimal PERMISSIONS FULL;

DEFINE INDEX deals_org_idx ON deals FIELDS organization_id;
DEFINE INDEX deals_owner_idx ON deals FIELDS owner_id;
DEFINE INDEX deals_stage_idx ON deals FIELDS stage_id;


-- ------------------------------
-- TABLE: memberships
-- ------------------------------

DEFINE TABLE memberships TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE joined_at ON memberships TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON memberships TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE role ON memberships TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE user_id ON memberships TYPE record<users> PERMISSIONS FULL;

DEFINE INDEX memberships_user_org_unique ON memberships FIELDS user_id, organization_id UNIQUE;


-- ------------------------------
-- TABLE: notes
-- ------------------------------

DEFINE TABLE notes TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE company_id ON notes TYPE none | record<companies> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE contact_id ON notes TYPE none | record<contacts> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE content ON notes TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON notes TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_by ON notes TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE deal_id ON notes TYPE none | record<deals> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON notes TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE title ON notes TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON notes TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX notes_company_idx ON notes FIELDS company_id;
DEFINE INDEX notes_contact_idx ON notes FIELDS contact_id;
DEFINE INDEX notes_deal_idx ON notes FIELDS deal_id;
DEFINE INDEX notes_org_idx ON notes FIELDS organization_id;


-- ------------------------------
-- TABLE: organizations
-- ------------------------------

DEFINE TABLE organizations TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE created_at ON organizations TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE is_active ON organizations TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON organizations TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE plan ON organizations TYPE string DEFAULT 'FREE' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE slug ON organizations TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON organizations TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX organizations_slug_unique ON organizations FIELDS slug UNIQUE;


-- ------------------------------
-- TABLE: pipelines
-- ------------------------------

DEFINE TABLE pipelines TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE created_at ON pipelines TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_by ON pipelines TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE description ON pipelines TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE is_default ON pipelines TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON pipelines TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON pipelines TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON pipelines TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX pipelines_org_name_idx ON pipelines FIELDS organization_id, name UNIQUE;


-- ------------------------------
-- TABLE: stages
-- ------------------------------

DEFINE TABLE stages TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE created_at ON stages TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON stages TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE pipeline_id ON stages TYPE record<pipelines> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE position ON stages TYPE int PERMISSIONS FULL;
DEFINE FIELD OVERWRITE probability ON stages TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100 PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON stages TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX stages_pipeline_position_idx ON stages FIELDS pipeline_id, position UNIQUE;


-- ------------------------------
-- TABLE: tags
-- ------------------------------

DEFINE TABLE tags TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE color ON tags TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON tags TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON tags TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON tags TYPE record<organizations> PERMISSIONS FULL;

DEFINE INDEX tags_org_name_unique ON tags FIELDS organization_id, name UNIQUE;


-- ------------------------------
-- TABLE: tasks
-- ------------------------------

DEFINE TABLE tasks TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE assigned_to ON tasks TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE completed_at ON tasks TYPE none | datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE contact_id ON tasks TYPE none | record<contacts> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON tasks TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE deal_id ON tasks TYPE none | record<deals> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE description ON tasks TYPE none | string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE due_date ON tasks TYPE none | datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization_id ON tasks TYPE record<organizations> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE priority ON tasks TYPE string DEFAULT 'MEDIUM' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status ON tasks TYPE string DEFAULT 'PENDING' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE title ON tasks TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON tasks TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX tasks_assigned_idx ON tasks FIELDS assigned_to;
DEFINE INDEX tasks_due_date_idx ON tasks FIELDS due_date;
DEFINE INDEX tasks_org_idx ON tasks FIELDS organization_id;


-- ------------------------------
-- TABLE: users
-- ------------------------------

DEFINE TABLE users TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE created_at ON users TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE email ON users TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE is_active ON users TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON users TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE password_hash ON users TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON users TYPE none | datetime PERMISSIONS FULL;

DEFINE INDEX users_email_unique ON users FIELDS email UNIQUE;


