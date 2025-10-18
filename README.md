# AssurKit

Open-source SOX-first GRC platform for internal audit and compliance teams.

## Overview

AssurKit is a community-driven, open-source Governance, Risk, and Compliance (GRC) platform designed for internal audit teams, boutique consulting firms, and enterprises that value transparency and control over their compliance tools. Starting with robust SOX compliance workflows, AssurKit provides a solid foundation for risk control matrices (RCM), control testing, evidence management, and issue tracking.

## Key Features

- **SOX-First Design**: Optimized workflows for RCM → test planning → evidence collection → review → remediation
- **Self-Hosted**: Complete control over your data with on-premises deployment
- **Modern Tech Stack**: React/TypeScript frontend with shadcn/ui components and Slim PHP backend
- **Enterprise Ready**: Built-in RBAC, audit trails, and evidence immutability
- **Open & Extensible**: Clean APIs, modular architecture, and pluggable integrations

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- PHP 8.2+ (for local development)
- Composer (for local development) - See [Composer Installation](#composer-installation) below

### Running with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/AssurKit.git
cd AssurKit

# Start all services
cd infra && docker-compose up

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8080
```

#### First-Time Setup

When you run `docker-compose up` from the `infra/` directory for the first time, the system will automatically:

1. **Initialize the PostgreSQL database** with the required schema
2. **Run database migrations** to create all tables (users, roles, user_roles, etc.)
3. **Seed comprehensive demo data** including:
   - 4 user accounts with different roles
   - Demo company (Acme Corporation) with business processes
   - Risks and controls with RCM mappings
   - Sample tests with evidence
   - Complete SOX workflow demonstration

#### Demo User Accounts

After the initial setup, you can log in with any of these demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@assurkit.local` | `admin123` | Full system access, user management |
| **Manager** | `manager@assurkit.local` | `manager123` | Create/edit entities, controls, tests |
| **Tester** | `tester@assurkit.local` | `tester123` | Execute tests, upload evidence |
| **Viewer** | `viewer@assurkit.local` | `viewer123` | Read-only access for auditors |

**⚠️ IMPORTANT**: Change these default credentials immediately in production!

#### Customizing Default Settings

You can customize the default admin account by setting environment variables before starting:

```bash
# Create a .env file in the api directory
cp api/.env.example api/.env

# Edit the .env file with your preferred admin credentials:
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=your-secure-password

# Then start the services
cd infra && docker-compose up
```

#### Database Management Commands

If you need to manage the database manually:

```bash
# Run migrations manually
cd infra && docker-compose exec api php migrate.php migrate

# Seed data manually
cd infra && docker-compose exec api php seed.php

# Rollback migrations (⚠️ This will delete all data)
cd infra && docker-compose exec api php migrate.php rollback

# Access PostgreSQL directly
cd infra && docker-compose exec postgres psql -U assurkit -d assurkit
```

### Local Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd api
composer install
php -S localhost:8080 -t public
```

#### Composer Installation

For local backend development, you need Composer to manage PHP dependencies. The `composer` binary is intentionally **not** included in this repository.

**Option 1: Global Installation (Recommended)**

```bash
# macOS (via Homebrew)
brew install composer

# Linux
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Windows
# Download and run the installer from https://getcomposer.org/download/
```

**Option 2: Project-Local Installation**

```bash
cd api
curl -sS https://getcomposer.org/installer | php
# This creates composer.phar in the api directory
# Use it with: php composer.phar install
```

**Verify Installation:**
```bash
composer --version
# Should output: Composer version 2.x.x
```

For more details, visit the [official Composer documentation](https://getcomposer.org/doc/00-intro.md).

**Note:** Docker users don't need to install Composer locally, as it's included in the API Docker container.

## Architecture

- **Frontend**: React + TypeScript + shadcn/ui + Recharts
- **Backend**: Slim PHP 4 with PostgreSQL
- **Storage**: MinIO/S3-compatible for evidence files
- **Authentication**: OAuth2/OIDC or JWT
- **Infrastructure**: Docker, Nginx, PostgreSQL, Redis (optional)

## User Features & Capabilities

AssurKit provides a comprehensive SOX compliance management platform with the following key features:

### 🏢 Entity Management
- **Company Hierarchy**: Manage companies, processes, and subprocesses
- **Process Mapping**: Define business processes and their relationships
- **Subprocess Details**: Break down processes into manageable components
- **CRUD Operations**: Full create, read, update, delete capabilities

### 🎯 Risk & Control Management
- **Risk Assessment**: Document and categorize risks across business processes
- **Control Design**: Define preventive and detective controls
- **Control Mapping**: Link controls to specific risks and processes
- **Control Lifecycle**: Track controls from draft to active to retired status
- **Key Controls**: Flag and manage key vs. non-key controls

### 📊 Risk-Control Matrix (RCM)
- **Interactive Grid**: Visual representation of risk-control relationships
- **Hierarchical View**: Expandable tree structure for complex mappings
- **Effectiveness Scoring**: Visual indicators for control effectiveness
- **Coverage Analysis**: Identify uncovered risks and control gaps
- **CSV Export**: Export RCM data for external reporting
- **Advanced Filtering**: Filter by effectiveness, risk level, control status

### 🧪 Control Testing
- **Test Planning**: Create comprehensive test plans for controls
- **Test Execution**: Execute tests with structured procedures
- **Test Cycles**: Organize testing into periods and cycles
- **Sample Selection**: Define and track test samples
- **Test Status Tracking**: Monitor progress from planned to concluded
- **Test Results**: Document pass/fail/qualified outcomes
- **Reviewer Assignment**: Assign testers and reviewers

### 📁 Evidence Management
- **Secure File Upload**: Drag-and-drop upload with validation
- **File Types**: Support for PDF, DOC, XLS, images, TXT, CSV, JSON
- **Checksum Verification**: SHA-256 checksums for file integrity
- **Metadata Management**: Description, tags, confidentiality levels
- **Key Evidence**: Flag critical evidence for audits
- **File Preview**: In-browser preview for supported file types
- **Advanced Search**: Search by filename, content, metadata, tags
- **Bulk Operations**: Mass update or delete operations
- **Storage Analytics**: Track file counts, sizes, and trends
- **Retention Management**: Manage evidence retention policies

### 🔍 Advanced Search & Filtering
- **Multi-Criteria Search**: Search across multiple data fields
- **Filter Persistence**: Maintain filter state across sessions
- **Tag-Based Filtering**: Organize content with custom tags
- **Date Range Filtering**: Filter by upload dates and periods
- **Status Filtering**: Filter by workflow status
- **Visual Filter Indicators**: Clear display of active filters

### 📈 Analytics & Reporting
- **Executive Dashboard**: High-level metrics and trends
- **Evidence Statistics**: File type distribution and storage metrics
- **Test Progress**: Testing completion rates and timelines
- **Control Coverage**: Risk coverage and gap analysis
- **Trend Analysis**: Monthly and periodic trend charts
- **Interactive Charts**: Recharts-powered visualizations
- **Export Capabilities**: CSV export for external reporting

### 🔐 Security & Compliance Features
- **Role-Based Access Control**: Admin, Manager, Tester, Viewer roles
- **Audit Trail**: Complete tracking of all changes
- **Data Encryption**: HTTPS/TLS for all communications
- **File Validation**: Strict file type and size validation
- **Immutable Evidence**: Checksums prevent tampering
- **Confidentiality Levels**: Public, Internal, Confidential, Restricted
- **Secure Downloads**: Protected file download URLs

### 🎨 User Experience
- **Modern Interface**: Clean, intuitive design with shadcn/ui
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Themes**: User preference support
- **Accessibility**: WCAG 2.1 AA compliance
- **Keyboard Navigation**: Full keyboard support
- **Loading States**: Clear feedback during operations
- **Error Handling**: Comprehensive error messages and recovery

### 📋 Workflow Management
- **Status Tracking**: Clear status for all entities
- **Assignment Management**: Assign tasks to team members
- **Due Date Tracking**: Monitor deadlines and overdue items
- **Notification System**: Alerts for important updates
- **Progress Indicators**: Visual progress tracking
- **Bulk Actions**: Efficient mass operations

### 🔄 Integration Ready
- **API-First Design**: RESTful API for all operations
- **TypeScript Safety**: Full type safety throughout
- **Modular Architecture**: Easy to extend and customize
- **Docker Deployment**: Container-ready for any environment
- **Self-Hosted**: Complete control over your data

### 📊 Data Management
- **Pagination**: Efficient handling of large datasets
- **Real-Time Updates**: Live data with TanStack Query
- **Optimistic Updates**: Immediate UI feedback
- **Caching**: Smart caching for performance
- **Offline Resilience**: Graceful handling of connectivity issues

This comprehensive feature set provides everything needed for effective SOX compliance management, from initial risk assessment through evidence collection and audit reporting.

## Documentation

- [Vision & Roadmap](docs/assurkit_vision_roadmap_v_0.md)
- [Development Guide](CLAUDE.md)
- [API Documentation](docs/api/) (coming soon)
- [User Guide](docs/user-guide/) (coming soon)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

### Code Quality
- All PRs must pass CI checks
- Frontend: ESLint, TypeScript, Jest
- Backend: PHP-CS-Fixer, Psalm, Pest
- Required GitHub Actions workflows enforce standards

## Roadmap

### Phase 1 - SOX MVP (Current)
- Core RCM functionality
- Control testing workflows
- Evidence management
- Basic dashboards

### Phase 2 - Collaboration
- User assignments and notifications
- Review workflows
- Advanced filtering

### Phase 3 - Extensions
- Plugin system
- Advanced analytics
- Custom report builder

## License

AssurKit is licensed under [AGPL-3.0](LICENSE). This ensures the project remains open-source while allowing for commercial extensions.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/AssurKit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/AssurKit/discussions)
- **Security**: Please report security vulnerabilities to security@assurkit.org

## Community

- Follow us on [Twitter](https://twitter.com/assurkit)
- Join our [Discord](https://discord.gg/assurkit)
- Read our [Blog](https://blog.assurkit.org)

## Acknowledgments

Built with open-source technologies including React, TypeScript, Slim PHP, PostgreSQL, and shadcn/ui.

---

**AssurKit** - Bringing transparency and control to GRC