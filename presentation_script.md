# Presentation Script: Supabase MCP Connector Capabilities

**Slide 1: Title Slide**
*(Visual: Supabase Logo and MCP Connector Title)*

**Speaker Notes:**
"Hello everyone, and thank you for joining me today. Today, we are going to explore the Supabase MCP Connector—a powerful tool that enables seamless, programmatic management of your Supabase environment. We'll walk through its core capabilities and look at some live data fetched directly from an active account to see it in action."

---

**Slide 2: Core Capabilities Overview**
*(Visual: Four pillars showing Organization Management, Database Introspection, Edge Functions, and Security/Logs)*

**Speaker Notes:**
"The connector is incredibly robust, offering 29 distinct tools. We can group these into four main pillars. 
First, **Organization & Project Management**, which allows us to view and manage projects, retrieve API keys, and handle branching.
Second, **Database & Schema Introspection**, enabling us to list tables, apply migrations, and execute raw SQL safely.
Third, **Edge Functions**, where we can deploy, list, and retrieve source code for our serverless functions.
And finally, **Security, Logs, and Types**, which provides crucial security advisories, access to system logs, and the ability to generate TypeScript definitions directly from the database schema."

---

**Slide 3: Organization and Projects in Action**
*(Visual: A snapshot of the organization 'mykemueller1-ctrl's Org' and its three projects: never86, mykemueller1-ctrl's Project, and operators)*

**Speaker Notes:**
"To make this concrete, let's look at some live data. Using the connector, we successfully queried the organization 'mykemueller1-ctrl's Org', which is currently on the Pro plan. 
We identified three active projects: 'never86' in the US East 1 region, 'mykemueller1-ctrl's Project' in US East 2, and the 'operators' project in US West 2. For the rest of this demonstration, we'll focus our deep dive on the 'operators' project."

---

**Slide 4: Database Introspection - The 'operators' Schema**
*(Visual: Diagram or list showing tables like inventory_items, recipes, sales_data, blog_posts, etc.)*

**Speaker Notes:**
"Diving into the 'operators' database, the connector easily mapped out the schema. We found several interconnected tables managing both a point-of-sale system and a blog. 
Key tables include `inventory_items`, `recipes`, `sales_data`, as well as `blog_users`, `blog_posts`, and `blog_comments`."

---

**Slide 5: Querying Live Data - The Blog**
*(Visual: A clean table showing the latest blog posts and comments)*

**Speaker Notes:**
"By executing safe SQL queries through the connector, we can pull live data. For example, joining the blog posts and users tables reveals recent articles like 'Postgres Performance Basics' by Mia Chen and 'Supabase Tips & Tricks' by Noah Patel.
We can also see active community engagement, with comments like 'This is super helpful' directly linked to those posts. This demonstrates how easily we can extract meaningful, relational data programmatically."

---

**Slide 6: Edge Functions - The 'variance-alert'**
*(Visual: Code snippet of the 'variance-alert' edge function alongside a 401 Unauthorized log error)*

**Speaker Notes:**
"Moving on to Edge Functions, the connector identified an active function named `variance-alert`. We retrieved its source code and saw that it's designed to monitor inventory levels, triggering 'Oh Shit' alerts when stock falls below a specific threshold.
Crucially, by pulling the edge runtime logs, we noticed recent POST requests to this endpoint were returning '401 Unauthorized' errors. This immediately highlights a missing valid JWT in those requests, showing how the connector aids in rapid debugging."

---

**Slide 7: Security Advisors & TypeScript Generation**
*(Visual: Bulleted list of security warnings and a snippet of generated TypeScript interfaces)*

**Speaker Notes:**
"Security and developer experience are paramount. The connector's `get_advisors` tool proactively scanned the 'operators' project and flagged a few items: tables with Row Level Security enabled but no policies, a role-mutable search path on a function, and some extensions installed in the public schema.
Additionally, to ensure end-to-end type safety for developers, we used the connector to generate complete TypeScript definitions for the entire database schema in seconds."

---

**Slide 8: Conclusion**
*(Visual: Summary graphic reinforcing programmatic management, security, and efficiency)*

**Speaker Notes:**
"In conclusion, the Supabase MCP connector is a highly capable integration. Whether you are managing multiple projects, querying live relational data, debugging edge functions, or auditing your security posture, it provides a comprehensive, programmatic, and secure way to interact with your Supabase infrastructure.
Thank you for your time. I'm happy to answer any questions or dive deeper into any of these features."
