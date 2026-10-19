import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (on pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "George Steuart Health — Server Deployment & Operations Guide")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)

        # Footer (on all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.drawString(54, 32, "CONFIDENTIAL — George Steuart Health (Pvt) Ltd © 2026")
        self.restoreState()


def create_deployment_pdf(md_path, pdf_path):
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        borderColor=colors.HexColor('#cbd5e1'),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6,
        borderRadius=4
    )

    tbl_header_style = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    tbl_cell_code = ParagraphStyle(
        'TblCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#047857')
    )

    story = []

    # Title & Header
    story.append(Paragraph("George Steuart Health — Dashboard", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#c8102e'), spaceAfter=4)))
    story.append(Paragraph("Complete Server Deployment & Operations Guide", title_style))
    story.append(Paragraph("A comprehensive, production-tested manual covering architecture, initial deployment, background services, reverse proxying, credential governance, and 1-click update pipelines.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceBefore=2, spaceAfter=14))

    # Helper to parse markdown table
    def build_table_flowable(headers, rows, col_widths):
        data = [[Paragraph(h, tbl_header_style) for h in headers]]
        for r_idx, r in enumerate(rows):
            row_cells = []
            for c_idx, cell in enumerate(r):
                c_str = cell.strip()
                if c_str.startswith('`') and c_str.endswith('`'):
                    p = Paragraph(c_str.strip('`'), tbl_cell_code)
                elif c_str.startswith('**') and c_str.endswith('**'):
                    p = Paragraph(c_str.strip('*'), tbl_cell_bold)
                else:
                    clean = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', c_str)
                    clean = re.sub(r'`(.*?)`', r'<font face="Courier" color="#047857">\1</font>', clean)
                    p = Paragraph(clean, tbl_cell_style)
                row_cells.append(p)
            data.append(row_cells)

        t = Table(data, colWidths=col_widths)
        t_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f766e')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
            ('TOPPADDING', (0, 0), (-1, 0), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                t_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f8fafc')))
        t.setStyle(TableStyle(t_style))
        return t

    # 1. Architecture Overview
    story.append(Paragraph("1. Server & System Architecture Overview", h1_style))
    arch_headers = ["Component", "Specification / Configuration"]
    arch_rows = [
        ["**Server Host IP**", "`172.16.7.10`"],
        ["**Domain / URL**", "`http://gsh-sd.georgesteuart.lk` (Local Corporate Network)"],
        ["**SSH User**", "`tmsadmin`"],
        ["**Project Root Directory**", "`/var/www/dashboard`"],
        ["**Backend Directory**", "`/var/www/dashboard/backend`"],
        ["**Frontend Directory**", "`/var/www/dashboard/frontend`"],
        ["**Backend Service**", "`dashboard.service` (Systemd / Uvicorn ASGI on Port 8000)"],
        ["**Web Server / Proxy**", "Nginx (Port 80) serving `/frontend/dist` & proxying `/api`"],
        ["**Database**", "MySQL (Database: `gsh_dashboard` on Port 3306)"],
        ["**External Integrations**", "Oracle ERP Database (Live Invoices & Backlog), Axienta SFA Cloud"],
    ]
    story.append(build_table_flowable(arch_headers, arch_rows, [160, 344]))
    story.append(Spacer(1, 10))

    # 2. Login Credentials
    story.append(Paragraph("Default System Login Credentials", h1_style))
    cred_headers = ["Role", "Username", "Email", "Default Password", "Permissions / Access Level"]
    cred_rows = [
        ["**🛡️ Admin**", "`admin`", "`admin@gsh.lk`", "`Admin@GSH2026!`", "Full administrative privileges (Formula guides, user management, sync, upload, mappings)"],
        ["**👤 Standard**", "`user`", "`user@gsh.lk`", "`User@GSH2026!`", "Dashboard executive viewer access (View charts, division reports, backlog filters)"],
        ["**🏢 SSO**", "Corporate", "`name@georgesteuart.lk`", "Office 365 Pass", "Microsoft Entra ID (Azure AD) Single Sign-On Authentication"],
    ]
    story.append(build_table_flowable(cred_headers, cred_rows, [65, 60, 110, 105, 164]))
    story.append(Spacer(1, 12))

    # 3. Initial Setup
    story.append(Paragraph("2. Initial Server Setup & Deployment Steps", h1_style))
    story.append(Paragraph("Step 1: Install Server Prerequisites & System Packages", h2_style))
    s1_code = """sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx mysql-server git libaio1 libaio-dev curl"""
    story.append(Paragraph(s1_code.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Step 2: Install Oracle Instant Client (For Oracle DB Integration)", h2_style))
    story.append(Paragraph("Oracle Client drivers are required to connect directly to the Oracle ERP database for live Invoices and Backlog data retrieval:", body_style))
    s2_code = """# 1. Create directory and extract Oracle Instant Client files
sudo mkdir -p /opt/oracle
cd /opt/oracle
# (Extract instantclient-basic-linux.x64-19.x.zip into /opt/oracle)

# 2. Configure Environment Variables & Library path
echo "/opt/oracle/instantclient_19_24" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Symlink fix for libaio on Ubuntu 24.04+:
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 || true
sudo ldconfig"""
    story.append(Paragraph(s2_code.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Step 3: Setup Project Directory & Clone Codebase", h2_style))
    s3_code = """sudo mkdir -p /var/www/dashboard
sudo chown -R $USER:$USER /var/www/dashboard
cd /var/www/dashboard
# (Copy or clone codebase into /var/www/dashboard)"""
    story.append(Paragraph(s3_code.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Step 4: Backend Virtual Environment & Dependencies Setup", h2_style))
    s4_code = """cd /var/www/dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt"""
    story.append(Paragraph(s4_code.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Backend Environment File (<code>/var/www/dashboard/backend/.env</code>):", body_style))
    s4_env = """DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gsh_dashboard
ORACLE_USER=YOUR_ORACLE_USER
ORACLE_PASSWORD=YOUR_ORACLE_PASSWORD
ORACLE_DSN=172.16.x.x:1521/ORCL
AXIENTA_API_URL=https://api.axienta.lk"""
    story.append(Paragraph(s4_env.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Step 5: Configure Systemd Background Service", h2_style))
    story.append(Paragraph("Create <code>/etc/systemd/system/dashboard.service</code> to keep Uvicorn running 24/7:", body_style))
    s5_unit = """[Unit]
Description=GSH Dashboard FastAPI Backend Server
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=/var/www/dashboard/backend
ExecStart=/var/www/dashboard/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
EnvironmentFile=/var/www/dashboard/backend/.env

[Install]
WantedBy=multi-user.target"""
    story.append(Paragraph(s5_unit.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Enable and Start the Service:", body_style))
    s5_cmds = """sudo systemctl daemon-reload
sudo systemctl enable dashboard
sudo systemctl restart dashboard
sudo systemctl status dashboard"""
    story.append(Paragraph(s5_cmds.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Step 6: Frontend Build & Nginx Configuration", h2_style))
    story.append(Paragraph("Frontend Production Environment (<code>/var/www/dashboard/frontend/.env.production</code>): <code>VITE_API_URL=/api</code>", body_style))
    s6_bld = """cd /var/www/dashboard/frontend
npm install
npm run build"""
    story.append(Paragraph(s6_bld.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Nginx Site Configuration (<code>/etc/nginx/sites-available/dashboard</code>):", body_style))
    s6_nginx = """server {
    listen 80;
    server_name gsh-sd.georgesteuart.lk 172.16.7.10;

    root /var/www/dashboard/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}"""
    story.append(Paragraph(s6_nginx.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Activate Site and Reload Nginx:", body_style))
    s6_act = """sudo ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx"""
    story.append(Paragraph(s6_act.replace('\n', '<br/>'), code_style))

    # 4. Deployment Procedures
    story.append(Paragraph("3. How to Deploy New Updates to the Server", h1_style))
    story.append(Paragraph("Method 1: Manual Step-by-Step Deployment", h2_style))
    m1_code = """# 1. Connect via SSH
ssh tmsadmin@172.16.7.10

# 2. Pull Latest Code
cd /var/www/dashboard
git pull origin main

# 3. Update Backend Dependencies and Restart
cd /var/www/dashboard/backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart dashboard

# 4. Rebuild Frontend Assets and Reload Nginx
cd /var/www/dashboard/frontend
npm install
npm run build
sudo systemctl reload nginx

# 5. Verify Health Endpoint
curl -s http://127.0.0.1:8000/api/health"""
    story.append(Paragraph(m1_code.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("Method 2: Automated 1-Click Update Script (Recommended)", h2_style))
    story.append(Paragraph("An automated shell script <code>/var/www/dashboard/deploy.sh</code> is available on the server to execute all update and verification steps in one sequence:", body_style))
    m2_script = """#!/bin/bash
set -e
echo "=========================================="
echo "🚀 Starting GSH Dashboard Production Deploy"
echo "=========================================="
cd /var/www/dashboard

# 1. Pull latest code
echo "📥 1. Pulling latest git updates..."
git pull origin main || echo "⚠️ Git pull skipped or not configured."

# 2. Update Backend
echo "⚙️ 2. Updating Backend..."
cd /var/www/dashboard/backend
source .venv/bin/activate
pip install -r requirements.txt --quiet
sudo systemctl restart dashboard

# 3. Update Frontend
echo "📦 3. Building Frontend Assets..."
cd /var/www/dashboard/frontend
npm install --silent
npm run build
sudo systemctl reload nginx

# 4. Verification
echo "🩺 4. Verifying Health Status..."
sleep 2
HEALTH=$(curl -s http://127.0.0.1:8000/api/health)
echo "Backend Status: $HEALTH"
echo "=========================================="
echo "✅ Deployment Completed Successfully!"
echo "🌐 Dashboard URL: http://gsh-sd.georgesteuart.lk"
echo "==========================================" """
    story.append(Paragraph(m2_script.replace('\n', '<br/>'), code_style))

    story.append(Paragraph("To execute any future update, run simply:", body_style))
    story.append(Paragraph("sudo /var/www/dashboard/deploy.sh", code_style))

    # 5. Troubleshooting
    story.append(Paragraph("4. Common Troubleshooting & Useful Commands", h1_style))
    ts_headers = ["Action / Task", "Command"]
    ts_rows = [
        ["View Live Backend Logs", "`sudo journalctl -u dashboard -f`"],
        ["View Nginx Error Logs", "`sudo tail -f /var/log/nginx/error.log`"],
        ["Restart Backend Service", "`sudo systemctl restart dashboard`"],
        ["Reload Nginx Server", "`sudo systemctl reload nginx`"],
        ["Check MySQL Service Status", "`sudo systemctl status mysql`"],
        ["Check Port 8000 Activity", "`sudo netstat -tulpn | grep 8000`"],
        ["Check Oracle Client Libs", "`ldconfig -p | grep libclntsh`"],
        ["Test Backend Health Endpoint", "`curl -s http://127.0.0.1:8000/api/health`"],
    ]
    story.append(build_table_flowable(ts_headers, ts_rows, [180, 324]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {pdf_path}")

if __name__ == "__main__":
    src_md = r"d:\new_GS\GS_health_Dashbord\DEPLOYMENT_GUIDE.md"
    dst_pdf = r"d:\new_GS\GS_health_Dashbord\DEPLOYMENT_GUIDE.pdf"
    create_deployment_pdf(src_md, dst_pdf)
