import { FileDown, FileSpreadsheet, FolderKanban, Printer, ReceiptText, Users } from 'lucide-react'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import { reportCards } from '../data/mockData'

function ReportsPage() {
  return (
    <div className="page-layout">
      <PageHeader
        title="Reports"
        subtitle="Generate attendance, student, and fee summaries for export or printing."
        action={(
          <button type="button" className="primary-button">
            <Printer size={16} />
            Print Preview
          </button>
        )}
      />
      <section className="metric-grid compact-four">
        <MetricCard icon={FolderKanban} label="Total reports" value="3" tone="brand" />
        <MetricCard icon={Users} label="Student reports" value="1" tone="success" />
        <MetricCard icon={ReceiptText} label="Fee reports" value="1" tone="warning" />
      </section>
      <div className="card-grid">
        {reportCards.map((report) => (
          <section key={report.title} className="panel-shell report-panel">
            <div className="panel-heading">
              <h3>{report.title}</h3>
              <p>{report.detail}</p>
            </div>
            <div className="button-row">
              <button type="button" className="toolbar-button">
                <FileSpreadsheet size={16} />
                Export CSV
              </button>
              <button type="button" className="primary-button">
                <FileDown size={16} />
                Export PDF
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
