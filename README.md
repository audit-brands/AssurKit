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

### Running with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/AssurKit.git
cd AssurKit

# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8080
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

## Architecture

- **Frontend**: React + TypeScript + shadcn/ui + Recharts
- **Backend**: Slim PHP 4 with PostgreSQL
- **Storage**: MinIO/S3-compatible for evidence files
- **Authentication**: OAuth2/OIDC or JWT
- **Infrastructure**: Docker, Nginx, PostgreSQL, Redis (optional)

## Core Modules

### Risk & Control Management
- Hierarchical entity structure (Company → Process → Subprocess)
- Risk identification and assessment
- Control design and mapping
- Risk Control Matrix (RCM) visualization

### Testing & Evidence
- Test planning and execution workflows
- Evidence collection with SHA-256 checksums
- Sample selection and documentation
- Review and approval workflows

### Issue Management
- Exception tracking and severity classification
- Root cause analysis
- Remediation plans and tracking
- Retest scheduling

### Reporting & Analytics
- Real-time dashboards with Recharts
- Status tracking by process and control
- Exception trends and heatmaps
- CSV export capabilities

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